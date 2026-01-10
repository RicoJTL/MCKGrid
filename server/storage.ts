import { db } from "./db";
import { 
  leagues, competitions, races, results, profiles, teams, raceCompetitions,
  badges, profileBadges, seasonGoals, raceCheckins, personalBests, badgeNotifications,
  driverIcons, profileDriverIcons, driverIconNotifications,
  tieredLeagues, tierNames, tierAssignments, tierMovements, tierMovementNotifications,
  type League, type Competition, type Race, type Result, type Profile, type Team, type RaceCompetition,
  type Badge, type ProfileBadge, type SeasonGoal, type RaceCheckin, type PersonalBest, type BadgeNotification,
  type DriverIcon, type ProfileDriverIcon, type DriverIconNotification,
  type TieredLeague, type TierName, type TierAssignment, type TierMovement, type TierMovementNotification,
  type InsertLeague, type InsertCompetition, type InsertRace, type InsertResult, type InsertProfile, type InsertTeam,
  type InsertBadge, type InsertSeasonGoal, type InsertRaceCheckin, type InsertPersonalBest,
  type InsertDriverIcon, type InsertProfileDriverIcon,
  type InsertTieredLeague, type InsertTierName, type InsertTierAssignment
} from "@shared/schema";
import { eq, desc, and, inArray, sql, gte, or } from "drizzle-orm";

export interface IStorage {
  // Leagues
  getLeagues(): Promise<League[]>;
  getLeague(id: number): Promise<League | undefined>;
  createLeague(league: InsertLeague): Promise<League>;
  updateLeague(id: number, data: Partial<InsertLeague>): Promise<League>;
  deleteLeague(id: number): Promise<void>;

  // Competitions
  getCompetitions(leagueId: number): Promise<Competition[]>;
  getCompetition(id: number): Promise<Competition | undefined>;
  createCompetition(competition: InsertCompetition): Promise<Competition>;
  updateCompetition(id: number, data: Partial<InsertCompetition>): Promise<Competition>;
  deleteCompetition(id: number): Promise<void>;

  // Races
  getRaces(competitionId: number): Promise<Race[]>;
  getRacesByLeague(leagueId: number): Promise<Race[]>;
  getRace(id: number): Promise<Race | undefined>;
  createRace(race: InsertRace, competitionIds: number[]): Promise<Race>;
  updateRace(id: number, data: Partial<InsertRace>): Promise<Race>;
  updateRaceCompetitions(raceId: number, competitionIds: number[]): Promise<void>;
  getRaceCompetitions(raceId: number): Promise<Competition[]>;
  deleteRace(id: number): Promise<void>;

  // Results
  getResults(raceId: number): Promise<Result[]>;
  replaceRaceResults(raceId: number, resultsData: Omit<InsertResult, 'raceId'>[]): Promise<Result[]>;

