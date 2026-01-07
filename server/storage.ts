import { db } from "./db";
import { 
  leagues, competitions, races, results, profiles, teams, enrollments,
  type League, type Competition, type Race, type Result, type Profile, type Team, type Enrollment,
  type InsertLeague, type InsertCompetition, type InsertRace, type InsertResult, type InsertProfile, type InsertTeam, type InsertEnrollment
} from "@shared/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

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
  getRace(id: number): Promise<Race | undefined>;
  createRace(race: InsertRace): Promise<Race>;
  updateRace(id: number, data: Partial<InsertRace>): Promise<Race>;
  deleteRace(id: number): Promise<void>;

  // Results
  getResults(raceId: number): Promise<Result[]>;
  replaceRaceResults(raceId: number, resultsData: Omit<InsertResult, 'raceId'>[]): Promise<Result[]>;

  // Teams
  getTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;

  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  async getLeagues(): Promise<League[]> {
    return await db.select().from(leagues).orderBy(desc(leagues.seasonStart));
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
    return updated;
  }
  async deleteLeague(id: number): Promise<void> {
    // Cascade delete: get all competitions, then their races and results
    const comps = await db.select().from(competitions).where(eq(competitions.leagueId, id));
    for (const comp of comps) {
      const compRaces = await db.select().from(races).where(eq(races.competitionId, comp.id));
      for (const race of compRaces) {
        await db.delete(results).where(eq(results.raceId, race.id));
      }
      await db.delete(races).where(eq(races.competitionId, comp.id));
    }
    await db.delete(competitions).where(eq(competitions.leagueId, id));
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
    // Cascade delete: delete all races and their results first
    const compRaces = await db.select().from(races).where(eq(races.competitionId, id));
    for (const race of compRaces) {
      await db.delete(results).where(eq(results.raceId, race.id));
    }
    await db.delete(races).where(eq(races.competitionId, id));
    await db.delete(competitions).where(eq(competitions.id, id));
  }

  async getRaces(competitionId: number): Promise<Race[]> {
    return await db.select().from(races).where(eq(races.competitionId, competitionId)).orderBy(races.date);
  }
  async getRace(id: number): Promise<Race | undefined> {
    const [race] = await db.select().from(races).where(eq(races.id, id));
    return race;
  }
  async createRace(race: InsertRace): Promise<Race> {
    const [newRace] = await db.insert(races).values(race).returning();
    return newRace;
  }
  async updateRace(id: number, data: Partial<InsertRace>): Promise<Race> {
    const [updated] = await db.update(races).set(data).where(eq(races.id, id)).returning();
    return updated;
  }
  async deleteRace(id: number): Promise<void> {
    await db.delete(results).where(eq(results.raceId, id));
    await db.delete(races).where(eq(races.id, id));
  }

  async getResults(raceId: number): Promise<Result[]> {
    return await db.select().from(results).where(eq(results.raceId, raceId)).orderBy(results.position);
  }

  async replaceRaceResults(raceId: number, resultsData: Omit<InsertResult, 'raceId'>[]): Promise<Result[]> {
    return await db.transaction(async (tx) => {
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
    // First delete all race results for this driver to avoid foreign key constraint
    await db.delete(results).where(eq(results.racerId, id));
    // Then delete the profile
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
    // Get all races for this competition
    const competitionRaces = await db.select().from(races).where(eq(races.competitionId, competitionId));
    if (competitionRaces.length === 0) return [];

    const raceIds = competitionRaces.map(r => r.id);
    
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

    // Aggregate by racer
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
      // Filter by competition AND scheduled status
      return await db.select().from(races)
        .where(and(
          eq(races.competitionId, competitionId),
          eq(races.status, 'scheduled')
        ))
        .orderBy(races.date);
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
      .where(eq(enrollments.profileId, profileId));
    return enrolled.map(e => e.competition);
  }

  async getProfileRaceHistoryByCompetition(profileId: number): Promise<any[]> {
    const profileResults = await db
      .select({
        position: results.position,
        points: results.points,
        raceTime: results.raceTime,
        raceName: races.name,
        raceDate: races.date,
        location: races.location,
        competitionId: competitions.id,
        competitionName: competitions.name,
      })
      .from(results)
      .innerJoin(races, eq(results.raceId, races.id))
      .innerJoin(competitions, eq(races.competitionId, competitions.id))
      .where(eq(results.racerId, profileId))
      .orderBy(desc(races.date));
    return profileResults;
  }

  async getAllActiveCompetitions(): Promise<any[]> {
    const allCompetitions = await db
      .select({
        id: competitions.id,
        name: competitions.name,
        type: competitions.type,
        leagueId: competitions.leagueId,
        leagueName: leagues.name,
      })
      .from(competitions)
      .innerJoin(leagues, eq(competitions.leagueId, leagues.id))
      .orderBy(leagues.name, competitions.name);
    return allCompetitions;
  }

  async getAllUpcomingRaces(): Promise<any[]> {
    const upcomingRaces = await db
      .select({
        id: races.id,
        name: races.name,
        date: races.date,
        location: races.location,
        status: races.status,
        competitionId: races.competitionId,
        competitionName: competitions.name,
      })
      .from(races)
      .innerJoin(competitions, eq(races.competitionId, competitions.id))
      .where(eq(races.status, 'scheduled'))
      .orderBy(races.date);
    return upcomingRaces;
  }

  async getMainCompetition(): Promise<Competition | null> {
    const [main] = await db.select().from(competitions).where(eq(competitions.isMain, true)).limit(1);
    return main || null;
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
}

export const storage = new DatabaseStorage();
