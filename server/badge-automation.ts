import { db } from "./db";
import { results, races, profiles, badges, profileBadges, leagues, competitions, raceCompetitions } from "@shared/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { PREDEFINED_BADGES } from "@shared/predefined-badges";

interface DriverStats {
  totalRaces: number;
  totalPoints: number;
  wins: number;
  podiums: number;
  results: {
    raceId: number;
    position: number;
    points: number;
    qualifyingPosition: number | null;
    raceDate: Date;
    leagueId: number;
    participantCount: number;
  }[];
}

async function getDriverStatsForBadges(profileId: number): Promise<DriverStats> {
  const driverResults = await db
    .select({
      raceId: results.raceId,
      position: results.position,
      points: results.points,
      qualifyingPosition: results.qualifyingPosition,
      raceDate: races.date,
      leagueId: races.leagueId,
    })
    .from(results)
    .innerJoin(races, eq(results.raceId, races.id))
    .where(eq(results.racerId, profileId))
    .orderBy(desc(races.date));

  const resultsWithCounts = await Promise.all(
    driverResults.map(async (r) => {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(results)
        .where(eq(results.raceId, r.raceId));
      return {
        ...r,
        participantCount: Number(countResult[0]?.count || 1),
      };
    })
  );

  return {
    totalRaces: driverResults.length,
    totalPoints: driverResults.reduce((sum, r) => sum + r.points, 0),
    wins: driverResults.filter((r) => r.position === 1).length,
    podiums: driverResults.filter((r) => r.position <= 3).length,
    results: resultsWithCounts,
  };
}

async function getExistingBadges(profileId: number): Promise<Set<string>> {
  const existing = await db
    .select({ slug: badges.slug })
    .from(profileBadges)
    .innerJoin(badges, eq(profileBadges.badgeId, badges.id))
    .where(eq(profileBadges.profileId, profileId));
  return new Set(existing.map((b) => b.slug));
}

async function getBadgeBySlug(slug: string): Promise<{ id: number } | null> {
  const badge = await db
    .select({ id: badges.id })
    .from(badges)
    .where(eq(badges.slug, slug))
    .limit(1);
  return badge[0] || null;
}

async function awardBadgeIfNotExists(
  profileId: number,
  slug: string,
  existingBadges: Set<string>
): Promise<boolean> {
  if (existingBadges.has(slug)) return false;

  const badge = await getBadgeBySlug(slug);
  if (!badge) return false;

  const existing = await db
    .select()
    .from(profileBadges)
    .where(and(eq(profileBadges.profileId, profileId), eq(profileBadges.badgeId, badge.id)))
    .limit(1);

  if (existing.length > 0) return false;

  await db.insert(profileBadges).values({ profileId, badgeId: badge.id });
  
  const { badgeNotifications } = await import("@shared/schema");
  await db.insert(badgeNotifications).values({ profileId, badgeId: badge.id });
  
  return true;
}

function checkConsecutiveWins(resultsData: DriverStats["results"], count: number): boolean {
  if (resultsData.length < count) return false;
  const sorted = [...resultsData].sort((a, b) => new Date(b.raceDate).getTime() - new Date(a.raceDate).getTime());
  for (let i = 0; i <= sorted.length - count; i++) {
    const slice = sorted.slice(i, i + count);
    if (slice.every((r) => r.position === 1)) return true;
  }
  return false;
}

function checkConsecutivePodiums(resultsData: DriverStats["results"], count: number): boolean {
  if (resultsData.length < count) return false;
  const sorted = [...resultsData].sort((a, b) => new Date(b.raceDate).getTime() - new Date(a.raceDate).getTime());
  for (let i = 0; i <= sorted.length - count; i++) {
    const slice = sorted.slice(i, i + count);
    if (slice.every((r) => r.position <= 3)) return true;
  }
  return false;
}

function getSeasonResults(resultsData: DriverStats["results"], leagueId: number): DriverStats["results"] {
  return resultsData.filter((r) => r.leagueId === leagueId);
}

