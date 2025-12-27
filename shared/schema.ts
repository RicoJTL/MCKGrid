import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./models/auth";
import { users } from "./models/auth";

export const roleEnum = pgEnum("role", ["admin", "racer", "spectator"]);
export const adminLevelEnum = pgEnum("admin_level", ["none", "admin", "super_admin"]);
export const competitionTypeEnum = pgEnum("competition_type", ["series", "single_event", "head_to_head", "time_attack"]);
export const raceStatusEnum = pgEnum("race_status", ["scheduled", "completed", "cancelled"]);

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  logoUrl: text("logo_url"),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: roleEnum("role").default("spectator").notNull(),
  adminLevel: adminLevelEnum("admin_level").default("none").notNull(),
  teamId: integer("team_id").references(() => teams.id),
  fullName: text("full_name"),
  driverName: text("driver_name"),
  profileImage: text("profile_image"),
});

export const leagues = pgTable("leagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  seasonStart: timestamp("season_start"),
  seasonEnd: timestamp("season_end"),
});

export const competitions = pgTable("competitions", {
  id: serial("id").primaryKey(),
  leagueId: integer("league_id").references(() => leagues.id).notNull(),
  name: text("name").notNull(),
  type: competitionTypeEnum("type").default("series").notNull(),
  rules: jsonb("rules").$type<{ pointsSystem: Record<string, number> }>().default({ pointsSystem: {} }),
});

export const races = pgTable("races", {
  id: serial("id").primaryKey(),
  competitionId: integer("competition_id").references(() => competitions.id).notNull(),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  status: raceStatusEnum("status").default("scheduled").notNull(),
});

export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  raceId: integer("race_id").references(() => races.id).notNull(),
  racerId: integer("racer_id").references(() => profiles.id).notNull(),
  position: integer("position").notNull(),
  points: integer("points").notNull(),
  raceTime: text("race_time"),
});

// Relations
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
  team: one(teams, { fields: [profiles.teamId], references: [teams.id] }),
  results: many(results),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(profiles),
}));

export const leaguesRelations = relations(leagues, ({ many }) => ({
  competitions: many(competitions),
}));

export const competitionsRelations = relations(competitions, ({ one, many }) => ({
  league: one(leagues, { fields: [competitions.leagueId], references: [leagues.id] }),
  races: many(races),
}));

export const racesRelations = relations(races, ({ one, many }) => ({
  competition: one(competitions, { fields: [races.competitionId], references: [competitions.id] }),
  results: many(results),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  race: one(races, { fields: [results.raceId], references: [races.id] }),
  racer: one(profiles, { fields: [results.racerId], references: [profiles.id] }),
}));

// Schemas
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertLeagueSchema = createInsertSchema(leagues).omit({ id: true });
export const insertCompetitionSchema = createInsertSchema(competitions).omit({ id: true });
export const insertRaceSchema = createInsertSchema(races).omit({ id: true });
export const insertResultSchema = createInsertSchema(results).omit({ id: true });

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertLeague = z.infer<typeof insertLeagueSchema>;
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type InsertRace = z.infer<typeof insertRaceSchema>;
export type InsertResult = z.infer<typeof insertResultSchema>;

export type Team = typeof teams.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type League = typeof leagues.$inferSelect;
export type Competition = typeof competitions.$inferSelect;
export type Race = typeof races.$inferSelect;
export type Result = typeof results.$inferSelect;
