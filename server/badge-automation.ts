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
  existingBadges: Set<string>,
  leagueId?: number // Optional: for season-end badges, tracks which league awarded it
): Promise<boolean> {
  // For non-league badges, skip if already have it
  // For league badges, we need to check if this specific league's badge exists
  if (!leagueId && existingBadges.has(slug)) return false;

  const badge = await getBadgeBySlug(slug);
  if (!badge) return false;

  // Check for existing badge (with leagueId if provided)
  let existing;
  if (leagueId) {
    // For season-end badges, check if this specific league's badge exists
    existing = await db
      .select()
      .from(profileBadges)
      .where(and(
        eq(profileBadges.profileId, profileId), 
        eq(profileBadges.badgeId, badge.id),
        eq(profileBadges.leagueId, leagueId)
      ))
      .limit(1);
  } else {
    // For non-league badges, check if any instance exists
    existing = await db
      .select()
      .from(profileBadges)
      .where(and(eq(profileBadges.profileId, profileId), eq(profileBadges.badgeId, badge.id)))
      .limit(1);
  }

  if (existing.length > 0) return false;

  await db.insert(profileBadges).values({ profileId, badgeId: badge.id, leagueId });
  
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
  
  // Delete the badge assignment
  await db.delete(profileBadges).where(
    and(eq(profileBadges.profileId, profileId), eq(profileBadges.badgeId, badge.id))
  );
  
  // Also delete any unread notifications for this badge
  const { badgeNotifications } = await import("@shared/schema");
  await db.delete(badgeNotifications).where(
    and(eq(badgeNotifications.profileId, profileId), eq(badgeNotifications.badgeId, badge.id))
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
  
  // Also handle season-end badge revocation
  // Get all completed leagues the driver currently has results in
  const completedLeaguesWithResults = await db
    .selectDistinct({ leagueId: races.leagueId })
    .from(results)
    .innerJoin(races, eq(results.raceId, races.id))
    .innerJoin(leagues, eq(races.leagueId, leagues.id))
    .where(and(
      eq(results.racerId, profileId),
      eq(leagues.status, 'completed')
    ));
  
  const completedLeagueIdsWithResults = new Set(completedLeaguesWithResults.map(l => l.leagueId));
  
  // Get season-end badges the driver currently has (with their leagueId)
  const seasonBadgesHeld = await db
    .select({ 
      badgeId: profileBadges.badgeId,
      leagueId: profileBadges.leagueId,
      slug: badges.slug 
    })
    .from(profileBadges)
    .innerJoin(badges, eq(profileBadges.badgeId, badges.id))
    .where(and(
      eq(profileBadges.profileId, profileId),
      inArray(badges.slug, SEASON_END_BADGE_SLUGS)
    ));
  
  // Revoke any season-end badges where driver no longer has results in that league
  const { badgeNotifications } = await import("@shared/schema");
  for (const badge of seasonBadgesHeld) {
    if (badge.leagueId && !completedLeagueIdsWithResults.has(badge.leagueId)) {
      // Driver has badge from a league they no longer have results in - revoke it
      await db.delete(profileBadges).where(
        and(
          eq(profileBadges.profileId, profileId),
          eq(profileBadges.badgeId, badge.badgeId),
          eq(profileBadges.leagueId, badge.leagueId)
        )
      );
      // Also delete the notification
      await db.delete(badgeNotifications).where(
        and(eq(badgeNotifications.profileId, profileId), eq(badgeNotifications.badgeId, badge.badgeId))
      );
      revoked.push(badge.slug);
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
      if (await awardBadgeIfNotExists(driver.profileId, "season_complete", existingBadges, leagueId)) {
        awarded.push("season_complete");
      }
      if (await awardBadgeIfNotExists(driver.profileId, "iron_driver", existingBadges, leagueId)) {
        awarded.push("iron_driver");
      }

      const allP8OrBelow = driver.positions.every((p: number) => p >= 8);
      if (allP8OrBelow) {
        if (await awardBadgeIfNotExists(driver.profileId, "never_quit", existingBadges, leagueId)) {
          awarded.push("never_quit");
        }
      }

      const bottomHalfCount = driver.positions.filter((p: number) => p > Math.ceil(standings.length / 2)).length;
      const allBottomHalf = bottomHalfCount === driver.positions.length;
      if (allBottomHalf) {
        if (await awardBadgeIfNotExists(driver.profileId, "league_laughs_never_quit", existingBadges, leagueId)) {
          awarded.push("league_laughs_never_quit");
        }
      }

      if (i === standings.length - 1) {
        if (await awardBadgeIfNotExists(driver.profileId, "last_but_loyal", existingBadges, leagueId)) {
          awarded.push("last_but_loyal");
        }
      }
    }

    if (i === 0) {
      if (await awardBadgeIfNotExists(driver.profileId, "mck_champion", existingBadges, leagueId)) {
        awarded.push("mck_champion");
      }
    } else if (i === 1) {
      if (await awardBadgeIfNotExists(driver.profileId, "runner_up", existingBadges, leagueId)) {
        awarded.push("runner_up");
      }
    } else if (i === 2) {
      if (await awardBadgeIfNotExists(driver.profileId, "third_overall", existingBadges, leagueId)) {
        awarded.push("third_overall");
      }
    } else if (i === 3) {
      if (await awardBadgeIfNotExists(driver.profileId, "best_of_rest", existingBadges, leagueId)) {
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
    if (await awardBadgeIfNotExists(dom.profileId, "dominator", existingBadges, leagueId)) {
      const existing = awardedMap.get(dom.profileId) || [];
      awardedMap.set(dom.profileId, [...existing, "dominator"]);
    }
  }

  const maxPodiums = Math.max(...standings.map((s) => s.podiums));
  const podiumKings = standings.filter((s) => s.podiums === maxPodiums && maxPodiums > 0);
  for (const pk of podiumKings) {
    const existingBadges = await getExistingBadges(pk.profileId);
    if (await awardBadgeIfNotExists(pk.profileId, "podium_king", existingBadges, leagueId)) {
      const existing = awardedMap.get(pk.profileId) || [];
      awardedMap.set(pk.profileId, [...existing, "podium_king"]);
    }
  }

  const maxPoles = Math.max(...standings.map((s) => s.polePositions));
  if (maxPoles > 0) {
    const flashDrivers = standings.filter((s) => s.polePositions === maxPoles);
    for (const fd of flashDrivers) {
      const existingBadges = await getExistingBadges(fd.profileId);
      if (await awardBadgeIfNotExists(fd.profileId, "the_flash", existingBadges, leagueId)) {
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
      if (await awardBadgeIfNotExists(qm.profileId, "quali_merchant", existingBadges, leagueId)) {
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
      if (await awardBadgeIfNotExists(ds.profileId, "most_dramatic_swing", existingBadges, leagueId)) {
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

  // Get all drivers who currently have results in this league
  const currentDriverIds = Array.from(driverStats.keys());
  
  // Also find drivers who have season-end badges specifically for THIS league
  // These need to be checked for revocation
  const driversWithLeagueBadges = await db
    .select({ profileId: profileBadges.profileId })
    .from(profileBadges)
    .innerJoin(badges, eq(profileBadges.badgeId, badges.id))
    .where(and(
      inArray(badges.slug, SEASON_END_BADGE_SLUGS),
      eq(profileBadges.leagueId, leagueId)
    ));
  
  const allDriverIds = Array.from(new Set([
    ...currentDriverIds,
    ...driversWithLeagueBadges.map(d => d.profileId)
  ]));

  // For each driver, sync their season-end badges for THIS league
  for (const driverId of allDriverIds) {
    // Note: We don't use getExistingBadges here because season-end badges can exist
    // multiple times (once per league). awardBadgeIfNotExists handles the proper
    // league-scoped check internally.
    
    for (const slug of SEASON_END_BADGE_SLUGS) {
      const shouldHave = eligibleBadges.get(slug)!.has(driverId);
      
      if (shouldHave) {
        // Try to award the badge - awardBadgeIfNotExists will check if this
        // specific (driverId, badgeId, leagueId) combination already exists
        await awardBadgeIfNotExists(driverId, slug, new Set(), leagueId);
      } else {
        // Revoke the badge - only revoke if it was awarded by THIS league
        const badge = await getBadgeBySlug(slug);
        if (badge) {
          await db.delete(profileBadges).where(
            and(
              eq(profileBadges.profileId, driverId),
              eq(profileBadges.badgeId, badge.id),
              eq(profileBadges.leagueId, leagueId) // Only revoke if from this league
            )
          );
          // Also delete the notification
          const { badgeNotifications } = await import("@shared/schema");
          await db.delete(badgeNotifications).where(
            and(eq(badgeNotifications.profileId, driverId), eq(badgeNotifications.badgeId, badge.id))
          );
        }
      }
    }
  }
}

// Tier badge automation - called after each tier shuffle
export async function checkTierBadgesAfterShuffle(
  tieredLeagueId: number,
  shuffleResult: {
    movements: Array<{
      profileId: number;
      fromTier: number;
      toTier: number;
      movementType: 'promotion' | 'relegation';
    }>;
  },
  tierStandings: Array<{
    tierNumber: number;
    standings: Array<{ profileId: number; points: number }>;
  }>,
  tieredLeagueConfig: {
    numberOfTiers: number;
    relegationSpots: number;
  }
): Promise<Map<number, string[]>> {
  const { tierMovements } = await import("@shared/schema");
  const awardedMap = new Map<number, string[]>();

  // Get all movements for this tiered league to analyze history
  const allMovements = await db
    .select()
    .from(tierMovements)
    .where(eq(tierMovements.tieredLeagueId, tieredLeagueId))
    .orderBy(tierMovements.afterRaceNumber);

  // Check badges for drivers involved in this shuffle
  const affectedDrivers = new Set<number>();
  
  // Add drivers from movements
  for (const movement of shuffleResult.movements) {
    affectedDrivers.add(movement.profileId);
  }
  
  // Add all drivers in tier standings (for checking top of tier, held the line, relegation survivor)
  for (const tier of tierStandings) {
    for (const driver of tier.standings) {
      affectedDrivers.add(driver.profileId);
    }
  }

  // Helper to check if movement type is a promotion (exact match, not substring)
  const isPromotion = (type: string) => type === 'promotion' || type === 'automatic_promotion' || type === 'admin_promotion';
  const isRelegation = (type: string) => type === 'relegation' || type === 'automatic_relegation' || type === 'admin_relegation';

  for (const profileId of Array.from(affectedDrivers)) {
    const existingBadges = await getExistingBadges(profileId);
    const awarded: string[] = [];
    
    // Get this driver's movement history (excluding initial_assignment for badge logic)
    const driverMovements = allMovements.filter(m => m.profileId === profileId);
    const shuffleMovements = driverMovements.filter(m => m.movementType !== 'initial_assignment');
    const latestMovement = shuffleMovements[shuffleMovements.length - 1];
    
    // Check for promotion-related badges (only if the latest movement is a promotion)
    if (latestMovement && isPromotion(latestMovement.movementType)) {
      // Back on the Up: Promoted after previously being relegated
      const hasBeenRelegated = shuffleMovements.some(m => isRelegation(m.movementType));
      if (hasBeenRelegated) {
        if (await awardBadgeIfNotExists(profileId, "back_on_the_up", existingBadges)) {
          awarded.push("back_on_the_up");
        }
      }
      
      // Double Jump: Promoted twice in consecutive shuffles
      if (shuffleMovements.length >= 2) {
        const previousMovement = shuffleMovements[shuffleMovements.length - 2];
        if (isPromotion(previousMovement.movementType)) {
          if (await awardBadgeIfNotExists(profileId, "double_jump", existingBadges)) {
            awarded.push("double_jump");
          }
        }
      }
      
      // Bounced Back: Promoted within one shuffle after relegation
      if (shuffleMovements.length >= 2) {
        const previousMovement = shuffleMovements[shuffleMovements.length - 2];
        if (isRelegation(previousMovement.movementType)) {
          if (await awardBadgeIfNotExists(profileId, "bounced_back", existingBadges)) {
            awarded.push("bounced_back");
          }
        }
      }
      
      // Top Tier Material: Got promoted to the highest tier (tier 1)
      if (latestMovement.toTier === 1) {
        if (await awardBadgeIfNotExists(profileId, "top_tier_material", existingBadges)) {
          awarded.push("top_tier_material");
        }
      }
    }
    
    // Check for drivers who stayed in the same tier (Held the Line)
    // Requires: driver was not promoted/relegated in this shuffle AND has been through at least one prior shuffle
    const wasInCurrentShuffle = shuffleResult.movements.some(m => m.profileId === profileId);
    const hasHadPriorShuffle = shuffleMovements.length >= 1; // At least one prior promotion/relegation exists
    if (!wasInCurrentShuffle && hasHadPriorShuffle) {
      if (await awardBadgeIfNotExists(profileId, "held_the_line", existingBadges)) {
        awarded.push("held_the_line");
      }
    }
    
    // Top of the Tier: Finish 1st in your tier's standings after a shuffle
    for (const tier of tierStandings) {
      if (tier.standings.length > 0 && tier.standings[0].profileId === profileId) {
        if (await awardBadgeIfNotExists(profileId, "top_of_the_tier", existingBadges)) {
          awarded.push("top_of_the_tier");
        }
        break;
      }
    }
    
    // Relegation Survivor: Avoid relegation while finishing in the relegation zone
    // Must have finished in relegation spots (bottom N where N = relegationSpots) but wasn't relegated
    const wasRelegated = shuffleResult.movements.some(
      m => m.profileId === profileId && m.movementType === 'relegation'
    );
    if (!wasRelegated) {
      for (const tier of tierStandings) {
        const driverIndex = tier.standings.findIndex(s => s.profileId === profileId);
        if (driverIndex !== -1) {
          const tierSize = tier.standings.length;
          const relegationZoneStart = tierSize - tieredLeagueConfig.relegationSpots;
          const isInRelegationZone = driverIndex >= relegationZoneStart;
          // Only count if tier has relegation spots and is not the bottom tier
          if (isInRelegationZone && tieredLeagueConfig.relegationSpots > 0 && tier.tierNumber < tieredLeagueConfig.numberOfTiers) {
            if (await awardBadgeIfNotExists(profileId, "relegation_survivor", existingBadges)) {
              awarded.push("relegation_survivor");
            }
          }
          break;
        }
      }
    }
    
    if (awarded.length > 0) {
      awardedMap.set(profileId, awarded);
    }
  }
  
  return awardedMap;
}

// Season-end tier badges - called when a league is marked complete
export async function checkSeasonEndTierBadges(tieredLeagueId: number, leagueId: number): Promise<Map<number, string[]>> {
  const { tierMovements, tierAssignments, tieredLeagues: tieredLeaguesTable, tierNames: tierNamesTable } = await import("@shared/schema");
  const { storage } = await import("./storage");
  
  const awardedMap = new Map<number, string[]>();
  
  // Get the tiered league config
  const [tieredLeague] = await db.select().from(tieredLeaguesTable).where(eq(tieredLeaguesTable.id, tieredLeagueId));
  if (!tieredLeague) return awardedMap;
  
  // Get tier names to identify S, A, B ranks
  const tierNamesData = await db.select().from(tierNamesTable).where(eq(tierNamesTable.tieredLeagueId, tieredLeagueId));
  const tierNameMap = new Map(tierNamesData.map(t => [t.tierNumber, t.name]));
  
  // Get tier standings
  const tierStandings = await storage.getTierStandings(tieredLeagueId);
  
  // Get all tier movements for this tiered league
  const allMovements = await db
    .select()
    .from(tierMovements)
    .where(eq(tierMovements.tieredLeagueId, tieredLeagueId));
  
  // Get all current tier assignments
  const assignments = await db
    .select()
    .from(tierAssignments)
    .where(eq(tierAssignments.tieredLeagueId, tieredLeagueId));
  
  // Build a map of profileId -> their tier movements
  const driverMovements = new Map<number, typeof allMovements>();
  for (const movement of allMovements) {
    if (!driverMovements.has(movement.profileId)) {
      driverMovements.set(movement.profileId, []);
    }
    driverMovements.get(movement.profileId)!.push(movement);
  }
  
  // Helper functions to check movement types (exact match, not substring)
  const isPromotion = (type: string) => type === 'promotion' || type === 'automatic_promotion' || type === 'admin_promotion';
  const isRelegation = (type: string) => type === 'relegation' || type === 'automatic_relegation' || type === 'admin_relegation';

  // Check each driver
  for (const assignment of assignments) {
    const profileId = assignment.profileId;
    const existingBadges = await getExistingBadges(profileId);
    const awarded: string[] = [];
    const movements = driverMovements.get(profileId) || [];
    
    const promotions = movements.filter(m => isPromotion(m.movementType));
    const relegations = movements.filter(m => isRelegation(m.movementType));
    
    // S/A/B/C Rank Champion: Finish 1st in their tier
    // Use tier number deterministically: tier 1 = S, tier 2 = A, tier 3 = B, tier 4 = C
    const tierStanding = tierStandings.find(t => t.tierNumber === assignment.tierNumber);
    if (tierStanding && tierStanding.standings.length > 0 && tierStanding.standings[0].profileId === profileId) {
      if (assignment.tierNumber === 1) {
        if (await awardBadgeIfNotExists(profileId, "s_rank_champion", existingBadges, leagueId)) {
          awarded.push("s_rank_champion");
        }
      } else if (assignment.tierNumber === 2) {
        if (await awardBadgeIfNotExists(profileId, "a_rank_champion", existingBadges, leagueId)) {
          awarded.push("a_rank_champion");
        }
      } else if (assignment.tierNumber === 3) {
        if (await awardBadgeIfNotExists(profileId, "b_rank_champion", existingBadges, leagueId)) {
          awarded.push("b_rank_champion");
        }
      } else if (assignment.tierNumber === 4) {
        if (await awardBadgeIfNotExists(profileId, "c_rank_champion", existingBadges, leagueId)) {
          awarded.push("c_rank_champion");
        }
      }
    }
    
    // Safe Hands: Finished outside relegation spots for entire season (no relegations)
    if (relegations.length === 0 && movements.length > 0) {
      if (await awardBadgeIfNotExists(profileId, "safe_hands", existingBadges, leagueId)) {
        awarded.push("safe_hands");
      }
    }
    
    // Untouchable: Stayed in S Rank (tier 1) for full season with no relegations
    if (assignment.tierNumber === 1 && relegations.length === 0) {
      // Check if they started in tier 1
      const initialAssignment = movements.find(m => m.movementType === 'initial_assignment');
      if (initialAssignment && initialAssignment.toTier === 1) {
        if (await awardBadgeIfNotExists(profileId, "untouchable", existingBadges, leagueId)) {
          awarded.push("untouchable");
        }
      }
    }
    
    // Elevator Operator: Had both promotion and relegation in the season
    if (promotions.length > 0 && relegations.length > 0) {
      if (await awardBadgeIfNotExists(profileId, "elevator_operator", existingBadges, leagueId)) {
        awarded.push("elevator_operator");
      }
    }
    
    if (awarded.length > 0) {
      awardedMap.set(profileId, awarded);
    }
  }
  
  return awardedMap;
}