  // Teams
  getTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;

  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  getProfileById(id: number): Promise<Profile | undefined>;
  getAllProfiles(): Promise<Profile[]>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: number, profile: Partial<InsertProfile>): Promise<Profile>;
  deleteProfile(id: number): Promise<void>;
  getProfileRaceHistory(profileId: number): Promise<any[]>;
  hasAnyAdmin(): Promise<boolean>;
  
  // Standings
  getCompetitionStandings(competitionId: number): Promise<any[]>;
  getUpcomingRaces(competitionId?: number): Promise<Race[]>;
  
  // Tiered Leagues
  getTieredLeagues(leagueId: number): Promise<TieredLeague[]>;
  getTieredLeague(id: number): Promise<TieredLeague | undefined>;
  getTieredLeagueByParentCompetition(competitionId: number): Promise<TieredLeague | undefined>;
  createTieredLeague(data: InsertTieredLeague, tierNamesList: string[]): Promise<TieredLeague>;
  updateTieredLeague(id: number, data: Partial<InsertTieredLeague>, tierNames?: string[]): Promise<TieredLeague>;
  deleteTieredLeague(id: number): Promise<void>;
  getTierNames(tieredLeagueId: number): Promise<TierName[]>;
  
  // Tier Assignments
  getTierAssignments(tieredLeagueId: number): Promise<(TierAssignment & { profile: Profile })[]>;
  getDriverTierAssignment(tieredLeagueId: number, profileId: number): Promise<TierAssignment | undefined>;
  getDriverActiveTier(profileId: number): Promise<{ tieredLeague: TieredLeague; tierAssignment: TierAssignment; tierName: TierName } | null>;
  assignDriverToTier(tieredLeagueId: number, profileId: number, tierNumber: number): Promise<TierAssignment>;
  removeDriverFromTier(tieredLeagueId: number, profileId: number): Promise<void>;
  moveDriverToTier(tieredLeagueId: number, profileId: number, newTierNumber: number, movementType: string, afterRaceNumber: number): Promise<TierMovement>;
  
  // Tier Standings
  getTierStandings(tieredLeagueId: number): Promise<{ tierNumber: number; tierName: string; standings: { profileId: number; driverName: string; fullName: string; points: number }[] }[]>;
  
  // Tier Movement Notifications
  getUnreadTierMovementNotifications(profileId: number): Promise<{ notification: TierMovementNotification; movement: TierMovement; tieredLeague: TieredLeague }[]>;
  markTierMovementNotificationRead(notificationId: number): Promise<void>;
  
  // Tier Movement History
  getProfileTierMovementHistory(profileId: number): Promise<{ movement: TierMovement; tieredLeague: TieredLeague; fromTierName: string | null; toTierName: string }[]>;
  getProfileRaceHistoryByCompetition(profileId: number): Promise<any[]>;
  getAllActiveCompetitions(): Promise<any[]>;
  getAllUpcomingRaces(): Promise<any[]>;
  getMainCompetition(): Promise<Competition | null>;
  setMainCompetition(competitionId: number): Promise<void>;
  getMainLeague(): Promise<League | null>;
  setMainLeague(leagueId: number): Promise<void>;
  
  // Badges
  getBadges(): Promise<Badge[]>;
  getProfileBadges(profileId: number): Promise<(ProfileBadge & { badge: Badge })[]>;
  getProfilesWithBadge(badgeId: number): Promise<{ profileId: number; badgeId: number }[]>;
  awardBadge(profileId: number, badgeId: number): Promise<ProfileBadge>;
  revokeBadge(profileId: number, badgeId: number): Promise<void>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  updateBadge(id: number, data: Partial<InsertBadge>): Promise<Badge>;
  deleteBadge(id: number): Promise<void>;
  seedPredefinedBadges(): Promise<void>;
  getBadgeBySlug(slug: string): Promise<Badge | undefined>;
  
  // Badge Notifications
  getUnreadBadgeNotifications(profileId: number): Promise<{ notification: { id: number; createdAt: Date }; badge: Badge }[]>;
  markBadgeNotificationsRead(profileId: number): Promise<void>;
  
  
  // Driver Icons
  getDriverIcons(): Promise<DriverIcon[]>;
  getDriverIconBySlug(slug: string): Promise<DriverIcon | undefined>;
  getDriverIconById(id: number): Promise<DriverIcon | undefined>;
  createDriverIcon(icon: InsertDriverIcon): Promise<DriverIcon>;
  updateDriverIcon(id: number, data: Partial<InsertDriverIcon>): Promise<DriverIcon>;
  deleteDriverIcon(id: number): Promise<void>;
  seedPredefinedDriverIcons(): Promise<void>;
  
  // Profile Driver Icons
  getProfileDriverIcons(profileId: number): Promise<(ProfileDriverIcon & { icon: DriverIcon })[]>;
  getProfilesWithDriverIcon(iconId: number): Promise<{ profileId: number }[]>;
  getAllDriversWithIcons(): Promise<{ profileId: number; icons: DriverIcon[] }[]>;
  awardDriverIcon(profileId: number, iconId: number, awardedByProfileId: number): Promise<ProfileDriverIcon>;
  revokeDriverIcon(profileId: number, iconId: number): Promise<void>;
  
  // Driver Icon Notifications
  getUnreadDriverIconNotifications(profileId: number): Promise<{ notification: { id: number; createdAt: Date }; icon: DriverIcon }[]>;
  markDriverIconNotificationsRead(profileId: number): Promise<void>;
  
  // Season Goals
  getSeasonGoals(profileId: number, leagueId?: number): Promise<SeasonGoal[]>;
  getSeasonGoalById(id: number): Promise<SeasonGoal | undefined>;
  createSeasonGoal(goal: InsertSeasonGoal): Promise<SeasonGoal>;
  updateSeasonGoal(id: number, data: Partial<SeasonGoal>): Promise<SeasonGoal>;
  deleteSeasonGoal(id: number): Promise<void>;
  
  // Race Check-ins
  getRaceCheckins(raceId: number): Promise<(RaceCheckin & { profile: Profile })[]>;
  getProfileCheckin(raceId: number, profileId: number): Promise<RaceCheckin | undefined>;
  setCheckin(data: InsertRaceCheckin): Promise<RaceCheckin>;
  
  // Personal Bests
  getPersonalBests(profileId: number): Promise<PersonalBest[]>;
  updatePersonalBest(profileId: number, location: string, bestTime: string, raceId?: number): Promise<PersonalBest>;
  
  // Driver Stats
  getDriverStats(profileId: number): Promise<{
    totalRaces: number;
    totalPoints: number;
    avgPosition: number;
    wins: number;
    podiums: number;
    bestPosition: number;
  }>;
  
  // Head-to-Head
  getHeadToHeadStats(profileId1: number, profileId2: number): Promise<{
    driver1Wins: number;
    driver2Wins: number;
    draws: number;
    driver1Podiums: number;
    driver2Podiums: number;
    driver1Points: number;
    driver2Points: number;
    driver1AvgPosition: number;
    driver2AvgPosition: number;
    driver1AvgQuali: number | null;
    driver2AvgQuali: number | null;
    recentFormDriver1: number;
    recentFormDriver2: number;
    podiumDifferential: number;
    pointsDifferential: number;
    avgPositionGap: number;
    avgQualiGap: number | null;
    races: any[];
  }>;
  
  // Quick Results
  getRecentResults(profileId: number, limit?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getLeagues(): Promise<League[]> {
    return await db.select().from(leagues).orderBy(desc(leagues.isMain), leagues.createdAt, leagues.id);
  }
  async getLeague(id: number): Promise<League | undefined> {
    const [league] = await db.select().from(leagues).where(eq(leagues.id, id));
    return league;
  }
  async createLeague(league: InsertLeague): Promise<League> {
    const [newLeague] = await db.insert(leagues).values(league).returning();
    return newLeague;
  }
  async updateLeague(id: number, data: Partial<InsertLeague>): Promise<League> {
    const [updated] = await db.update(leagues).set(data).where(eq(leagues.id, id)).returning();
    
    // If league is marked as completed, cascade to all races within the league
    if (data.status === 'completed') {
      await db.update(races)
        .set({ status: 'completed' })
        .where(eq(races.leagueId, id));
    }
    
    return updated;
  }
  async deleteLeague(id: number): Promise<void> {
    // Cascade delete: delete all races in this league (which cascades to results, check-ins, etc.)
    const leagueRaces = await db.select().from(races).where(eq(races.leagueId, id));
    for (const race of leagueRaces) {
      await this.deleteRace(race.id);
    }
    
    // Delete all tiered leagues in this league
    const leagueTieredLeagues = await db.select().from(tieredLeagues).where(eq(tieredLeagues.leagueId, id));
    for (const tl of leagueTieredLeagues) {
      await this.deleteTieredLeague(tl.id);
    }
    
    // Delete all competitions in this league
    await db.delete(competitions).where(eq(competitions.leagueId, id));
    
    // Delete the league
    await db.delete(leagues).where(eq(leagues.id, id));
  }

  async getCompetitions(leagueId: number): Promise<Competition[]> {
    return await db.select().from(competitions).where(eq(competitions.leagueId, leagueId)).orderBy(competitions.createdAt, competitions.id);
  }
  async getCompetition(id: number): Promise<Competition | undefined> {
    const [competition] = await db.select().from(competitions).where(eq(competitions.id, id));
    return competition;
  }
  async createCompetition(competition: InsertCompetition): Promise<Competition> {
    const [newComp] = await db.insert(competitions).values(competition).returning();
    return newComp;
  }
  async updateCompetition(id: number, data: Partial<InsertCompetition>): Promise<Competition> {
    const [updated] = await db.update(competitions).set(data).where(eq(competitions.id, id)).returning();
    return updated;
  }
  async deleteCompetition(id: number): Promise<void> {
    // Find all races linked to this competition
    const linkedRaces = await db
      .select({ raceId: raceCompetitions.raceId })
      .from(raceCompetitions)
      .where(eq(raceCompetitions.competitionId, id));
    
    // Delete each linked race (cascades to results, check-ins, etc.)
    for (const { raceId } of linkedRaces) {
      await this.deleteRace(raceId);
    }
    
    // Check if any tiered league uses this as parent competition and delete it
    const parentTieredLeague = await db.select().from(tieredLeagues).where(eq(tieredLeagues.parentCompetitionId, id));
    for (const tl of parentTieredLeague) {
      await this.deleteTieredLeague(tl.id);
    }
    // Delete the competition
    await db.delete(competitions).where(eq(competitions.id, id));
  }

  async getRaces(competitionId: number): Promise<Race[]> {
    const raceLinks = await db
      .select({ race: races })
      .from(raceCompetitions)
      .innerJoin(races, eq(raceCompetitions.raceId, races.id))
      .where(eq(raceCompetitions.competitionId, competitionId))
      .orderBy(races.date);
    return raceLinks.map(r => r.race);
  }
  async getRacesByLeague(leagueId: number): Promise<Race[]> {
    return await db.select().from(races).where(eq(races.leagueId, leagueId)).orderBy(races.date);
  }
  async getRace(id: number): Promise<Race | undefined> {
    const [race] = await db.select().from(races).where(eq(races.id, id));
    return race;
  }
  async createRace(race: InsertRace, competitionIds: number[]): Promise<Race> {
    return await db.transaction(async (tx) => {
      const [newRace] = await tx.insert(races).values(race).returning();
      if (competitionIds.length > 0) {
        await tx.insert(raceCompetitions).values(
          competitionIds.map(competitionId => ({ raceId: newRace.id, competitionId }))
        );
      }
      return newRace;
    });
  }
  async updateRace(id: number, data: Partial<InsertRace>): Promise<Race> {
    const [updated] = await db.update(races).set(data).where(eq(races.id, id)).returning();
    return updated;
  }
  async updateRaceCompetitions(raceId: number, competitionIds: number[]): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(raceCompetitions).where(eq(raceCompetitions.raceId, raceId));
      if (competitionIds.length > 0) {
        await tx.insert(raceCompetitions).values(
          competitionIds.map(competitionId => ({ raceId, competitionId }))
        );
      }
    });
  }
  async getRaceCompetitions(raceId: number): Promise<Competition[]> {
    const links = await db
      .select({ competition: competitions })
      .from(raceCompetitions)
      .innerJoin(competitions, eq(raceCompetitions.competitionId, competitions.id))
      .where(eq(raceCompetitions.raceId, raceId));
    return links.map(l => l.competition);
  }
  async deleteRace(id: number): Promise<void> {
    // Get race info before deleting (for league-based badge sync)
    const race = await this.getRace(id);
    
    // Get affected drivers before deleting results
    const affectedResults = await db.select({ racerId: results.racerId }).from(results).where(eq(results.raceId, id));
    const affectedRacerIds = Array.from(new Set(affectedResults.map(r => r.racerId)));
    
    // Get race info including location for personal best recalculation
    const raceLocation = race?.location;
    
    // Get affected driver IDs and their existing personal bests for this race
    const pbsToRecalculate = await db.select().from(personalBests).where(eq(personalBests.raceId, id));
    
    // Delete race results
    await db.delete(results).where(eq(results.raceId, id));
    // Delete race check-ins
    await db.delete(raceCheckins).where(eq(raceCheckins.raceId, id));
    // Delete race-competition links
    await db.delete(raceCompetitions).where(eq(raceCompetitions.raceId, id));
    // Delete the race
    await db.delete(races).where(eq(races.id, id));
    
    // Sync badges for all affected drivers (may revoke badges they no longer qualify for)
    const { syncBadgesForDriver, syncSeasonEndBadgesForLeague } = await import("./badge-automation");
    if (affectedRacerIds.length > 0) {
      for (const racerId of affectedRacerIds) {
        await syncBadgesForDriver(racerId);
      }
    }
    
    // Sync season-end badges if this race was in a completed league
    if (race && race.leagueId) {
      await syncSeasonEndBadgesForLeague(race.leagueId);
    }
    
    // Recalculate personal bests for drivers whose PBs referenced this race
    for (const pb of pbsToRecalculate) {
      await this.recalculatePersonalBest(pb.profileId, pb.location);
    }
  }
  
  // Recalculate personal best for a driver at a location from remaining race results
  private async recalculatePersonalBest(profileId: number, location: string): Promise<void> {
    // Find all remaining race times for this driver at this location
    const remainingTimes = await db
      .select({
        raceTime: results.raceTime,
        raceId: results.raceId,
        raceDate: races.date
      })
      .from(results)
      .innerJoin(races, eq(results.raceId, races.id))
      .where(and(
        eq(results.racerId, profileId),
        eq(races.location, location)
      ));
    
    // Filter to only results with valid race times
    const validTimes = remainingTimes.filter(t => t.raceTime && t.raceTime.trim() !== '');
    
    // Delete the existing personal best for this location
    await db.delete(personalBests).where(and(
      eq(personalBests.profileId, profileId),
      eq(personalBests.location, location)
    ));
    
    if (validTimes.length === 0) {
      // No remaining times at this location - PB is deleted
      return;
    }
    
    // Find the fastest time
    let fastestTime: string | null = null;
    let fastestRaceId: number | null = null;
    let fastestSeconds = Infinity;
    
    for (const t of validTimes) {
      const seconds = this.parseTimeToSeconds(t.raceTime!);
      if (seconds !== null && seconds < fastestSeconds) {
        fastestSeconds = seconds;
        fastestTime = t.raceTime;
        fastestRaceId = t.raceId;
      }
    }
    
    if (fastestTime && fastestRaceId) {
      // Create new PB with the fastest remaining time
      await db.insert(personalBests).values({
        profileId,
        location,
        bestTime: fastestTime,
        raceId: fastestRaceId,
        achievedAt: new Date()
      });
    }
  }

  async getResults(raceId: number): Promise<Result[]> {
    return await db.select().from(results).where(eq(results.raceId, raceId)).orderBy(results.position);
  }

  async replaceRaceResults(raceId: number, resultsData: Omit<InsertResult, 'raceId'>[]): Promise<Result[]> {
    // Get the race to find its location
    const race = await this.getRace(raceId);
    
    // Get existing results to track removed drivers
    const existingResults = await db.select().from(results).where(eq(results.raceId, raceId));
    const existingRacerIds = new Set(existingResults.map(r => r.racerId));
    const newRacerIds = new Set(resultsData.map(r => r.racerId));
    
    const insertedResults = await db.transaction(async (tx) => {
      // Always delete existing results first
      await tx.delete(results).where(eq(results.raceId, raceId));
      
      // If no new results, just return empty array
      if (resultsData.length === 0) return [];
      
      const fullResults: InsertResult[] = resultsData.map(r => ({
        ...r,
        raceId,
      }));
      
      return await tx.insert(results).values(fullResults).returning();
    });
    
    // Recalculate personal bests for drivers whose results were removed
    if (race && race.location) {
      for (const racerId of Array.from(existingRacerIds)) {
        if (!newRacerIds.has(racerId)) {
          // Driver was removed - check if their PB referenced this race
          const existingPB = await db.select().from(personalBests)
            .where(and(
              eq(personalBests.profileId, racerId),
              eq(personalBests.raceId, raceId)
            ));
          
          if (existingPB.length > 0) {
            // Recalculate their PB from remaining results at this location
            await this.recalculatePersonalBest(racerId, race.location);
          }
        }
      }
    }
    
    // Auto-update personal bests for drivers with race times
    if (race) {
      for (const result of insertedResults) {
        if (result.raceTime && result.racerId) {
          await this.checkAndUpdatePersonalBest(result.racerId, race.location, result.raceTime, raceId);
        }
      }
    }
    
    // Sync badges for all affected drivers (both new and removed)
    const { syncBadgesForDriver, syncSeasonEndBadgesForLeague } = await import("./badge-automation");
    
    // Sync for drivers in the new results (may award new badges)
    const uniqueNewRacerIds = Array.from(new Set(insertedResults.map(r => r.racerId).filter(Boolean)));
    for (const racerId of uniqueNewRacerIds) {
      await syncBadgesForDriver(racerId);
    }
    
    // Sync for drivers who were removed (may revoke badges they no longer qualify for)
    for (const racerId of Array.from(existingRacerIds)) {
      if (!newRacerIds.has(racerId)) {
        await syncBadgesForDriver(racerId);
      }
    }
    
    // Sync season-end badges if this race is in a completed league
    if (race && race.leagueId) {
      await syncSeasonEndBadgesForLeague(race.leagueId);
    }
    
    // Check for tier promotion/relegation after race results
    const { checkAndProcessTierShuffle } = await import("./tier-automation");
    await checkAndProcessTierShuffle(raceId);
    
    return insertedResults;
  }
  
  // Helper to parse time strings like "45.234" or "1:23.456" into seconds
  private parseTimeToSeconds(timeStr: string): number | null {
    if (!timeStr || timeStr.trim() === '') return null;
    
    const trimmed = timeStr.trim();
    
    // Format: "1:23.456" (minutes:seconds.milliseconds)
    if (trimmed.includes(':')) {
      const [minutes, seconds] = trimmed.split(':');
      const mins = parseFloat(minutes);
      const secs = parseFloat(seconds);
      if (isNaN(mins) || isNaN(secs)) return null;
      return mins * 60 + secs;
    }
    
    // Format: "45.234" (seconds.milliseconds)
    const seconds = parseFloat(trimmed);
    return isNaN(seconds) ? null : seconds;
  }
  
  // Check if new time should update personal best
  async checkAndUpdatePersonalBest(profileId: number, location: string, newTime: string, raceId: number): Promise<void> {
    const newTimeSeconds = this.parseTimeToSeconds(newTime);
    if (newTimeSeconds === null) return; // Invalid time format
    
    const existing = await db.select().from(personalBests)
      .where(and(eq(personalBests.profileId, profileId), eq(personalBests.location, location)));
    
    if (existing.length === 0) {
      // No existing PB for this location, create one
      await db.insert(personalBests)
        .values({ profileId, location, bestTime: newTime, raceId, achievedAt: new Date() });
    } else {
      const existingPB = existing[0];
      
      // If the existing PB is from THIS race, always update (admin is correcting the time)
      if (existingPB.raceId === raceId) {
        await db.update(personalBests)
          .set({ bestTime: newTime, achievedAt: new Date() })
          .where(eq(personalBests.id, existingPB.id));
      } else {
        // PB is from a different race - only update if new time is faster
        const existingTimeSeconds = this.parseTimeToSeconds(existingPB.bestTime);
        if (existingTimeSeconds === null || newTimeSeconds < existingTimeSeconds) {
          await db.update(personalBests)
            .set({ bestTime: newTime, raceId, achievedAt: new Date() })
            .where(eq(personalBests.id, existingPB.id));
        }
      }
    }
  }

  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }
  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }
  async getProfileById(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }
  async getAllProfiles(): Promise<Profile[]> {
    return await db.select().from(profiles);
  }
  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }
  async hasAnyAdmin(): Promise<boolean> {
    const { or } = await import('drizzle-orm');
    const admins = await db.select().from(profiles).where(
      or(eq(profiles.adminLevel, 'admin'), eq(profiles.adminLevel, 'super_admin'))
    ).limit(1);
    return admins.length > 0;
  }
  async updateProfile(id: number, profileData: Partial<InsertProfile>): Promise<Profile> {
    const [updated] = await db.update(profiles).set(profileData).where(eq(profiles.id, id)).returning();
    return updated;
  }
  async deleteProfile(id: number): Promise<void> {
    // First delete all tier assignments for this driver
    await db.delete(tierAssignments).where(eq(tierAssignments.profileId, id));
    // Then delete all race results for this driver
    await db.delete(results).where(eq(results.racerId, id));
    // Finally delete the profile
    await db.delete(profiles).where(eq(profiles.id, id));
  }
  async getProfileRaceHistory(profileId: number): Promise<any[]> {
    const profileResults = await db
      .select({
        position: results.position,
        points: results.points,
        raceTime: results.raceTime,
        raceName: races.name,
        raceDate: races.date,
        location: races.location,
      })
      .from(results)
      .innerJoin(races, eq(results.raceId, races.id))
      .where(eq(results.racerId, profileId))
      .orderBy(desc(races.date));
    return profileResults;
  }

  async getCompetitionStandings(competitionId: number): Promise<any[]> {
    // Get all races for this competition via junction table
    const competitionRaces = await db
      .select({ race: races })
      .from(raceCompetitions)
      .innerJoin(races, eq(raceCompetitions.raceId, races.id))
      .where(eq(raceCompetitions.competitionId, competitionId));
    
    if (competitionRaces.length === 0) return [];

    const raceIds = competitionRaces.map(r => r.race.id);
    
    // Get all results for all races in this competition using inArray
    const allRaceResults = await db
      .select({
        racerId: results.racerId,
        position: results.position,
        points: results.points,
        driverName: profiles.driverName,
        fullName: profiles.fullName,
      })
      .from(results)
      .innerJoin(profiles, eq(results.racerId, profiles.id))
      .where(inArray(results.raceId, raceIds));

    // Aggregate by racer - include all drivers who have race results
    const standingsMap = new Map<number, { racerId: number; driverName: string | null; fullName: string | null; points: number; podiums: number }>();
    
    for (const result of allRaceResults) {
      const existing = standingsMap.get(result.racerId);
      if (existing) {
        existing.points += result.points;
        if (result.position <= 3) existing.podiums += 1;
      } else {
        standingsMap.set(result.racerId, {
          racerId: result.racerId,
          driverName: result.driverName,
          fullName: result.fullName,
          points: result.points,
          podiums: result.position <= 3 ? 1 : 0,
        });
      }
    }

    // Sort by points descending
    return Array.from(standingsMap.values()).sort((a, b) => b.points - a.points);
  }

  async getUpcomingRaces(competitionId?: number): Promise<Race[]> {
    if (competitionId) {
      // Filter by competition AND scheduled status via junction table
      const raceLinks = await db
        .select({ race: races })
        .from(raceCompetitions)
        .innerJoin(races, eq(raceCompetitions.raceId, races.id))
        .where(and(
          eq(raceCompetitions.competitionId, competitionId),
          eq(races.status, 'scheduled')
        ))
        .orderBy(races.date);
      return raceLinks.map(r => r.race);
    }
    
    // All scheduled races
    return await db.select().from(races).where(eq(races.status, 'scheduled')).orderBy(races.date);
  }

  // Tiered League functions
  async getTieredLeagues(leagueId: number): Promise<TieredLeague[]> {
    return await db.select().from(tieredLeagues).where(eq(tieredLeagues.leagueId, leagueId));
  }

  async getTieredLeague(id: number): Promise<TieredLeague | undefined> {
    const [tieredLeague] = await db.select().from(tieredLeagues).where(eq(tieredLeagues.id, id));
    return tieredLeague;
  }

  async getTieredLeagueByParentCompetition(competitionId: number): Promise<TieredLeague | undefined> {
    const [tieredLeague] = await db.select().from(tieredLeagues).where(eq(tieredLeagues.parentCompetitionId, competitionId));
    return tieredLeague;
  }

  async createTieredLeague(data: InsertTieredLeague, tierNamesList: string[]): Promise<TieredLeague> {
    const [tieredLeague] = await db.insert(tieredLeagues).values(data).returning();
    
    // Create tier names
    for (let i = 0; i < tierNamesList.length; i++) {
      await db.insert(tierNames).values({
        tieredLeagueId: tieredLeague.id,
        tierNumber: i + 1,
        name: tierNamesList[i],
      });
    }
    
    return tieredLeague;
  }

  async updateTieredLeague(id: number, data: Partial<InsertTieredLeague>, tierNamesList?: string[]): Promise<TieredLeague> {
    const [updated] = await db.update(tieredLeagues).set(data).where(eq(tieredLeagues.id, id)).returning();
    
    // Update tier names if provided
    if (tierNamesList && tierNamesList.length > 0) {
      // Get existing tier names
      const existingTierNames = await db.select().from(tierNames)
        .where(eq(tierNames.tieredLeagueId, id))
        .orderBy(tierNames.tierNumber);
      
      // Update existing tier names and add new ones if needed
      for (let i = 0; i < tierNamesList.length; i++) {
        const tierNumber = i + 1;
        const existing = existingTierNames.find(tn => tn.tierNumber === tierNumber);
        if (existing) {
          await db.update(tierNames)
            .set({ name: tierNamesList[i] })
            .where(eq(tierNames.id, existing.id));
        } else {
          await db.insert(tierNames).values({
            tieredLeagueId: id,
            tierNumber,
            name: tierNamesList[i],
          });
        }
      }
      
      // Remove extra tier names if reducing number of tiers
      for (const existing of existingTierNames) {
        if (existing.tierNumber > tierNamesList.length) {
          await db.delete(tierNames).where(eq(tierNames.id, existing.id));
        }
      }
    }
    
    return updated;
  }

  async deleteTieredLeague(id: number): Promise<void> {
    // Delete in order: notifications -> movements -> assignments -> tier names -> tiered league
    const movements = await db.select().from(tierMovements).where(eq(tierMovements.tieredLeagueId, id));
    for (const movement of movements) {
      await db.delete(tierMovementNotifications).where(eq(tierMovementNotifications.movementId, movement.id));
    }
    await db.delete(tierMovements).where(eq(tierMovements.tieredLeagueId, id));
    await db.delete(tierAssignments).where(eq(tierAssignments.tieredLeagueId, id));
    await db.delete(tierNames).where(eq(tierNames.tieredLeagueId, id));
    await db.delete(tieredLeagues).where(eq(tieredLeagues.id, id));
  }

  async getTierNames(tieredLeagueId: number): Promise<TierName[]> {
    return await db.select().from(tierNames)
      .where(eq(tierNames.tieredLeagueId, tieredLeagueId))
      .orderBy(tierNames.tierNumber);
  }

  async getTierAssignments(tieredLeagueId: number): Promise<(TierAssignment & { profile: Profile })[]> {
    const assignments = await db
      .select({ assignment: tierAssignments, profile: profiles })
      .from(tierAssignments)
      .innerJoin(profiles, eq(tierAssignments.profileId, profiles.id))
      .where(eq(tierAssignments.tieredLeagueId, tieredLeagueId))
      .orderBy(tierAssignments.tierNumber);
    return assignments.map(a => ({ ...a.assignment, profile: a.profile }));
  }

  async getDriverTierAssignment(tieredLeagueId: number, profileId: number): Promise<TierAssignment | undefined> {
    const [assignment] = await db.select().from(tierAssignments)
      .where(and(eq(tierAssignments.tieredLeagueId, tieredLeagueId), eq(tierAssignments.profileId, profileId)));
    return assignment;
  }

  async getDriverActiveTier(profileId: number): Promise<{ tieredLeague: TieredLeague; tierAssignment: TierAssignment; tierName: TierName } | null> {
    // Find active tiered league assignment for the driver
    const result = await db
      .select({ 
        tieredLeague: tieredLeagues, 
        tierAssignment: tierAssignments,
        tierName: tierNames
      })
      .from(tierAssignments)
      .innerJoin(tieredLeagues, eq(tierAssignments.tieredLeagueId, tieredLeagues.id))
      .innerJoin(leagues, eq(tieredLeagues.leagueId, leagues.id))
      .innerJoin(tierNames, and(
        eq(tierNames.tieredLeagueId, tieredLeagues.id),
        eq(tierNames.tierNumber, tierAssignments.tierNumber)
      ))
      .where(and(
        eq(tierAssignments.profileId, profileId),
        eq(leagues.status, 'active')
      ))
      .limit(1);
    
    if (result.length === 0) return null;
    return result[0];
  }

  async assignDriverToTier(tieredLeagueId: number, profileId: number, tierNumber: number): Promise<TierAssignment> {
    // Check if already assigned
    const existing = await this.getDriverTierAssignment(tieredLeagueId, profileId);
    if (existing) {
      // Update tier number
      const [updated] = await db.update(tierAssignments)
        .set({ tierNumber })
        .where(eq(tierAssignments.id, existing.id))
        .returning();
      return updated;
    }
    
    const [assignment] = await db.insert(tierAssignments).values({
      tieredLeagueId,
      profileId,
      tierNumber,
    }).returning();
    
    // Create initial assignment notification
    const [movement] = await db.insert(tierMovements).values({
      tieredLeagueId,
      profileId,
      fromTier: 0,
      toTier: tierNumber,
      movementType: 'initial_assignment',
      afterRaceNumber: 0,
    }).returning();
    
    await db.insert(tierMovementNotifications).values({
      profileId,
      movementId: movement.id,
    });
    
    return assignment;
  }

  async removeDriverFromTier(tieredLeagueId: number, profileId: number): Promise<void> {
    await db.delete(tierAssignments).where(
      and(eq(tierAssignments.tieredLeagueId, tieredLeagueId), eq(tierAssignments.profileId, profileId))
    );
  }

  async moveDriverToTier(tieredLeagueId: number, profileId: number, newTierNumber: number, movementType: string, afterRaceNumber: number): Promise<TierMovement> {
    // Get current tier
    const currentAssignment = await this.getDriverTierAssignment(tieredLeagueId, profileId);
    if (!currentAssignment) throw new Error("Driver not assigned to a tier");
    
    const fromTier = currentAssignment.tierNumber;
    
    // Update the assignment
    await db.update(tierAssignments)
      .set({ tierNumber: newTierNumber })
      .where(eq(tierAssignments.id, currentAssignment.id));
    
    // Record the movement
    const [movement] = await db.insert(tierMovements).values({
      tieredLeagueId,
      profileId,
      fromTier,
      toTier: newTierNumber,
      movementType,
      afterRaceNumber,
    }).returning();
    
    // Create notification
    await db.insert(tierMovementNotifications).values({
      profileId,
      movementId: movement.id,
    });
    
    // Award 'first_promotion' badge if this is a promotion
    if (movementType === 'admin_promotion' || movementType === 'automatic_promotion') {
      // Check if driver already has the first_promotion badge
      const firstPromotionBadge = await db
        .select({ id: badges.id })
        .from(badges)
        .where(eq(badges.slug, 'first_promotion'))
        .limit(1);
      
      if (firstPromotionBadge.length > 0) {
        const badgeId = firstPromotionBadge[0].id;
        const existingBadge = await db
          .select()
          .from(profileBadges)
          .where(and(
            eq(profileBadges.profileId, profileId),
            eq(profileBadges.badgeId, badgeId)
          ))
          .limit(1);
        
        if (existingBadge.length === 0) {
          // Award the badge
          await db.insert(profileBadges).values({ profileId, badgeId });
          // Create badge notification
          await db.insert(badgeNotifications).values({ profileId, badgeId });
        }
      }
    }
    
    return movement;
  }

  async getTierStandings(tieredLeagueId: number): Promise<{ tierNumber: number; tierName: string; standings: { profileId: number; driverName: string; fullName: string; points: number }[] }[]> {
    const tieredLeague = await this.getTieredLeague(tieredLeagueId);
    if (!tieredLeague) return [];
    
    const names = await this.getTierNames(tieredLeagueId);
    const assignments = await this.getTierAssignments(tieredLeagueId);
    
    // Get parent competition standings
    const parentStandings = await this.getCompetitionStandings(tieredLeague.parentCompetitionId);
    const pointsMap = new Map(parentStandings.map((s: any) => [s.racerId, s.points]));
    
    // Group assignments by tier and add points
    const tierMap = new Map<number, { profileId: number; driverName: string; fullName: string; points: number }[]>();
    
    for (const assignment of assignments) {
      const tierNumber = assignment.tierNumber;
      if (!tierMap.has(tierNumber)) {
        tierMap.set(tierNumber, []);
      }
      tierMap.get(tierNumber)!.push({
        profileId: assignment.profileId,
        driverName: assignment.profile.driverName || '',
        fullName: assignment.profile.fullName || '',
        points: pointsMap.get(assignment.profileId) || 0,
      });
    }
    
    // Sort each tier by points
    Array.from(tierMap.values()).forEach(standings => {
      standings.sort((a: { points: number }, b: { points: number }) => b.points - a.points);
    });
    
    // Build result
    return names.map(name => ({
      tierNumber: name.tierNumber,
      tierName: name.name,
      standings: tierMap.get(name.tierNumber) || [],
    }));
  }

  async getUnreadTierMovementNotifications(profileId: number): Promise<{ notification: TierMovementNotification; movement: TierMovement; tieredLeague: TieredLeague }[]> {
    const result = await db
      .select({
        notification: tierMovementNotifications,
        movement: tierMovements,
        tieredLeague: tieredLeagues,
      })
      .from(tierMovementNotifications)
      .innerJoin(tierMovements, eq(tierMovementNotifications.movementId, tierMovements.id))
      .innerJoin(tieredLeagues, eq(tierMovements.tieredLeagueId, tieredLeagues.id))
      .where(and(
        eq(tierMovementNotifications.profileId, profileId),
        eq(tierMovementNotifications.isRead, false)
      ))
      .orderBy(desc(tierMovementNotifications.createdAt));
    
    return result;
  }

  async markTierMovementNotificationRead(notificationId: number): Promise<void> {
    await db.update(tierMovementNotifications)
      .set({ isRead: true })
      .where(eq(tierMovementNotifications.id, notificationId));
  }

  async getProfileTierMovementHistory(profileId: number): Promise<{ movement: TierMovement; tieredLeague: TieredLeague; fromTierName: string | null; toTierName: string }[]> {
    const movements = await db
      .select({
        movement: tierMovements,
        tieredLeague: tieredLeagues,
      })
      .from(tierMovements)
      .innerJoin(tieredLeagues, eq(tierMovements.tieredLeagueId, tieredLeagues.id))
      .where(eq(tierMovements.profileId, profileId))
      .orderBy(desc(tierMovements.createdAt));
    
    const result = await Promise.all(movements.map(async (m) => {
      const tierNamesList = await this.getTierNames(m.tieredLeague.id);
      const fromTierName = m.movement.fromTier === 0 ? null : tierNamesList.find(t => t.tierNumber === m.movement.fromTier)?.name || `Tier ${m.movement.fromTier}`;
      const toTierName = tierNamesList.find(t => t.tierNumber === m.movement.toTier)?.name || `Tier ${m.movement.toTier}`;
      return {
        movement: m.movement,
        tieredLeague: m.tieredLeague,
        fromTierName,
        toTierName,
      };
    }));
    
    return result;
  }

  async getProfileRaceHistoryByCompetition(profileId: number): Promise<any[]> {
    // Get race history with competition info via junction table
    const profileResults = await db
      .select({
        position: results.position,
        points: results.points,
        raceTime: results.raceTime,
        raceName: races.name,
        raceDate: races.date,
        location: races.location,
        raceId: races.id,
        leagueId: races.leagueId,
      })
      .from(results)
      .innerJoin(races, eq(results.raceId, races.id))
      .where(eq(results.racerId, profileId))
      .orderBy(desc(races.date));
    
    // For each result, get the competitions the race belongs to
    const resultsWithCompetitions = [];
    for (const result of profileResults) {
      const raceComps = await db
        .select({ competition: competitions })
        .from(raceCompetitions)
        .innerJoin(competitions, eq(raceCompetitions.competitionId, competitions.id))
        .where(eq(raceCompetitions.raceId, result.raceId));
      
      // Add each competition as a separate entry (or first one if needed)
      if (raceComps.length > 0) {
        resultsWithCompetitions.push({
          ...result,
          competitionId: raceComps[0].competition.id,
          competitionName: raceComps[0].competition.name,
        });
      } else {
        resultsWithCompetitions.push({
          ...result,
          competitionId: null,
          competitionName: null,
        });
      }
    }
    return resultsWithCompetitions;
  }

  async getAllActiveCompetitions(): Promise<any[]> {
    const allCompetitions = await db
      .select({
        id: competitions.id,
        name: competitions.name,
        type: competitions.type,
        leagueId: competitions.leagueId,
        leagueName: leagues.name,
        isMain: competitions.isMain,
        iconName: competitions.iconName,
        iconColor: competitions.iconColor,
        createdAt: competitions.createdAt,
      })
      .from(competitions)
      .innerJoin(leagues, eq(competitions.leagueId, leagues.id))
      .where(eq(leagues.status, 'active'))
      .orderBy(leagues.name, competitions.name);
    
    const allTieredLeagues = await db
      .select({
        id: tieredLeagues.id,
        name: tieredLeagues.name,
        leagueId: tieredLeagues.leagueId,
        leagueName: leagues.name,
        parentCompetitionId: tieredLeagues.parentCompetitionId,
        iconName: tieredLeagues.iconName,
        iconColor: tieredLeagues.iconColor,
        createdAt: tieredLeagues.createdAt,
      })
      .from(tieredLeagues)
      .innerJoin(leagues, eq(tieredLeagues.leagueId, leagues.id))
      .where(eq(leagues.status, 'active'))
      .orderBy(leagues.name, tieredLeagues.name);
    
    const competitionsWithType = allCompetitions.map(c => ({
      ...c,
      entityType: 'competition' as const,
    }));
    
    const tieredLeaguesWithType = allTieredLeagues.map(t => ({
      ...t,
      entityType: 'tiered_league' as const,
      isMain: false,
      iconName: t.iconName || 'Layers',
      iconColor: t.iconColor || '#eab308',
      type: 'tiered',
    }));
    
    return [...competitionsWithType, ...tieredLeaguesWithType];
  }

  async getAllUpcomingRaces(): Promise<any[]> {
    // Get all upcoming races from active leagues (dedupe by race id)
    const upcomingRaces = await db
      .select({
        id: races.id,
        name: races.name,
        date: races.date,
        location: races.location,
        status: races.status,
        leagueId: races.leagueId,
      })
      .from(races)
      .innerJoin(leagues, eq(races.leagueId, leagues.id))
      .where(and(eq(races.status, 'scheduled'), eq(leagues.status, 'active')))
      .orderBy(races.date);
    
    // For each race, get the first competition it belongs to (for display purposes)
    const racesWithCompetitions = [];
    for (const race of upcomingRaces) {
      const raceComps = await db
        .select({ competition: competitions })
        .from(raceCompetitions)
        .innerJoin(competitions, eq(raceCompetitions.competitionId, competitions.id))
        .where(eq(raceCompetitions.raceId, race.id))
        .limit(1);
      
      racesWithCompetitions.push({
        ...race,
        competitionId: raceComps[0]?.competition.id || null,
        competitionName: raceComps[0]?.competition.name || null,
      });
    }
    return racesWithCompetitions;
  }

  async getMainCompetition(): Promise<Competition | null> {
    const [main] = await db
      .select({ competition: competitions })
      .from(competitions)
      .innerJoin(leagues, eq(competitions.leagueId, leagues.id))
      .where(and(eq(competitions.isMain, true), eq(leagues.status, 'active')))
      .limit(1);
    return main?.competition || null;
  }

  async setMainCompetition(competitionId: number): Promise<void> {
    await db.transaction(async (tx) => {
      const [competition] = await tx.select().from(competitions).where(eq(competitions.id, competitionId)).limit(1);
      if (!competition) {
        throw new Error("Competition not found");
      }
      await tx.update(competitions).set({ isMain: false });
      await tx.update(competitions).set({ isMain: true }).where(eq(competitions.id, competitionId));
    });
  }

  async getMainLeague(): Promise<League | null> {
    const [league] = await db.select().from(leagues).where(and(eq(leagues.isMain, true), eq(leagues.status, 'active'))).limit(1);
    return league || null;
  }

  async setMainLeague(leagueId: number): Promise<void> {
    await db.transaction(async (tx) => {
      const [league] = await tx.select().from(leagues).where(eq(leagues.id, leagueId)).limit(1);
      if (!league) {
        throw new Error("League not found");
      }
      await tx.update(leagues).set({ isMain: false });
      await tx.update(leagues).set({ isMain: true }).where(eq(leagues.id, leagueId));
    });
  }

  // Badges
  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges).orderBy(badges.sortOrder);
  }

  async getBadgeBySlug(slug: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.slug, slug));
    return badge;
  }

  async seedPredefinedBadges(): Promise<void> {
    const { PREDEFINED_BADGES } = await import("@shared/predefined-badges");
    
    for (const badge of PREDEFINED_BADGES) {
      const existing = await this.getBadgeBySlug(badge.slug);
      if (!existing) {
        await db.insert(badges).values({
          slug: badge.slug,
          name: badge.name,
          description: badge.description,
          category: badge.category,
          iconName: badge.iconName,
          iconColor: badge.iconColor,
          criteria: badge.criteria,
          threshold: badge.threshold,
          sortOrder: badge.sortOrder,
        });
      } else {
        // Update existing badge to ensure definition matches
        await db.update(badges)
          .set({
            name: badge.name,
            description: badge.description,
            category: badge.category,
            iconName: badge.iconName,
            iconColor: badge.iconColor,
            criteria: badge.criteria,
            threshold: badge.threshold,
            sortOrder: badge.sortOrder,
          })
          .where(eq(badges.slug, badge.slug));
      }
    }
  }

  async getProfileBadges(profileId: number): Promise<(ProfileBadge & { badge: Badge })[]> {
    const result = await db
      .select()
      .from(profileBadges)
      .innerJoin(badges, eq(profileBadges.badgeId, badges.id))
      .where(eq(profileBadges.profileId, profileId))
      .orderBy(desc(profileBadges.earnedAt));
    
    return result.map(r => ({
      ...r.profile_badges,
      badge: r.badges,
    }));
  }

  async awardBadge(profileId: number, badgeId: number): Promise<ProfileBadge> {
    const existing = await db.select().from(profileBadges)
      .where(and(eq(profileBadges.profileId, profileId), eq(profileBadges.badgeId, badgeId)));
    if (existing.length > 0) return existing[0];
    
    const [badge] = await db.insert(profileBadges).values({ profileId, badgeId }).returning();
    
    await db.insert(badgeNotifications).values({ profileId, badgeId });
    
    return badge;
  }

  async revokeBadge(profileId: number, badgeId: number): Promise<void> {
    await db.delete(profileBadges)
      .where(and(eq(profileBadges.profileId, profileId), eq(profileBadges.badgeId, badgeId)));
    await db.delete(badgeNotifications)
      .where(and(eq(badgeNotifications.profileId, profileId), eq(badgeNotifications.badgeId, badgeId)));
  }
  
  async getUnreadBadgeNotifications(profileId: number): Promise<{ notification: { id: number; createdAt: Date }; badge: Badge }[]> {
    const result = await db
      .select({
        notification: { id: badgeNotifications.id, createdAt: badgeNotifications.createdAt },
        badge: badges,
      })
      .from(badgeNotifications)
      .innerJoin(badges, eq(badgeNotifications.badgeId, badges.id))
      .where(and(eq(badgeNotifications.profileId, profileId), eq(badgeNotifications.isRead, false)))
      .orderBy(desc(badgeNotifications.createdAt));
    return result;
  }
  
  async markBadgeNotificationsRead(profileId: number): Promise<void> {
    await db.update(badgeNotifications)
      .set({ isRead: true })
      .where(eq(badgeNotifications.profileId, profileId));
  }


  async getProfilesWithBadge(badgeId: number): Promise<{ profileId: number; badgeId: number }[]> {
    const result = await db
      .select({ profileId: profileBadges.profileId, badgeId: profileBadges.badgeId })
      .from(profileBadges)
      .where(eq(profileBadges.badgeId, badgeId));
    return result;
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  async updateBadge(id: number, data: Partial<InsertBadge>): Promise<Badge> {
    const [updated] = await db.update(badges).set(data).where(eq(badges.id, id)).returning();
    return updated;
  }

  async deleteBadge(id: number): Promise<void> {
    await db.delete(profileBadges).where(eq(profileBadges.badgeId, id));
    await db.delete(badges).where(eq(badges.id, id));
  }

  // Season Goals
  async syncSeasonGoalProgress(profileId: number): Promise<void> {
    // Get all goals for this profile
    const goals = await db.select().from(seasonGoals).where(eq(seasonGoals.profileId, profileId));
    
    // Get all results for this profile with their race's league (including qualifying data)
    const driverResults = await db
      .select({
        position: results.position,
        qualifyingPosition: results.qualifyingPosition,
        points: results.points,
        leagueId: races.leagueId,
      })
      .from(results)
      .innerJoin(races, eq(results.raceId, races.id))
      .where(eq(results.racerId, profileId));
    
    // Calculate stats per league (expanded for new goal types)
    const leagueStats = new Map<number, { 
      points: number; wins: number; podiums: number; races: number; 
      top5: number; top10: number; poles: number; frontRow: number; 
      gridClimber: number; perfectWeekend: number;
    }>();
    
    for (const result of driverResults) {
      const stats = leagueStats.get(result.leagueId) || { 
        points: 0, wins: 0, podiums: 0, races: 0, 
        top5: 0, top10: 0, poles: 0, frontRow: 0, 
        gridClimber: 0, perfectWeekend: 0
      };
      
      stats.points += result.points;
      stats.races += 1;
      if (result.position === 1) stats.wins += 1;
      if (result.position <= 3) stats.podiums += 1;
      if (result.position <= 5) stats.top5 += 1;
      if (result.position <= 10) stats.top10 += 1;
      
      // Qualifying-based stats
      if (result.qualifyingPosition !== null) {
        if (result.qualifyingPosition === 1) stats.poles += 1;
        if (result.qualifyingPosition <= 2) stats.frontRow += 1;
        // Grid climber: finished higher (lower number) than started
        if (result.position < result.qualifyingPosition) stats.gridClimber += 1;
        // Perfect weekend: pole position AND win
        if (result.qualifyingPosition === 1 && result.position === 1) stats.perfectWeekend += 1;
      }
      
      leagueStats.set(result.leagueId, stats);
    }
    
    // Get current standings for position goals (championship position)
    // Now shows current position even if league not completed
    const leaguePositions = new Map<number, number>();
    const uniqueLeagueIds = Array.from(new Set(goals.map(g => g.leagueId)));
    
    for (const lid of uniqueLeagueIds) {
      // Get main competition for this league to calculate standings
      const [mainComp] = await db.select().from(competitions)
        .where(and(eq(competitions.leagueId, lid), eq(competitions.isMain, true)));
      
      if (mainComp) {
        // Get all results for races in this competition
        const raceIds = await db
          .select({ raceId: raceCompetitions.raceId })
          .from(raceCompetitions)
          .where(eq(raceCompetitions.competitionId, mainComp.id));
        
        if (raceIds.length > 0) {
          const raceIdList = raceIds.map(r => r.raceId);
          const standingsData = await db
            .select({
              racerId: results.racerId,
              points: results.points,
            })
            .from(results)
            .where(inArray(results.raceId, raceIdList));
          
          // Aggregate points per driver
          const driverPoints = new Map<number, number>();
          for (const r of standingsData) {
            driverPoints.set(r.racerId, (driverPoints.get(r.racerId) || 0) + r.points);
          }
          
          // Sort by points descending
          const sorted = Array.from(driverPoints.entries()).sort((a, b) => b[1] - a[1]);
          const position = sorted.findIndex(([id]) => id === profileId) + 1;
          if (position > 0) {
            leaguePositions.set(lid, position);
          }
        }
      }
    }
    
    // Update each goal's currentValue based on type
    for (const goal of goals) {
      const stats = leagueStats.get(goal.leagueId) || { 
        points: 0, wins: 0, podiums: 0, races: 0,
        top5: 0, top10: 0, poles: 0, frontRow: 0, 
        gridClimber: 0, perfectWeekend: 0
      };
      let newValue = 0;
      
      switch (goal.goalType) {
        case 'points':
          newValue = stats.points;
          break;
        case 'wins':
          newValue = stats.wins;
          break;
        case 'podiums':
          newValue = stats.podiums;
          break;
        case 'races':
          newValue = stats.races;
          break;
        case 'position':
          // Current championship standing (0 means not ranked yet)
          newValue = leaguePositions.get(goal.leagueId) || 0;
          break;
        case 'top5':
          newValue = stats.top5;
          break;
        case 'top10':
          newValue = stats.top10;
          break;
        case 'poles':
          newValue = stats.poles;
          break;
        case 'frontRow':
          newValue = stats.frontRow;
          break;
        case 'gridClimber':
          newValue = stats.gridClimber;
          break;
        case 'perfectWeekend':
          newValue = stats.perfectWeekend;
          break;
      }
      
      // Only update if value changed
      if (goal.currentValue !== newValue) {
        await db.update(seasonGoals)
          .set({ currentValue: newValue })
          .where(eq(seasonGoals.id, goal.id));
      }
    }
  }

  async getSeasonGoals(profileId: number, leagueId?: number): Promise<SeasonGoal[]> {
    // First sync the progress from actual race data
    await this.syncSeasonGoalProgress(profileId);
    
    if (leagueId) {
      return await db.select().from(seasonGoals)
        .where(and(eq(seasonGoals.profileId, profileId), eq(seasonGoals.leagueId, leagueId)));
    }
    return await db.select().from(seasonGoals).where(eq(seasonGoals.profileId, profileId));
  }

  async getSeasonGoalById(id: number): Promise<SeasonGoal | undefined> {
    const [goal] = await db.select().from(seasonGoals).where(eq(seasonGoals.id, id));
    return goal;
  }

  async createSeasonGoal(goal: InsertSeasonGoal): Promise<SeasonGoal> {
    const [newGoal] = await db.insert(seasonGoals).values(goal).returning();
    return newGoal;
  }

  async updateSeasonGoal(id: number, data: Partial<SeasonGoal>): Promise<SeasonGoal> {
    const [updated] = await db.update(seasonGoals).set(data).where(eq(seasonGoals.id, id)).returning();
    return updated;
  }

  async deleteSeasonGoal(id: number): Promise<void> {
    await db.delete(seasonGoals).where(eq(seasonGoals.id, id));
  }

  // Race Check-ins
  async getRaceCheckins(raceId: number): Promise<(RaceCheckin & { profile: Profile })[]> {
    const result = await db
      .select()
      .from(raceCheckins)
      .innerJoin(profiles, eq(raceCheckins.profileId, profiles.id))
      .where(eq(raceCheckins.raceId, raceId));
    
    return result.map(r => ({
      ...r.race_checkins,
      profile: r.profiles,
    }));
  }

  async getProfileCheckin(raceId: number, profileId: number): Promise<RaceCheckin | undefined> {
    const [checkin] = await db.select().from(raceCheckins)
      .where(and(eq(raceCheckins.raceId, raceId), eq(raceCheckins.profileId, profileId)));
    return checkin;
  }

  async setCheckin(data: InsertRaceCheckin): Promise<RaceCheckin> {
    const existing = await this.getProfileCheckin(data.raceId, data.profileId);
    if (existing) {
      const [updated] = await db.update(raceCheckins)
        .set({ status: data.status, checkedInAt: new Date() })
        .where(eq(raceCheckins.id, existing.id))
        .returning();
      return updated;
    }
    const [newCheckin] = await db.insert(raceCheckins).values(data).returning();
    return newCheckin;
  }

  // Personal Bests
  async getPersonalBests(profileId: number): Promise<PersonalBest[]> {
    return await db.select().from(personalBests)
      .where(eq(personalBests.profileId, profileId))
      .orderBy(personalBests.location);
  }

  async updatePersonalBest(profileId: number, location: string, bestTime: string, raceId?: number): Promise<PersonalBest> {
    const existing = await db.select().from(personalBests)
      .where(and(eq(personalBests.profileId, profileId), eq(personalBests.location, location)));
    
    if (existing.length > 0) {
      const [updated] = await db.update(personalBests)
        .set({ bestTime, raceId, achievedAt: new Date() })
        .where(eq(personalBests.id, existing[0].id))
        .returning();
      return updated;
    }
    
    const [newPB] = await db.insert(personalBests)
      .values({ profileId, location, bestTime, raceId })
      .returning();
    return newPB;
  }

  // Driver Stats
  async getDriverStats(profileId: number): Promise<{
    totalRaces: number;
    totalPoints: number;
    avgPosition: number;
    wins: number;
    podiums: number;
    bestPosition: number;
  }> {
    const allResults = await db.select().from(results).where(eq(results.racerId, profileId));
    
    if (allResults.length === 0) {
      return { totalRaces: 0, totalPoints: 0, avgPosition: 0, wins: 0, podiums: 0, bestPosition: 0 };
    }
    
    const totalRaces = allResults.length;
    const totalPoints = allResults.reduce((sum, r) => sum + r.points, 0);
    const avgPosition = allResults.reduce((sum, r) => sum + r.position, 0) / totalRaces;
    const wins = allResults.filter(r => r.position === 1).length;
    const podiums = allResults.filter(r => r.position <= 3).length;
    const bestPosition = Math.min(...allResults.map(r => r.position));
    
    return { totalRaces, totalPoints, avgPosition: Math.round(avgPosition * 10) / 10, wins, podiums, bestPosition };
  }

  // Head-to-Head
  async getHeadToHeadStats(profileId1: number, profileId2: number): Promise<{
    driver1Wins: number;
    driver2Wins: number;
    draws: number;
    driver1Podiums: number;
    driver2Podiums: number;
    driver1Points: number;
    driver2Points: number;
    driver1AvgPosition: number;
    driver2AvgPosition: number;
    driver1AvgQuali: number | null;
    driver2AvgQuali: number | null;
    recentFormDriver1: number;
    recentFormDriver2: number;
    podiumDifferential: number;
    pointsDifferential: number;
    avgPositionGap: number;
    avgQualiGap: number | null;
    races: any[];
  }> {
    const driver1Results = await db
      .select({ 
        raceId: results.raceId, 
        position: results.position, 
        points: results.points,
        qualifyingPosition: results.qualifyingPosition 
      })
      .from(results)
      .where(eq(results.racerId, profileId1));
    
    const driver2Results = await db
      .select({ 
        raceId: results.raceId, 
        position: results.position, 
        points: results.points,
        qualifyingPosition: results.qualifyingPosition 
      })
      .from(results)
      .where(eq(results.racerId, profileId2));
    
    const driver2Map = new Map(driver2Results.map(r => [r.raceId, { 
      position: r.position, 
      points: r.points, 
      qualifyingPosition: r.qualifyingPosition 
    }]));
    
    let driver1Wins = 0;
    let driver2Wins = 0;
    let draws = 0;
    let driver1Podiums = 0;
    let driver2Podiums = 0;
    let driver1Points = 0;
    let driver2Points = 0;
    let driver1TotalPosition = 0;
    let driver2TotalPosition = 0;
    let driver1QualiSum = 0;
    let driver2QualiSum = 0;
    let qualiCount1 = 0;
    let qualiCount2 = 0;
    const sharedRaces: any[] = [];
    
    for (const r1 of driver1Results) {
      const d2Data = driver2Map.get(r1.raceId);
      if (d2Data !== undefined) {
        const race = await this.getRace(r1.raceId);
        
        // Position totals for average
        driver1TotalPosition += r1.position;
        driver2TotalPosition += d2Data.position;
        
        // Points
        driver1Points += r1.points;
        driver2Points += d2Data.points;
        
        // Podiums (in races where they both competed)
        if (r1.position <= 3) driver1Podiums++;
        if (d2Data.position <= 3) driver2Podiums++;
        
        // Qualifying positions
        if (r1.qualifyingPosition) {
          driver1QualiSum += r1.qualifyingPosition;
          qualiCount1++;
        }
        if (d2Data.qualifyingPosition) {
          driver2QualiSum += d2Data.qualifyingPosition;
          qualiCount2++;
        }
        
        if (r1.position < d2Data.position) {
          driver1Wins++;
          sharedRaces.push({ 
            ...race, 
            driver1Position: r1.position, 
            driver2Position: d2Data.position, 
            driver1Points: r1.points,
            driver2Points: d2Data.points,
            driver1Quali: r1.qualifyingPosition,
            driver2Quali: d2Data.qualifyingPosition,
            winner: 1 
          });
        } else if (d2Data.position < r1.position) {
          driver2Wins++;
          sharedRaces.push({ 
            ...race, 
            driver1Position: r1.position, 
            driver2Position: d2Data.position, 
            driver1Points: r1.points,
            driver2Points: d2Data.points,
            driver1Quali: r1.qualifyingPosition,
            driver2Quali: d2Data.qualifyingPosition,
            winner: 2 
          });
        } else {
          draws++;
          sharedRaces.push({ 
            ...race, 
            driver1Position: r1.position, 
            driver2Position: d2Data.position, 
            driver1Points: r1.points,
            driver2Points: d2Data.points,
            driver1Quali: r1.qualifyingPosition,
            driver2Quali: d2Data.qualifyingPosition,
            winner: 0 
          });
        }
      }
    }
    
    const totalSharedRaces = sharedRaces.length;
    const driver1AvgPosition = totalSharedRaces > 0 ? Math.round((driver1TotalPosition / totalSharedRaces) * 10) / 10 : 0;
    const driver2AvgPosition = totalSharedRaces > 0 ? Math.round((driver2TotalPosition / totalSharedRaces) * 10) / 10 : 0;
    const driver1AvgQuali = qualiCount1 > 0 ? Math.round((driver1QualiSum / qualiCount1) * 10) / 10 : null;
    const driver2AvgQuali = qualiCount2 > 0 ? Math.round((driver2QualiSum / qualiCount2) * 10) / 10 : null;
    
    // Calculate differentials
    const podiumDifferential = driver1Podiums - driver2Podiums;
    const pointsDifferential = driver1Points - driver2Points;
    const avgPositionGap = Math.round((driver2AvgPosition - driver1AvgPosition) * 10) / 10; // Positive = driver1 better
    const avgQualiGap = (driver1AvgQuali !== null && driver2AvgQuali !== null) 
      ? Math.round((driver2AvgQuali - driver1AvgQuali) * 10) / 10 
      : null;
    
    // Recent form: count wins in last 5 shared races
    const recentRaces = sharedRaces.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    const recentFormDriver1 = recentRaces.filter(r => r.winner === 1).length;
    const recentFormDriver2 = recentRaces.filter(r => r.winner === 2).length;
    
    return { 
      driver1Wins, 
      driver2Wins, 
      draws, 
      driver1Podiums,
      driver2Podiums,
      driver1Points,
      driver2Points,
      driver1AvgPosition,
      driver2AvgPosition,
      driver1AvgQuali,
      driver2AvgQuali,
      recentFormDriver1,
      recentFormDriver2,
      podiumDifferential,
      pointsDifferential,
      avgPositionGap,
      avgQualiGap,
      races: sharedRaces 
    };
  }

  // Quick Results
  async getRecentResults(profileId: number, limit: number = 5): Promise<any[]> {
    return await db
      .select({
        raceId: races.id,
        position: results.position,
        points: results.points,
        raceTime: results.raceTime,
        raceName: races.name,
        raceDate: races.date,
        location: races.location,
      })
      .from(results)
      .innerJoin(races, eq(results.raceId, races.id))
      .where(eq(results.racerId, profileId))
      .orderBy(desc(races.date))
      .limit(limit);
  }

  // Driver Icons
  async getDriverIcons(): Promise<DriverIcon[]> {
    return await db.select().from(driverIcons).orderBy(driverIcons.name);
  }

  async getDriverIconBySlug(slug: string): Promise<DriverIcon | undefined> {
    const [icon] = await db.select().from(driverIcons).where(eq(driverIcons.slug, slug));
    return icon;
  }

  async getDriverIconById(id: number): Promise<DriverIcon | undefined> {
    const [icon] = await db.select().from(driverIcons).where(eq(driverIcons.id, id));
    return icon;
  }

  async createDriverIcon(icon: InsertDriverIcon): Promise<DriverIcon> {
    const [newIcon] = await db.insert(driverIcons).values(icon).returning();
    return newIcon;
  }

  async updateDriverIcon(id: number, data: Partial<InsertDriverIcon>): Promise<DriverIcon> {
    const [updated] = await db.update(driverIcons).set(data).where(eq(driverIcons.id, id)).returning();
    return updated;
  }

  async deleteDriverIcon(id: number): Promise<void> {
    await db.delete(driverIconNotifications).where(eq(driverIconNotifications.iconId, id));
    await db.delete(profileDriverIcons).where(eq(profileDriverIcons.iconId, id));
    await db.delete(driverIcons).where(eq(driverIcons.id, id));
  }

  async seedPredefinedDriverIcons(): Promise<void> {
    const { PREDEFINED_ICONS } = await import("@shared/predefined-icons");
    
    for (const icon of PREDEFINED_ICONS) {
      const existing = await this.getDriverIconBySlug(icon.slug);
      if (!existing) {
        await db.insert(driverIcons).values({
          slug: icon.slug,
          name: icon.name,
          description: icon.description,
          iconName: icon.iconName,
          iconColor: icon.iconColor,
          isPredefined: true,
        });
      }
    }
  }

  async getProfileDriverIcons(profileId: number): Promise<(ProfileDriverIcon & { icon: DriverIcon })[]> {
    const result = await db
      .select()
      .from(profileDriverIcons)
      .innerJoin(driverIcons, eq(profileDriverIcons.iconId, driverIcons.id))
      .where(eq(profileDriverIcons.profileId, profileId))
      .orderBy(desc(profileDriverIcons.awardedAt));
    
    return result.map(r => ({
      ...r.profile_driver_icons,
      icon: r.driver_icons,
    }));
  }

  async getProfilesWithDriverIcon(iconId: number): Promise<{ profileId: number }[]> {
    const result = await db
      .select({ profileId: profileDriverIcons.profileId })
      .from(profileDriverIcons)
      .where(eq(profileDriverIcons.iconId, iconId));
    return result;
  }

  async getAllDriversWithIcons(): Promise<{ profileId: number; icons: DriverIcon[] }[]> {
    const result = await db
      .select({
        profileId: profileDriverIcons.profileId,
        icon: driverIcons,
      })
      .from(profileDriverIcons)
      .innerJoin(driverIcons, eq(profileDriverIcons.iconId, driverIcons.id));
    
    const grouped = new Map<number, DriverIcon[]>();
    for (const row of result) {
      const icons = grouped.get(row.profileId) || [];
      icons.push(row.icon);
      grouped.set(row.profileId, icons);
    }
    
    return Array.from(grouped.entries()).map(([profileId, icons]) => ({ profileId, icons }));
  }

  async awardDriverIcon(profileId: number, iconId: number, awardedByProfileId: number): Promise<ProfileDriverIcon> {
    const existing = await db.select().from(profileDriverIcons)
      .where(and(eq(profileDriverIcons.profileId, profileId), eq(profileDriverIcons.iconId, iconId)));
    if (existing.length > 0) return existing[0];
    
    const [assignment] = await db.insert(profileDriverIcons).values({ 
      profileId, 
      iconId, 
      awardedByProfileId 
    }).returning();
    
    await db.insert(driverIconNotifications).values({ profileId, iconId });
    
    return assignment;
  }

  async revokeDriverIcon(profileId: number, iconId: number): Promise<void> {
    await db.delete(profileDriverIcons)
      .where(and(eq(profileDriverIcons.profileId, profileId), eq(profileDriverIcons.iconId, iconId)));
    await db.delete(driverIconNotifications)
      .where(and(eq(driverIconNotifications.profileId, profileId), eq(driverIconNotifications.iconId, iconId)));
  }

  async getUnreadDriverIconNotifications(profileId: number): Promise<{ notification: { id: number; createdAt: Date }; icon: DriverIcon }[]> {
    const result = await db
      .select({
        notification: { id: driverIconNotifications.id, createdAt: driverIconNotifications.createdAt },
        icon: driverIcons,
      })
      .from(driverIconNotifications)
      .innerJoin(driverIcons, eq(driverIconNotifications.iconId, driverIcons.id))
      .where(and(eq(driverIconNotifications.profileId, profileId), eq(driverIconNotifications.isRead, false)))
      .orderBy(desc(driverIconNotifications.createdAt));
    return result;
  }

  async markDriverIconNotificationsRead(profileId: number): Promise<void> {
    await db.update(driverIconNotifications)
      .set({ isRead: true })
      .where(eq(driverIconNotifications.profileId, profileId));
  }
}

export const storage = new DatabaseStorage();
