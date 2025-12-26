import { db } from "./db";
import { 
  leagues, competitions, races, results, profiles, teams,
  type League, type Competition, type Race, type Result, type Profile, type Team,
  type InsertLeague, type InsertCompetition, type InsertRace, type InsertResult, type InsertProfile, type InsertTeam
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Leagues
  getLeagues(): Promise<League[]>;
  getLeague(id: number): Promise<League | undefined>;
  createLeague(league: InsertLeague): Promise<League>;

  // Competitions
  getCompetitions(leagueId: number): Promise<Competition[]>;
  createCompetition(competition: InsertCompetition): Promise<Competition>;

  // Races
  getRaces(competitionId: number): Promise<Race[]>;
  getRace(id: number): Promise<Race | undefined>;
  createRace(race: InsertRace): Promise<Race>;

  // Results
  getResults(raceId: number): Promise<Result[]>;
  submitResults(results: InsertResult[]): Promise<Result[]>;

  // Teams
  getTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;

  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: number, profile: Partial<InsertProfile>): Promise<Profile>;
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

  async getCompetitions(leagueId: number): Promise<Competition[]> {
    return await db.select().from(competitions).where(eq(competitions.leagueId, leagueId));
  }
  async createCompetition(competition: InsertCompetition): Promise<Competition> {
    const [newComp] = await db.insert(competitions).values(competition).returning();
    return newComp;
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

  async getResults(raceId: number): Promise<Result[]> {
    return await db.select().from(results).where(eq(results.raceId, raceId)).orderBy(results.position);
  }
  async submitResults(resultsData: InsertResult[]): Promise<Result[]> {
    return await db.insert(results).values(resultsData).returning();
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
  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }
  async updateProfile(id: number, profileData: Partial<InsertProfile>): Promise<Profile> {
    const [updated] = await db.update(profiles).set(profileData).where(eq(profiles.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