export async function checkAndAwardBadges(profileId: number): Promise<string[]> {
  const stats = await getDriverStatsForBadges(profileId);
  const existingBadges = await getExistingBadges(profileId);
  const awardedBadges: string[] = [];

  if (stats.totalRaces === 0) return awardedBadges;

  if (stats.totalRaces >= 1) {
    if (await awardBadgeIfNotExists(profileId, "first_race", existingBadges)) {
      awardedBadges.push("first_race");
    }
  }

  if (stats.podiums >= 1) {
    if (await awardBadgeIfNotExists(profileId, "first_podium", existingBadges)) {
      awardedBadges.push("first_podium");
    }
  }

  if (stats.wins >= 1) {
    if (await awardBadgeIfNotExists(profileId, "first_win", existingBadges)) {
      awardedBadges.push("first_win");
    }
  }

  const firstPodiumIndex = [...stats.results]
    .sort((a, b) => new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime())
    .findIndex((r) => r.position <= 3);
  if (firstPodiumIndex >= 3) {
    if (await awardBadgeIfNotExists(profileId, "late_bloomer", existingBadges)) {
      awardedBadges.push("late_bloomer");
    }
  }

  if (checkConsecutiveWins(stats.results, 2)) {
    if (await awardBadgeIfNotExists(profileId, "back_to_back", existingBadges)) {
      awardedBadges.push("back_to_back");
    }
  }

  if (checkConsecutivePodiums(stats.results, 3)) {
    if (await awardBadgeIfNotExists(profileId, "podium_run", existingBadges)) {
      awardedBadges.push("podium_run");
    }
  }

  const uniqueLeagues = Array.from(new Set(stats.results.map((r) => r.leagueId)));
  for (const leagueId of uniqueLeagues) {
    const seasonResults = getSeasonResults(stats.results, leagueId);
    
    const top5Count = seasonResults.filter((r) => r.position <= 5).length;
    if (top5Count >= 3) {
      if (await awardBadgeIfNotExists(profileId, "top_5_regular", existingBadges)) {
        awardedBadges.push("top_5_regular");
      }
    }

    const seasonPoints = seasonResults.reduce((sum, r) => sum + r.points, 0);
    if (seasonPoints >= 100) {
      if (await awardBadgeIfNotExists(profileId, "points_scorer", existingBadges)) {
        awardedBadges.push("points_scorer");
      }
    }

    const topHalfCount = seasonResults.filter(
      (r) => r.position <= Math.ceil(r.participantCount / 2)
    ).length;
    if (topHalfCount >= 4) {
      if (await awardBadgeIfNotExists(profileId, "top_half_hero", existingBadges)) {
        awardedBadges.push("top_half_hero");
      }
    }

    const lastPlaceCount = seasonResults.filter(
      (r) => r.position === r.participantCount
    ).length;
    if (lastPlaceCount >= 3) {
      if (await awardBadgeIfNotExists(profileId, "plum_tomato_champion", existingBadges)) {
        awardedBadges.push("plum_tomato_champion");
      }
    }
  }

  const positions = stats.results.map((r) => r.position);
  if (positions.length >= 2) {
    const bestPosition = Math.min(...positions);
    const worstPosition = Math.max(...positions);
    const swing = worstPosition - bestPosition;
    if (swing >= 5) {
      if (await awardBadgeIfNotExists(profileId, "the_yo_yo", existingBadges)) {
        awardedBadges.push("the_yo_yo");
      }
    }
  }

  const hasQualiData = stats.results.some((r) => r.qualifyingPosition !== null);
  if (hasQualiData) {
    const polePositions = stats.results.filter((r) => r.qualifyingPosition === 1);
    if (polePositions.length >= 1) {
      if (await awardBadgeIfNotExists(profileId, "pole_position", existingBadges)) {
        awardedBadges.push("pole_position");
      }
    }

    const gridClimbs = stats.results.filter(
      (r) => r.qualifyingPosition !== null && r.qualifyingPosition - r.position >= 3
    );
    if (gridClimbs.length >= 1) {
      if (await awardBadgeIfNotExists(profileId, "grid_climber", existingBadges)) {
        awardedBadges.push("grid_climber");
      }
    }

    const perfectWeekends = stats.results.filter(
      (r) => r.qualifyingPosition === 1 && r.position === 1
    );
    if (perfectWeekends.length >= 1) {
      if (await awardBadgeIfNotExists(profileId, "perfect_weekend", existingBadges)) {
        awardedBadges.push("perfect_weekend");
      }
    }

    for (const leagueId of uniqueLeagues) {
      const seasonResults = getSeasonResults(stats.results, leagueId);
      const qualiTop3Count = seasonResults.filter(
        (r) => r.qualifyingPosition !== null && r.qualifyingPosition <= 3
      ).length;
      if (qualiTop3Count >= 5) {
        if (await awardBadgeIfNotExists(profileId, "quali_specialist", existingBadges)) {
          awardedBadges.push("quali_specialist");
        }
      }
    }
  }

  return awardedBadges;
}

