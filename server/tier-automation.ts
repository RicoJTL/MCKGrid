import { db } from "./db";
import { tieredLeagues, tierMovements, tierNames, results, races, raceCompetitions, tierRaceResults } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import { storage } from "./storage";

interface ShuffleResult {
  tieredLeagueId: number;
  atRaceCount: number;
  movements: Array<{
    profileId: number;
    fromTier: number;
    toTier: number;
    movementType: 'promotion' | 'relegation';
  }>;
}

/**
 * Main entry point: Called after race results are saved.
 * 
 * Logic:
 * 1. Count how many races in this competition now have results
 * 2. If (raceCount % shuffleInterval == 0), trigger shuffle:
 *    a. Calculate promotions/relegations based on current tier standings
 *    b. Move drivers between tiers
 *    c. Clear ALL tier points (reset to 0)
 * 3. Then (in routes.ts) save tier points for the current race
 */
export async function checkAndProcessTierShuffle(raceId: number): Promise<ShuffleResult[]> {
  console.log(`[Tier Automation] Checking shuffle for race ${raceId}`);
  
  const race = await storage.getRace(raceId);
  if (!race) {
    console.log(`[Tier Automation] Race ${raceId} not found`);
    return [];
  }

  const raceCompetitionLinks = await db.select()
    .from(raceCompetitions)
    .where(eq(raceCompetitions.raceId, raceId));
  
  if (raceCompetitionLinks.length === 0) {
    console.log(`[Tier Automation] Race ${raceId} not linked to any competition`);
    return [];
  }

  const competitionIds = raceCompetitionLinks.map(rc => rc.competitionId);
  
  const tieredLeaguesData = await db.select()
    .from(tieredLeagues)
    .where(inArray(tieredLeagues.parentCompetitionId, competitionIds));

  if (tieredLeaguesData.length === 0) {
    console.log(`[Tier Automation] No tiered leagues found for competitions ${competitionIds.join(', ')}`);
    return [];
  }

  const shuffleResults: ShuffleResult[] = [];

  for (const tieredLeague of tieredLeaguesData) {
    const raceCount = await countCompletedRaces(tieredLeague.parentCompetitionId);
    const shuffleInterval = tieredLeague.racesBeforeShuffle;
    
    console.log(`[Tier Automation] Competition ${tieredLeague.parentCompetitionId}: ${raceCount} races completed, shuffle every ${shuffleInterval} races`);
    
    // Simple check: if race count is a multiple of the interval, shuffle!
    const shouldShuffle = raceCount > 0 && raceCount % shuffleInterval === 0;
    
    // Calculate which shuffle number this would be (1st, 2nd, 3rd, etc.)
    const shuffleNumber = raceCount / shuffleInterval;
    
    console.log(`[Tier Automation] Should shuffle: ${shouldShuffle} (at race count ${raceCount})`);
    
    if (shouldShuffle) {
      // Check if a shuffle has already been processed at this exact race count
      // We use raceCount as the marker, not shuffleNumber
      const alreadyProcessed = await hasShuffleBeenProcessed(tieredLeague.id, raceCount);
      
      if (alreadyProcessed) {
        console.log(`[Tier Automation] Shuffle at race count ${raceCount} already processed, skipping`);
        continue;
      }
      
      console.log(`[Tier Automation] Processing shuffle at race count ${raceCount} for tiered league ${tieredLeague.id}`);
      
      // Get current standings to determine who gets promoted/relegated
      const standings = await storage.getTierStandings(tieredLeague.id);
      
      // Process the shuffle - store raceCount as afterRaceNumber for tracking
      const result = await processShuffleForTieredLeague(tieredLeague, raceCount, standings);
      
      if (result) {
        shuffleResults.push(result);
      }
      
      // CRITICAL: Clear ALL tier points after shuffle
      await clearAllTierPoints(tieredLeague.id);
      console.log(`[Tier Automation] Cleared all tier points for tiered league ${tieredLeague.id}`);
    }
  }

  return shuffleResults;
}

/**
 * Count how many races in this competition have at least one result
 */
async function countCompletedRaces(competitionId: number): Promise<number> {
  const racesWithResults = await db
    .selectDistinct({ raceId: results.raceId })
    .from(results)
    .innerJoin(raceCompetitions, eq(raceCompetitions.raceId, results.raceId))
    .where(eq(raceCompetitions.competitionId, competitionId));
  
  return racesWithResults.length;
}

