import { db } from "./db";
import { 
  leagues, competitions, races, results, profiles, teams, enrollments, raceCompetitions,
  badges, profileBadges, seasonGoals, raceCheckins, personalBests,
  type League, type Competition, type Race, type Result, type Profile, type Team, type Enrollment, type RaceCompetition,
  type Badge, type ProfileBadge, type SeasonGoal, type RaceCheckin, type PersonalBest,
  type InsertLeague, type InsertCompetition, type InsertRace, type InsertResult, type InsertProfile, type InsertTeam, type InsertEnrollment,
  type InsertBadge, type InsertSeasonGoal, type InsertRaceCheckin, type InsertPersonalBest
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
  
  // Enrollments
  getEnrollments(competitionId: number): Promise<Enrollment[]>;
  getEnrolledDrivers(competitionId: number): Promise<Profile[]>;
  enrollDriver(competitionId: number, profileId: number): Promise<Enrollment>;
  unenrollDriver(competitionId: number, profileId: number): Promise<void>;
  getDriverEnrolledCompetitions(profileId: number): Promise<Competition[]>;
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
  deleteBadge(id: number): Promise<void>;
  seedPredefinedBadges(): Promise<void>;
  getBadgeBySlug(slug: string): Promise<Badge | undefined>;
  
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
    
    // Delete all competitions in this league (which cascades to enrollments)
    const comps = await db.select().from(competitions).where(eq(competitions.leagueId, id));
    for (const comp of comps) {
      await db.delete(enrollments).where(eq(enrollments.competitionId, comp.id));
    }
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
    
    // Delete enrollments for this competition
    await db.delete(enrollments).where(eq(enrollments.competitionId, id));
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
    // Delete race results
    await db.delete(results).where(eq(results.raceId, id));
    // Delete race check-ins
    await db.delete(raceCheckins).where(eq(raceCheckins.raceId, id));
    // Clear personal best references to this race (set raceId to null)
    await db.update(personalBests).set({ raceId: null }).where(eq(personalBests.raceId, id));
    // Delete race-competition links
    await db.delete(raceCompetitions).where(eq(raceCompetitions.raceId, id));
    // Delete the race
    await db.delete(races).where(eq(races.id, id));
  }

  async getResults(raceId: number): Promise<Result[]> {
    return await db.select().from(results).where(eq(results.raceId, raceId)).orderBy(results.position);
  }

  async replaceRaceResults(raceId: number, resultsData: Omit<InsertResult, 'raceId'>[]): Promise<Result[]> {
    // Get the race to find its location
    const race = await this.getRace(raceId);
    
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
    
    // Auto-update personal bests for drivers with race times
    if (race) {
      for (const result of insertedResults) {
        if (result.raceTime && result.racerId) {
          await this.checkAndUpdatePersonalBest(result.racerId, race.location, result.raceTime, raceId);
        }
      }
    }
    
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
    // First delete all competition enrollments for this driver to avoid foreign key constraint
    await db.delete(enrollments).where(eq(enrollments.profileId, id));
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
    
    // Get enrolled drivers for this competition
    const enrolledDriverIds = await db
      .select({ profileId: enrollments.profileId })
      .from(enrollments)
      .where(eq(enrollments.competitionId, competitionId));
    
    const enrolledIds = new Set(enrolledDriverIds.map(e => e.profileId));
    
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

    // Aggregate by racer - only include enrolled drivers
    const standingsMap = new Map<number, { racerId: number; driverName: string | null; fullName: string | null; points: number; podiums: number }>();
    
    for (const result of allRaceResults) {
      // Skip drivers who are not enrolled in this competition
      if (!enrolledIds.has(result.racerId)) continue;
      
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

  async getEnrollments(competitionId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.competitionId, competitionId));
  }

  async getEnrolledDrivers(competitionId: number): Promise<Profile[]> {
    const enrolled = await db
      .select({ profile: profiles })
      .from(enrollments)
      .innerJoin(profiles, eq(enrollments.profileId, profiles.id))
      .where(eq(enrollments.competitionId, competitionId));
    return enrolled.map(e => e.profile);
  }

  async enrollDriver(competitionId: number, profileId: number): Promise<Enrollment> {
    // Check if already enrolled
    const existing = await db.select().from(enrollments)
      .where(and(eq(enrollments.competitionId, competitionId), eq(enrollments.profileId, profileId)));
    if (existing.length > 0) return existing[0];
    
    const [enrollment] = await db.insert(enrollments).values({ competitionId, profileId }).returning();
    return enrollment;
  }

  async unenrollDriver(competitionId: number, profileId: number): Promise<void> {
    await db.delete(enrollments).where(
      and(eq(enrollments.competitionId, competitionId), eq(enrollments.profileId, profileId))
    );
  }

  async getDriverEnrolledCompetitions(profileId: number): Promise<Competition[]> {
    const enrolled = await db
      .select({ competition: competitions })
      .from(enrollments)
      .innerJoin(competitions, eq(enrollments.competitionId, competitions.id))
      .innerJoin(leagues, eq(competitions.leagueId, leagues.id))
      .where(and(eq(enrollments.profileId, profileId), eq(leagues.status, 'active')));
    return enrolled.map(e => e.competition);
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
    return allCompetitions;
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
    return badge;
  }

  async revokeBadge(profileId: number, badgeId: number): Promise<void> {
    await db.delete(profileBadges)
      .where(and(eq(profileBadges.profileId, profileId), eq(profileBadges.badgeId, badgeId)));
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

  async deleteBadge(id: number): Promise<void> {
    await db.delete(profileBadges).where(eq(profileBadges.badgeId, id));
    await db.delete(badges).where(eq(badges.id, id));
  }

  // Season Goals
  async getSeasonGoals(profileId: number, leagueId?: number): Promise<SeasonGoal[]> {
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
    races: any[];
  }> {
    const driver1Results = await db
      .select({ raceId: results.raceId, position: results.position })
      .from(results)
      .where(eq(results.racerId, profileId1));
    
    const driver2Results = await db
      .select({ raceId: results.raceId, position: results.position })
      .from(results)
      .where(eq(results.racerId, profileId2));
    
    const driver2Map = new Map(driver2Results.map(r => [r.raceId, r.position]));
    
    let driver1Wins = 0;
    let driver2Wins = 0;
    let draws = 0;
    const sharedRaces: any[] = [];
    
    for (const r1 of driver1Results) {
      const d2Pos = driver2Map.get(r1.raceId);
      if (d2Pos !== undefined) {
        const race = await this.getRace(r1.raceId);
        if (r1.position < d2Pos) {
          driver1Wins++;
          sharedRaces.push({ ...race, driver1Position: r1.position, driver2Position: d2Pos, winner: 1 });
        } else if (d2Pos < r1.position) {
          driver2Wins++;
          sharedRaces.push({ ...race, driver1Position: r1.position, driver2Position: d2Pos, winner: 2 });
        } else {
          draws++;
          sharedRaces.push({ ...race, driver1Position: r1.position, driver2Position: d2Pos, winner: 0 });
        }
      }
    }
    
    return { driver1Wins, driver2Wins, draws, races: sharedRaces };
  }

  // Quick Results
  async getRecentResults(profileId: number, limit: number = 5): Promise<any[]> {
    return await db
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
      .orderBy(desc(races.date))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