// List of badges that can be automatically revoked when criteria are no longer met
// These are the badges checked in checkAndAwardBadges that are based on race results
const REVOCABLE_BADGE_SLUGS = [
  // Getting started
  "first_race",
  // Milestones
  "first_podium",
  "first_win", 
  "late_bloomer",
  // Race highlights (qualifying-based)
  "pole_position",
  "grid_climber",
  "perfect_weekend",
  // Hot streaks
  "back_to_back",
  "podium_run",
  "top_5_regular",
  "quali_specialist",
  // Season heroes (result-based, not season-end awards)
  "points_scorer",
  "top_half_hero",
  "plum_tomato_champion",
  "the_yo_yo",
];

// Season-end badges that are awarded/revoked based on league completion standings
const SEASON_END_BADGE_SLUGS = [
  "season_complete",
  "iron_driver",
  "never_quit",
  "league_laughs_never_quit",
  "last_but_loyal",
  "mck_champion",
  "runner_up",
  "third_overall",
  "best_of_rest",
  "dominator",
  "podium_king",
  "the_flash",
  "quali_merchant",
  "most_dramatic_swing",
];

function calculateEligibleBadges(stats: DriverStats): Set<string> {
  const eligible = new Set<string>();
  
  if (stats.totalRaces === 0) return eligible;
  
  // first_race
  if (stats.totalRaces >= 1) eligible.add("first_race");
  
  // first_podium
  if (stats.podiums >= 1) eligible.add("first_podium");
  
  // first_win
  if (stats.wins >= 1) eligible.add("first_win");
  
  // late_bloomer
  const sortedByDate = [...stats.results].sort((a, b) => 
    new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime()
  );
  const firstPodiumIndex = sortedByDate.findIndex((r) => r.position <= 3);
  if (firstPodiumIndex >= 3) eligible.add("late_bloomer");
  
  // back_to_back (2 consecutive wins)
  if (checkConsecutiveWins(stats.results, 2)) eligible.add("back_to_back");
  
  // podium_run (3 consecutive podiums)
  if (checkConsecutivePodiums(stats.results, 3)) eligible.add("podium_run");
  
  // Season-based badges
  const uniqueLeagues = Array.from(new Set(stats.results.map((r) => r.leagueId)));
  for (const leagueId of uniqueLeagues) {
    const seasonResults = getSeasonResults(stats.results, leagueId);
    
    // top_5_regular (3+ top 5 finishes in a season)
    const top5Count = seasonResults.filter((r) => r.position <= 5).length;
    if (top5Count >= 3) eligible.add("top_5_regular");
    
    // points_scorer (100+ points in a season)
    const seasonPoints = seasonResults.reduce((sum, r) => sum + r.points, 0);
    if (seasonPoints >= 100) eligible.add("points_scorer");
    
    // top_half_hero (4+ top half finishes in a season)
    const topHalfCount = seasonResults.filter(
      (r) => r.position <= Math.ceil(r.participantCount / 2)
    ).length;
    if (topHalfCount >= 4) eligible.add("top_half_hero");
    
    // plum_tomato_champion (3+ last place finishes in a season)
    const lastPlaceCount = seasonResults.filter(
      (r) => r.position === r.participantCount
    ).length;
    if (lastPlaceCount >= 3) eligible.add("plum_tomato_champion");
  }
  
  // the_yo_yo (5+ position swing between best and worst)
  const positions = stats.results.map((r) => r.position);
  if (positions.length >= 2) {
    const swing = Math.max(...positions) - Math.min(...positions);
    if (swing >= 5) eligible.add("the_yo_yo");
  }
  
  // Qualifying-based badges
  const hasQualiData = stats.results.some((r) => r.qualifyingPosition !== null);
  if (hasQualiData) {
    // pole_position
    if (stats.results.some((r) => r.qualifyingPosition === 1)) {
      eligible.add("pole_position");
    }
    
    // grid_climber (finish 3+ positions higher than quali)
    if (stats.results.some((r) => 
      r.qualifyingPosition !== null && r.qualifyingPosition - r.position >= 3
    )) {
      eligible.add("grid_climber");
    }
    
    // perfect_weekend (P1 quali and P1 finish)
    if (stats.results.some((r) => 
      r.qualifyingPosition === 1 && r.position === 1
    )) {
      eligible.add("perfect_weekend");
    }
    
    // quali_specialist (5+ top 3 qualifyings in a season)
    for (const leagueId of uniqueLeagues) {
      const seasonResults = getSeasonResults(stats.results, leagueId);
      const qualiTop3Count = seasonResults.filter(
        (r) => r.qualifyingPosition !== null && r.qualifyingPosition <= 3
      ).length;
      if (qualiTop3Count >= 5) eligible.add("quali_specialist");
    }
  }
  
  return eligible;
}

