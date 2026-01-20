import { db } from "./db";
import { tieredLeagues, tierAssignments, tierMovements, tierMovementNotifications, tierNames, results, races, raceCompetitions } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";
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
    
    if (raceCount % tieredLeague.racesBeforeShuffle === 0 && raceCount > 0) {
      const alreadyProcessed = await hasShuffleBeenProcessedAtRaceCount(tieredLeague.id, raceCount);
      if (alreadyProcessed) continue;
      
      const result = await processShuffleForTieredLeague(tieredLeague, raceCount);
      
      // Reset tiered championship points after shuffle
      await storage.resetTierPoints(tieredLeague.id);

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
  const completedRaces = await db.select({ raceId: raceCompetitions.raceId })
    .from(raceCompetitions)
    .innerJoin(races, eq(races.id, raceCompetitions.raceId))
    .innerJoin(results, eq(results.raceId, races.id))
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
