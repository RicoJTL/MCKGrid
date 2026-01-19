import { db } from "./db";
import { tieredLeagues, tierAssignments, tierMovements, tierMovementNotifications, tierNames, results, races, raceCompetitions } from "@shared/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { storage } from "./storage";
import { checkTierBadgesAfterShuffle } from "./badge-automation";

interface TierStanding {
  profileId: number;
  points: number;
  position: number;
}

interface ShuffleResult {
  tieredLeagueId: number;
  movements: Array<{
    profileId: number;
    fromTier: number;
    toTier: number;
    movementType: 'promotion' | 'relegation';
  }>;
}

export async function checkAndProcessTierShuffle(raceId: number): Promise<ShuffleResult[]> {
  const race = await storage.getRace(raceId);
  if (!race) return [];

  const raceCompetitionLinks = await db.select()
    .from(raceCompetitions)
    .where(eq(raceCompetitions.raceId, raceId));
  
  if (raceCompetitionLinks.length === 0) return [];

  const competitionIds = raceCompetitionLinks.map(rc => rc.competitionId);
  
  const tieredLeaguesData = await db.select()
    .from(tieredLeagues)
    .where(inArray(tieredLeagues.parentCompetitionId, competitionIds));

  const shuffleResults: ShuffleResult[] = [];

  for (const tieredLeague of tieredLeaguesData) {
    const raceCount = await countCompetitionRaces(tieredLeague.parentCompetitionId);
    console.log(`[Tier Automation] Race ${raceId} results saved. Competition ${tieredLeague.parentCompetitionId} has ${raceCount} completed races. Shuffle interval: ${tieredLeague.racesBeforeShuffle}`);
    
    // Check if we've reached or passed a shuffle point
    // We check if (raceCount >= lastShuffleRace + interval)
    const lastShuffle = await db.select({ maxRace: sql<number>`CAST(max(after_race_number) AS INTEGER)` })
      .from(tierMovements)
      .where(eq(tierMovements.tieredLeagueId, tieredLeague.id));
    
    const lastShuffleRace = lastShuffle[0]?.maxRace || 0;
    
    // We should shuffle if we have reached or crossed an interval point that hasn't been processed
    // Example: interval 2. Shuffles should happen at race 2, 4, 6...
    // If current race is 3 and last shuffle was 0, we are OVERDUE for the race 2 shuffle.
    const nextExpectedShuffle = lastShuffleRace + tieredLeague.racesBeforeShuffle;
    const isShuffleDue = raceCount >= nextExpectedShuffle && raceCount > 0;
    
    // Check if we already have a shuffle recorded for this exact point
    const alreadyProcessed = isShuffleDue && await hasShuffleBeenProcessedAtRaceCount(tieredLeague.id, nextExpectedShuffle);

    console.log(`[Tier Automation] Race ${raceId} results saved. Competition ${tieredLeague.parentCompetitionId} has ${raceCount} completed races. Last shuffle at: ${lastShuffleRace}. Next expected: ${nextExpectedShuffle}. Should shuffle: ${isShuffleDue}. Already processed: ${alreadyProcessed}`);
    
    if (isShuffleDue && !alreadyProcessed) {
      // Record the shuffle as happening at the exact interval point (e.g. race 2) 
      // even if we are processing it slightly late (at race 3)
      const shufflePoint = nextExpectedShuffle;
      const result = await processShuffleForTieredLeague(tieredLeague, shufflePoint);
      if (result.movements.length > 0) {
        shuffleResults.push(result);
        
        // Check and award tier-related badges after the shuffle
        const tierStandings = await storage.getTierStandings(tieredLeague.id);
        await checkTierBadgesAfterShuffle(
          tieredLeague.id,
          result,
          tierStandings,
          {
            numberOfTiers: tieredLeague.numberOfTiers,
            relegationSpots: tieredLeague.relegationSpots,
          }
        );
      }
    }
  }

  return shuffleResults;
}

async function hasShuffleBeenProcessedAtRaceCount(tieredLeagueId: number, raceCount: number): Promise<boolean> {
  const existingMovements = await db.select()
    .from(tierMovements)
    .where(and(
      eq(tierMovements.tieredLeagueId, tieredLeagueId),
      eq(tierMovements.afterRaceNumber, raceCount)
    ));
  return existingMovements.length > 0;
}

async function countCompetitionRaces(competitionId: number): Promise<number> {
  const completedRaces = await db.select({ raceId: results.raceId })
    .from(results)
    .innerJoin(races, eq(races.id, results.raceId))
    .innerJoin(raceCompetitions, eq(raceCompetitions.raceId, races.id))
    .where(eq(raceCompetitions.competitionId, competitionId));
  
  const uniqueRaceIds = new Set(completedRaces.map(r => r.raceId));
  return uniqueRaceIds.size;
}

async function processShuffleForTieredLeague(tieredLeague: typeof tieredLeagues.$inferSelect, afterRaceNumber: number): Promise<ShuffleResult> {
  const standings = await storage.getTierStandings(tieredLeague.id);
  const tierNamesData = await storage.getTierNames(tieredLeague.id);
  const sortedTiers = tierNamesData.sort((a, b) => a.tierNumber - b.tierNumber);
  
  const movements: ShuffleResult['movements'] = [];
  
  for (let i = 0; i < sortedTiers.length - 1; i++) {
    const currentTierNumber = sortedTiers[i].tierNumber;
    const nextTierNumber = sortedTiers[i + 1].tierNumber;
    
    const currentTierStandings = standings.find(s => s.tierNumber === currentTierNumber);
    const nextTierStandings = standings.find(s => s.tierNumber === nextTierNumber);
    
    if (!currentTierStandings || !nextTierStandings) continue;
    
    const driversToRelegate = tieredLeague.relegationSpots > 0
      ? currentTierStandings.standings
          .slice(-tieredLeague.relegationSpots)
          .map(d => ({ profileId: d.profileId, points: d.points }))
      : [];
    
    const driversToPromote = tieredLeague.promotionSpots > 0
      ? nextTierStandings.standings
          .slice(0, tieredLeague.promotionSpots)
          .map(d => ({ profileId: d.profileId, points: d.points }))
      : [];
    
    for (const driver of driversToRelegate) {
      movements.push({
        profileId: driver.profileId,
        fromTier: currentTierNumber,
        toTier: nextTierNumber,
        movementType: 'relegation',
      });
    }
    
    for (const driver of driversToPromote) {
      movements.push({
        profileId: driver.profileId,
        fromTier: nextTierNumber,
        toTier: currentTierNumber,
        movementType: 'promotion',
      });
    }
  }
  
  for (const movement of movements) {
    await storage.moveDriverToTier(
      tieredLeague.id,
      movement.profileId,
      movement.toTier,
      movement.movementType,
      afterRaceNumber
    );
  }
  
  // Clear tier race results after a shuffle - tier points reset for the new period
  await storage.clearTierRaceResults(tieredLeague.id);
  console.log(`[Tier Automation] Cleared tier race results for tiered league ${tieredLeague.id} after shuffle ${afterRaceNumber}`);
  
  return {
    tieredLeagueId: tieredLeague.id,
    movements,
  };
}

export async function getDriverTierMovementNotifications(profileId: number) {
  return await storage.getUnreadTierMovementNotifications(profileId);
}

export async function markNotificationRead(notificationId: number) {
  return await storage.markTierMovementNotificationRead(notificationId);
}