async function revokeBadge(profileId: number, slug: string): Promise<boolean> {
  const badge = await getBadgeBySlug(slug);
  if (!badge) return false;
  
  await db.delete(profileBadges).where(
    and(eq(profileBadges.profileId, profileId), eq(profileBadges.badgeId, badge.id))
  );
  
  return true;
}

export async function syncBadgesForDriver(profileId: number): Promise<{ awarded: string[]; revoked: string[] }> {
  const stats = await getDriverStatsForBadges(profileId);
  const existingBadges = await getExistingBadges(profileId);
  const eligibleBadges = calculateEligibleBadges(stats);
  
  const awarded: string[] = [];
  const revoked: string[] = [];
  
  // Award any newly eligible badges
  for (const slug of Array.from(eligibleBadges)) {
    if (!existingBadges.has(slug)) {
      if (await awardBadgeIfNotExists(profileId, slug, existingBadges)) {
        awarded.push(slug);
      }
    }
  }
  
  // Revoke any badges that are no longer eligible (only revocable ones)
  for (const slug of REVOCABLE_BADGE_SLUGS) {
    if (existingBadges.has(slug) && !eligibleBadges.has(slug)) {
      if (await revokeBadge(profileId, slug)) {
        revoked.push(slug);
      }
    }
  }
  
  return { awarded, revoked };
}