/**
 * Check if a shuffle has already been processed (to prevent duplicates)
 * We track this by looking for tier_movements with a specific shuffleNumber in the afterRaceNumber field
 */
async function hasShuffleBeenProcessed(tieredLeagueId: number, shuffleNumber: number): Promise<boolean> {
  const existingMovements = await db.select()
    .from(tierMovements)
    .where(and(
      eq(tierMovements.tieredLeagueId, tieredLeagueId),
      eq(tierMovements.afterRaceNumber, shuffleNumber)
    ));
  
  // If there are any movements recorded for this shuffle number, it's been processed
  // Note: We also check for automatic movements specifically
  const automaticMovements = existingMovements.filter(m => 
    m.movementType === 'automatic_promotion' || m.movementType === 'automatic_relegation'
  );
  
  return automaticMovements.length > 0;
}

/**
 * Process promotions and relegations for a tiered league
 */
async function processShuffleForTieredLeague(
  tieredLeague: typeof tieredLeagues.$inferSelect,
  atRaceCount: number,
  standings: Awaited<ReturnType<typeof storage.getTierStandings>>
): Promise<ShuffleResult | null> {
  
  const tierNamesData = await storage.getTierNames(tieredLeague.id);
  const sortedTiers = tierNamesData.sort((a, b) => a.tierNumber - b.tierNumber);
  
  const movements: ShuffleResult['movements'] = [];
  
  // For each pair of adjacent tiers, swap bottom of higher tier with top of lower tier
  for (let i = 0; i < sortedTiers.length - 1; i++) {
    const higherTierNumber = sortedTiers[i].tierNumber;
    const lowerTierNumber = sortedTiers[i + 1].tierNumber;
    
    const higherTierStandings = standings.find(s => s.tierNumber === higherTierNumber);
    const lowerTierStandings = standings.find(s => s.tierNumber === lowerTierNumber);
    
    if (!higherTierStandings || !lowerTierStandings) continue;
    if (higherTierStandings.standings.length === 0 || lowerTierStandings.standings.length === 0) continue;
    
    // Get drivers to relegate (bottom of higher tier)
    const driversToRelegate = tieredLeague.relegationSpots > 0
      ? higherTierStandings.standings.slice(-tieredLeague.relegationSpots)
      : [];
    
    // Get drivers to promote (top of lower tier)
    const driversToPromote = tieredLeague.promotionSpots > 0
      ? lowerTierStandings.standings.slice(0, tieredLeague.promotionSpots)
      : [];
    
    console.log(`[Tier Automation] Tier ${higherTierNumber} -> ${lowerTierNumber}: Relegating ${driversToRelegate.map(d => d.driverName).join(', ')}`);
    console.log(`[Tier Automation] Tier ${lowerTierNumber} -> ${higherTierNumber}: Promoting ${driversToPromote.map(d => d.driverName).join(', ')}`);
    
    for (const driver of driversToRelegate) {
      movements.push({
        profileId: driver.profileId,
        fromTier: higherTierNumber,
        toTier: lowerTierNumber,
        movementType: 'relegation',
      });
    }
    
    for (const driver of driversToPromote) {
      movements.push({
        profileId: driver.profileId,
        fromTier: lowerTierNumber,
        toTier: higherTierNumber,
        movementType: 'promotion',
      });
    }
  }
  
  // Apply all movements
  for (const movement of movements) {
    const movementType = movement.movementType === 'promotion' ? 'automatic_promotion' : 'automatic_relegation';
    await storage.moveDriverToTier(
      tieredLeague.id,
      movement.profileId,
      movement.toTier,
      movementType,
      atRaceCount
    );
  }
  
  console.log(`[Tier Automation] Shuffle at race count ${atRaceCount} complete: ${movements.length} driver movements`);
  
  return {
    tieredLeagueId: tieredLeague.id,
    atRaceCount,
    movements,
  };
}

/**
 * Clear ALL tier race results for a tiered league (reset points to 0)
 */
async function clearAllTierPoints(tieredLeagueId: number): Promise<void> {
  await db.delete(tierRaceResults)
    .where(eq(tierRaceResults.tieredLeagueId, tieredLeagueId));
}

export async function getDriverTierMovementNotifications(profileId: number) {
  return await storage.getUnreadTierMovementNotifications(profileId);
}

export async function markNotificationRead(notificationId: number) {
  return await storage.markTierMovementNotificationRead(notificationId);
}