export async function checkSeasonEndBadges(leagueId: number): Promise<Map<number, string[]>> {
  const awardedMap = new Map<number, string[]>();

  const allRacesInLeague = await db
    .select({ id: races.id })
    .from(races)
    .where(eq(races.leagueId, leagueId));

  const raceIds = allRacesInLeague.map((r) => r.id);
  if (raceIds.length === 0) return awardedMap;

  const allResults = await db
    .select({
      racerId: results.racerId,
      raceId: results.raceId,
      position: results.position,
      points: results.points,
      qualifyingPosition: results.qualifyingPosition,
    })
    .from(results)
    .where(inArray(results.raceId, raceIds));

  const driverStats = new Map<number, { 
    races: Set<number>; 
    points: number; 
    wins: number; 
    podiums: number; 
    positions: number[];
    polePositions: number;
    qualiHigherThanFinish: number;
    bestGridClimb: number;
  }>();
  
  for (const r of allResults) {
    if (!driverStats.has(r.racerId)) {
      driverStats.set(r.racerId, { 
        races: new Set(), 
        points: 0, 
        wins: 0, 
        podiums: 0, 
        positions: [],
        polePositions: 0,
        qualiHigherThanFinish: 0,
        bestGridClimb: 0,
      });
    }
    const stats = driverStats.get(r.racerId)!;
    stats.races.add(r.raceId);
    stats.points += r.points;
    if (r.qualifyingPosition !== null) {
      if (r.qualifyingPosition === 1) stats.polePositions++;
      if (r.qualifyingPosition < r.position) stats.qualiHigherThanFinish++;
      const gridClimb = r.qualifyingPosition - r.position;
      if (gridClimb > stats.bestGridClimb) stats.bestGridClimb = gridClimb;
    }
    stats.positions.push(r.position);
    if (r.position === 1) stats.wins++;
    if (r.position <= 3) stats.podiums++;
  }

  const standings = Array.from(driverStats.entries())
    .map(([profileId, stats]) => ({ profileId, ...stats }))
    .sort((a, b) => b.points - a.points);

  for (let i = 0; i < standings.length; i++) {
    const driver = standings[i];
    const existingBadges = await getExistingBadges(driver.profileId);
    const awarded: string[] = [];

    if (driver.races.size === raceIds.length) {
      if (await awardBadgeIfNotExists(driver.profileId, "season_complete", existingBadges)) {
        awarded.push("season_complete");
      }
      if (await awardBadgeIfNotExists(driver.profileId, "iron_driver", existingBadges)) {
        awarded.push("iron_driver");
      }

      const allP8OrBelow = driver.positions.every((p: number) => p >= 8);
      if (allP8OrBelow) {
        if (await awardBadgeIfNotExists(driver.profileId, "never_quit", existingBadges)) {
          awarded.push("never_quit");
        }
      }

      const bottomHalfCount = driver.positions.filter((p: number) => p > Math.ceil(standings.length / 2)).length;
      const allBottomHalf = bottomHalfCount === driver.positions.length;
      if (allBottomHalf) {
        if (await awardBadgeIfNotExists(driver.profileId, "league_laughs_never_quit", existingBadges)) {
          awarded.push("league_laughs_never_quit");
        }
      }

      if (i === standings.length - 1) {
        if (await awardBadgeIfNotExists(driver.profileId, "last_but_loyal", existingBadges)) {
          awarded.push("last_but_loyal");
        }
      }
    }

    if (i === 0) {
      if (await awardBadgeIfNotExists(driver.profileId, "mck_champion", existingBadges)) {
        awarded.push("mck_champion");
      }
    } else if (i === 1) {
      if (await awardBadgeIfNotExists(driver.profileId, "runner_up", existingBadges)) {
        awarded.push("runner_up");
      }
    } else if (i === 2) {
      if (await awardBadgeIfNotExists(driver.profileId, "third_overall", existingBadges)) {
        awarded.push("third_overall");
      }
    } else if (i === 3) {
      if (await awardBadgeIfNotExists(driver.profileId, "best_of_rest", existingBadges)) {
        awarded.push("best_of_rest");
      }
    }

    if (awarded.length > 0) {
      awardedMap.set(driver.profileId, awarded);
    }
  }

  const maxWins = Math.max(...standings.map((s) => s.wins));
  const dominators = standings.filter((s) => s.wins === maxWins && maxWins > 0);
  for (const dom of dominators) {
    const existingBadges = await getExistingBadges(dom.profileId);
    if (await awardBadgeIfNotExists(dom.profileId, "dominator", existingBadges)) {
      const existing = awardedMap.get(dom.profileId) || [];
      awardedMap.set(dom.profileId, [...existing, "dominator"]);
    }
  }

  const maxPodiums = Math.max(...standings.map((s) => s.podiums));
  const podiumKings = standings.filter((s) => s.podiums === maxPodiums && maxPodiums > 0);
  for (const pk of podiumKings) {
    const existingBadges = await getExistingBadges(pk.profileId);
    if (await awardBadgeIfNotExists(pk.profileId, "podium_king", existingBadges)) {
      const existing = awardedMap.get(pk.profileId) || [];
      awardedMap.set(pk.profileId, [...existing, "podium_king"]);
    }
  }

  const maxPoles = Math.max(...standings.map((s) => s.polePositions));
  if (maxPoles > 0) {
    const flashDrivers = standings.filter((s) => s.polePositions === maxPoles);
    for (const fd of flashDrivers) {
      const existingBadges = await getExistingBadges(fd.profileId);
      if (await awardBadgeIfNotExists(fd.profileId, "the_flash", existingBadges)) {
        const existing = awardedMap.get(fd.profileId) || [];
        awardedMap.set(fd.profileId, [...existing, "the_flash"]);
      }
    }
  }

  const maxQualiHigher = Math.max(...standings.map((s) => s.qualiHigherThanFinish));
  if (maxQualiHigher > 0) {
    const qualiMerchants = standings.filter((s) => s.qualiHigherThanFinish === maxQualiHigher);
    for (const qm of qualiMerchants) {
      const existingBadges = await getExistingBadges(qm.profileId);
      if (await awardBadgeIfNotExists(qm.profileId, "quali_merchant", existingBadges)) {
        const existing = awardedMap.get(qm.profileId) || [];
        awardedMap.set(qm.profileId, [...existing, "quali_merchant"]);
      }
    }
  }

  const maxGridClimb = Math.max(...standings.map((s) => s.bestGridClimb));
  if (maxGridClimb > 0) {
    const dramaticSwings = standings.filter((s) => s.bestGridClimb === maxGridClimb);
    for (const ds of dramaticSwings) {
      const existingBadges = await getExistingBadges(ds.profileId);
      if (await awardBadgeIfNotExists(ds.profileId, "most_dramatic_swing", existingBadges)) {
        const existing = awardedMap.get(ds.profileId) || [];
        awardedMap.set(ds.profileId, [...existing, "most_dramatic_swing"]);
      }
    }
  }

  return awardedMap;
}

// Sync season-end badges for a completed league - revokes invalid badges and awards new ones
export async function syncSeasonEndBadgesForLeague(leagueId: number): Promise<void> {
  // Check if league is completed - only sync badges for completed leagues
  const leagueResult = await db.select({ status: leagues.status }).from(leagues).where(eq(leagues.id, leagueId));
  if (leagueResult.length === 0 || leagueResult[0].status !== 'completed') {
    return; // Only sync for completed leagues
  }

  const allRacesInLeague = await db
    .select({ id: races.id })
    .from(races)
    .where(eq(races.leagueId, leagueId));

  const raceIds = allRacesInLeague.map((r) => r.id);
  if (raceIds.length === 0) return;

  const allResults = await db
    .select({
      racerId: results.racerId,
      raceId: results.raceId,
      position: results.position,
      points: results.points,
      qualifyingPosition: results.qualifyingPosition,
    })
    .from(results)
    .where(inArray(results.raceId, raceIds));

  // Build driver stats map
  const driverStats = new Map<number, { 
    races: Set<number>; 
    points: number; 
    wins: number; 
    podiums: number; 
    positions: number[];
    polePositions: number;
    qualiHigherThanFinish: number;
    bestGridClimb: number;
  }>();
  
  for (const r of allResults) {
    if (!driverStats.has(r.racerId)) {
      driverStats.set(r.racerId, { 
        races: new Set(), 
        points: 0, 
        wins: 0, 
        podiums: 0, 
        positions: [],
        polePositions: 0,
        qualiHigherThanFinish: 0,
        bestGridClimb: 0,
      });
    }
    const stats = driverStats.get(r.racerId)!;
    stats.races.add(r.raceId);
    stats.points += r.points;
    if (r.qualifyingPosition !== null) {
      if (r.qualifyingPosition === 1) stats.polePositions++;
      if (r.qualifyingPosition < r.position) stats.qualiHigherThanFinish++;
      const gridClimb = r.qualifyingPosition - r.position;
      if (gridClimb > stats.bestGridClimb) stats.bestGridClimb = gridClimb;
    }
    stats.positions.push(r.position);
    if (r.position === 1) stats.wins++;
    if (r.position <= 3) stats.podiums++;
  }

  const standings = Array.from(driverStats.entries())
    .map(([profileId, stats]) => ({ profileId, ...stats }))
    .sort((a, b) => b.points - a.points);

  // Calculate who should have each badge
  const eligibleBadges = new Map<string, Set<number>>(); // badge slug -> set of driver IDs
  SEASON_END_BADGE_SLUGS.forEach(slug => eligibleBadges.set(slug, new Set()));

  for (let i = 0; i < standings.length; i++) {
    const driver = standings[i];
    
    // Attendance badges
    if (driver.races.size === raceIds.length) {
      eligibleBadges.get("season_complete")!.add(driver.profileId);
      eligibleBadges.get("iron_driver")!.add(driver.profileId);
      
      const allP8OrWorse = driver.positions.every((p) => p >= 8);
      if (allP8OrWorse) {
        eligibleBadges.get("never_quit")!.add(driver.profileId);
      }
      
      const allBottomHalf = driver.positions.every((p, idx) => {
        const participantCount = allResults.filter(r => r.raceId === Array.from(driver.races)[idx]).length;
        return p > Math.ceil(participantCount / 2);
      });
      if (allBottomHalf) {
        eligibleBadges.get("league_laughs_never_quit")!.add(driver.profileId);
      }
    }
    
    // Position badges
    if (i === 0) eligibleBadges.get("mck_champion")!.add(driver.profileId);
    if (i === 1) eligibleBadges.get("runner_up")!.add(driver.profileId);
    if (i === 2) eligibleBadges.get("third_overall")!.add(driver.profileId);
    if (i === 3) eligibleBadges.get("best_of_rest")!.add(driver.profileId);
  }

  // Last but loyal
  if (standings.length > 0) {
    const lastPlace = standings[standings.length - 1];
    if (lastPlace.races.size === raceIds.length) {
      eligibleBadges.get("last_but_loyal")!.add(lastPlace.profileId);
    }
  }

  // Stats-based badges
  const maxWins = Math.max(0, ...standings.map(s => s.wins));
  if (maxWins > 0) {
    standings.filter(s => s.wins === maxWins).forEach(s => eligibleBadges.get("dominator")!.add(s.profileId));
  }
  
  const maxPodiums = Math.max(0, ...standings.map(s => s.podiums));
  if (maxPodiums > 0) {
    standings.filter(s => s.podiums === maxPodiums).forEach(s => eligibleBadges.get("podium_king")!.add(s.profileId));
  }
  
  const maxPoles = Math.max(0, ...standings.map(s => s.polePositions));
  if (maxPoles > 0) {
    standings.filter(s => s.polePositions === maxPoles).forEach(s => eligibleBadges.get("the_flash")!.add(s.profileId));
  }
  
  const maxQualiHigher = Math.max(0, ...standings.map(s => s.qualiHigherThanFinish));
  if (maxQualiHigher > 0) {
    standings.filter(s => s.qualiHigherThanFinish === maxQualiHigher).forEach(s => eligibleBadges.get("quali_merchant")!.add(s.profileId));
  }
  
  const maxGridClimb = Math.max(0, ...standings.map(s => s.bestGridClimb));
  if (maxGridClimb > 0) {
    standings.filter(s => s.bestGridClimb === maxGridClimb).forEach(s => eligibleBadges.get("most_dramatic_swing")!.add(s.profileId));
  }

  // Get all drivers who participated in this league
  const allDriverIds = Array.from(driverStats.keys());

  // For each driver, sync their season-end badges
  for (const driverId of allDriverIds) {
    const existingBadges = await getExistingBadges(driverId);
    
    for (const slug of SEASON_END_BADGE_SLUGS) {
      const shouldHave = eligibleBadges.get(slug)!.has(driverId);
      const hasIt = existingBadges.some(b => b.slug === slug);
      
      if (shouldHave && !hasIt) {
        // Award the badge
        await awardBadgeIfNotExists(driverId, slug, existingBadges);
      } else if (!shouldHave && hasIt) {
        // Revoke the badge
        const badge = existingBadges.find(b => b.slug === slug);
        if (badge) {
          await db.delete(profileBadges).where(
            and(
              eq(profileBadges.profileId, driverId),
              eq(profileBadges.badgeId, badge.badgeId)
            )
          );
        }
      }
    }
  }
}
