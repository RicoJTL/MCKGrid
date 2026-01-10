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
export const leagueStatusEnum = pgEnum("league_status", ["active", "completed"]);
export const checkinStatusEnum = pgEnum("checkin_status", ["confirmed", "maybe", "not_attending"]);
export const goalTypeEnum = pgEnum("goal_type", ["wins", "podiums", "points", "races", "position", "top5", "top10", "poles", "frontRow", "gridClimber", "perfectWeekend"]);
export const badgeCategoryEnum = pgEnum("badge_category", [
  "getting_started", 
  "milestones", 
  "race_highlights", 
  "hot_streaks", 
  "season_heroes", 
  "legends",
  "league_laughs"
]);

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  logoUrl: text("logo_url"),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
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
  isMain: boolean("is_main").default(false).notNull(),
  status: leagueStatusEnum("status").default("active").notNull(),
  iconName: text("icon_name"),
  iconColor: text("icon_color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const competitions = pgTable("competitions", {
  id: serial("id").primaryKey(),
  leagueId: integer("league_id").references(() => leagues.id).notNull(),
  name: text("name").notNull(),
  type: competitionTypeEnum("type").default("series").notNull(),
  rules: jsonb("rules").$type<{ pointsSystem: Record<string, number> }>().default({ pointsSystem: {} }),
  isMain: boolean("is_main").default(false).notNull(),
  iconName: text("icon_name"),
  iconColor: text("icon_color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const races = pgTable("races", {
  id: serial("id").primaryKey(),
  leagueId: integer("league_id").references(() => leagues.id).notNull(),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  status: raceStatusEnum("status").default("scheduled").notNull(),
});

export const raceCompetitions = pgTable("race_competitions", {
  id: serial("id").primaryKey(),
  raceId: integer("race_id").references(() => races.id).notNull(),
  competitionId: integer("competition_id").references(() => competitions.id).notNull(),
});

export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  raceId: integer("race_id").references(() => races.id).notNull(),
  racerId: integer("racer_id").references(() => profiles.id).notNull(),
  position: integer("position").notNull(),
  qualifyingPosition: integer("qualifying_position"),
  points: integer("points").notNull(),
  raceTime: text("race_time"),
  dnf: boolean("dnf").default(false),
});

// Tiered Leagues - groups drivers into tiers with promotion/relegation
export const tieredLeagues = pgTable("tiered_leagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  leagueId: integer("league_id").references(() => leagues.id).notNull(),
  parentCompetitionId: integer("parent_competition_id").references(() => competitions.id).notNull(),
  numberOfTiers: integer("number_of_tiers").default(4).notNull(),
  driversPerTier: integer("drivers_per_tier").default(4).notNull(),
  racesBeforeShuffle: integer("races_before_shuffle").default(3).notNull(),
  promotionSpots: integer("promotion_spots").default(1).notNull(),
  relegationSpots: integer("relegation_spots").default(1).notNull(),
  racesCompleted: integer("races_completed").default(0).notNull(),
  iconName: text("icon_name").default("Layers"),
  iconColor: text("icon_color").default("#eab308"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tier names (S, A, B, C, etc.)
export const tierNames = pgTable("tier_names", {
  id: serial("id").primaryKey(),
  tieredLeagueId: integer("tiered_league_id").references(() => tieredLeagues.id).notNull(),
  tierNumber: integer("tier_number").notNull(), // 1 = top tier (S), 2 = second tier (A), etc.
  name: text("name").notNull(), // "S Tier", "A Tier", etc.
});

// Driver tier assignments
export const tierAssignments = pgTable("tier_assignments", {
  id: serial("id").primaryKey(),
  tieredLeagueId: integer("tiered_league_id").references(() => tieredLeagues.id).notNull(),
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  tierNumber: integer("tier_number").notNull(), // 1 = top tier, 2 = second tier, etc.
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

// Movement history (promotions/relegations)
export const tierMovements = pgTable("tier_movements", {
  id: serial("id").primaryKey(),
  tieredLeagueId: integer("tiered_league_id").references(() => tieredLeagues.id).notNull(),
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  fromTier: integer("from_tier").notNull(),
  toTier: integer("to_tier").notNull(),
  movementType: text("movement_type").notNull(), // 'promotion' or 'relegation'
  afterRaceNumber: integer("after_race_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tier movement notifications
export const tierMovementNotifications = pgTable("tier_movement_notifications", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  movementId: integer("movement_id").references(() => tierMovements.id).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: badgeCategoryEnum("category").notNull(),
  iconName: text("icon_name").notNull(),
  iconColor: text("icon_color").notNull(),
  criteria: text("criteria").notNull(),
  threshold: integer("threshold"),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const profileBadges = pgTable("profile_badges", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  badgeId: integer("badge_id").references(() => badges.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  leagueId: integer("league_id").references(() => leagues.id), // For season-end badges, tracks which league awarded it
});

export const seasonGoals = pgTable("season_goals", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  leagueId: integer("league_id").references(() => leagues.id).notNull(),
  goalType: goalTypeEnum("goal_type").notNull(),
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const raceCheckins = pgTable("race_checkins", {
  id: serial("id").primaryKey(),
  raceId: integer("race_id").references(() => races.id).notNull(),
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  status: checkinStatusEnum("status").notNull(),
  checkedInAt: timestamp("checked_in_at").defaultNow().notNull(),
});

export const personalBests = pgTable("personal_bests", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  location: text("location").notNull(),
  bestTime: text("best_time").notNull(),
  raceId: integer("race_id").references(() => races.id),
  achievedAt: timestamp("achieved_at").defaultNow().notNull(),
});

export const badgeNotifications = pgTable("badge_notifications", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  badgeId: integer("badge_id").references(() => badges.id).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// Driver Icons - special symbols awarded by admins that appear next to driver names
export const driverIcons = pgTable("driver_icons", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  iconColor: text("icon_color").notNull(),
  isPredefined: boolean("is_predefined").default(false).notNull(),
  createdByProfileId: integer("created_by_profile_id").references(() => profiles.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profileDriverIcons = pgTable("profile_driver_icons", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  iconId: integer("icon_id").references(() => driverIcons.id).notNull(),
  awardedByProfileId: integer("awarded_by_profile_id").references(() => profiles.id),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
});

export const driverIconNotifications = pgTable("driver_icon_notifications", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  iconId: integer("icon_id").references(() => driverIcons.id).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  raceCompetitions: many(raceCompetitions),
}));

export const racesRelations = relations(races, ({ one, many }) => ({
  league: one(leagues, { fields: [races.leagueId], references: [leagues.id] }),
  raceCompetitions: many(raceCompetitions),
  results: many(results),
}));

export const raceCompetitionsRelations = relations(raceCompetitions, ({ one }) => ({
  race: one(races, { fields: [raceCompetitions.raceId], references: [races.id] }),
  competition: one(competitions, { fields: [raceCompetitions.competitionId], references: [competitions.id] }),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  race: one(races, { fields: [results.raceId], references: [races.id] }),
  racer: one(profiles, { fields: [results.racerId], references: [profiles.id] }),
}));

// Tiered League Relations
export const tieredLeaguesRelations = relations(tieredLeagues, ({ one, many }) => ({
  league: one(leagues, { fields: [tieredLeagues.leagueId], references: [leagues.id] }),
  parentCompetition: one(competitions, { fields: [tieredLeagues.parentCompetitionId], references: [competitions.id] }),
  tierNames: many(tierNames),
  tierAssignments: many(tierAssignments),
  tierMovements: many(tierMovements),
}));

export const tierNamesRelations = relations(tierNames, ({ one }) => ({
  tieredLeague: one(tieredLeagues, { fields: [tierNames.tieredLeagueId], references: [tieredLeagues.id] }),
}));

export const tierAssignmentsRelations = relations(tierAssignments, ({ one }) => ({
  tieredLeague: one(tieredLeagues, { fields: [tierAssignments.tieredLeagueId], references: [tieredLeagues.id] }),
  profile: one(profiles, { fields: [tierAssignments.profileId], references: [profiles.id] }),
}));

export const tierMovementsRelations = relations(tierMovements, ({ one, many }) => ({
  tieredLeague: one(tieredLeagues, { fields: [tierMovements.tieredLeagueId], references: [tieredLeagues.id] }),
  profile: one(profiles, { fields: [tierMovements.profileId], references: [profiles.id] }),
  notifications: many(tierMovementNotifications),
}));

export const tierMovementNotificationsRelations = relations(tierMovementNotifications, ({ one }) => ({
  profile: one(profiles, { fields: [tierMovementNotifications.profileId], references: [profiles.id] }),
  movement: one(tierMovements, { fields: [tierMovementNotifications.movementId], references: [tierMovements.id] }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  profileBadges: many(profileBadges),
}));

export const profileBadgesRelations = relations(profileBadges, ({ one }) => ({
  profile: one(profiles, { fields: [profileBadges.profileId], references: [profiles.id] }),
  badge: one(badges, { fields: [profileBadges.badgeId], references: [badges.id] }),
}));

export const seasonGoalsRelations = relations(seasonGoals, ({ one }) => ({
  profile: one(profiles, { fields: [seasonGoals.profileId], references: [profiles.id] }),
  league: one(leagues, { fields: [seasonGoals.leagueId], references: [leagues.id] }),
}));

export const raceCheckinsRelations = relations(raceCheckins, ({ one }) => ({
  race: one(races, { fields: [raceCheckins.raceId], references: [races.id] }),
  profile: one(profiles, { fields: [raceCheckins.profileId], references: [profiles.id] }),
}));

export const personalBestsRelations = relations(personalBests, ({ one }) => ({
  profile: one(profiles, { fields: [personalBests.profileId], references: [profiles.id] }),
  race: one(races, { fields: [personalBests.raceId], references: [races.id] }),
}));

export const badgeNotificationsRelations = relations(badgeNotifications, ({ one }) => ({
  profile: one(profiles, { fields: [badgeNotifications.profileId], references: [profiles.id] }),
  badge: one(badges, { fields: [badgeNotifications.badgeId], references: [badges.id] }),
}));

export const driverIconsRelations = relations(driverIcons, ({ one, many }) => ({
  createdBy: one(profiles, { fields: [driverIcons.createdByProfileId], references: [profiles.id] }),
  profileDriverIcons: many(profileDriverIcons),
}));

export const profileDriverIconsRelations = relations(profileDriverIcons, ({ one }) => ({
  profile: one(profiles, { fields: [profileDriverIcons.profileId], references: [profiles.id] }),
  icon: one(driverIcons, { fields: [profileDriverIcons.iconId], references: [driverIcons.id] }),
  awardedBy: one(profiles, { fields: [profileDriverIcons.awardedByProfileId], references: [profiles.id] }),
}));

export const driverIconNotificationsRelations = relations(driverIconNotifications, ({ one }) => ({
  profile: one(profiles, { fields: [driverIconNotifications.profileId], references: [profiles.id] }),
  icon: one(driverIcons, { fields: [driverIconNotifications.iconId], references: [driverIcons.id] }),
}));

// Schemas
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertLeagueSchema = createInsertSchema(leagues).omit({ id: true });
export const insertCompetitionSchema = createInsertSchema(competitions).omit({ id: true });
export const insertRaceSchema = createInsertSchema(races).omit({ id: true });
export const insertRaceCompetitionSchema = createInsertSchema(raceCompetitions).omit({ id: true });
export const insertResultSchema = createInsertSchema(results).omit({ id: true });
export const insertTieredLeagueSchema = createInsertSchema(tieredLeagues).omit({ id: true, racesCompleted: true, createdAt: true });
export const insertTierNameSchema = createInsertSchema(tierNames).omit({ id: true });
export const insertTierAssignmentSchema = createInsertSchema(tierAssignments).omit({ id: true, assignedAt: true });
export const insertTierMovementSchema = createInsertSchema(tierMovements).omit({ id: true, createdAt: true });
export const insertTierMovementNotificationSchema = createInsertSchema(tierMovementNotifications).omit({ id: true, isRead: true, createdAt: true });
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true, sortOrder: true });
export const insertProfileBadgeSchema = createInsertSchema(profileBadges).omit({ id: true });
export const insertSeasonGoalSchema = createInsertSchema(seasonGoals).omit({ id: true, currentValue: true, createdAt: true });
export const insertRaceCheckinSchema = createInsertSchema(raceCheckins).omit({ id: true, checkedInAt: true });
export const insertPersonalBestSchema = createInsertSchema(personalBests).omit({ id: true, achievedAt: true });
export const insertBadgeNotificationSchema = createInsertSchema(badgeNotifications).omit({ id: true, isRead: true, createdAt: true });
export const insertDriverIconSchema = createInsertSchema(driverIcons).omit({ id: true, isPredefined: true, createdAt: true });
export const insertProfileDriverIconSchema = createInsertSchema(profileDriverIcons).omit({ id: true, awardedAt: true });
export const insertDriverIconNotificationSchema = createInsertSchema(driverIconNotifications).omit({ id: true, isRead: true, createdAt: true });

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertLeague = z.infer<typeof insertLeagueSchema>;
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type InsertRace = z.infer<typeof insertRaceSchema>;
export type InsertRaceCompetition = z.infer<typeof insertRaceCompetitionSchema>;
export type InsertResult = z.infer<typeof insertResultSchema>;
export type InsertTieredLeague = z.infer<typeof insertTieredLeagueSchema>;
export type InsertTierName = z.infer<typeof insertTierNameSchema>;
export type InsertTierAssignment = z.infer<typeof insertTierAssignmentSchema>;
export type InsertTierMovement = z.infer<typeof insertTierMovementSchema>;
export type InsertTierMovementNotification = z.infer<typeof insertTierMovementNotificationSchema>;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type InsertProfileBadge = z.infer<typeof insertProfileBadgeSchema>;
export type InsertSeasonGoal = z.infer<typeof insertSeasonGoalSchema>;
export type InsertRaceCheckin = z.infer<typeof insertRaceCheckinSchema>;
export type InsertPersonalBest = z.infer<typeof insertPersonalBestSchema>;

export type Team = typeof teams.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type League = typeof leagues.$inferSelect;
export type Competition = typeof competitions.$inferSelect;
export type Race = typeof races.$inferSelect;
export type RaceCompetition = typeof raceCompetitions.$inferSelect;
export type Result = typeof results.$inferSelect;
export type TieredLeague = typeof tieredLeagues.$inferSelect;
export type TierName = typeof tierNames.$inferSelect;
export type TierAssignment = typeof tierAssignments.$inferSelect;
export type TierMovement = typeof tierMovements.$inferSelect;
export type TierMovementNotification = typeof tierMovementNotifications.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type ProfileBadge = typeof profileBadges.$inferSelect;
export type SeasonGoal = typeof seasonGoals.$inferSelect;
export type RaceCheckin = typeof raceCheckins.$inferSelect;
export type PersonalBest = typeof personalBests.$inferSelect;
export type BadgeNotification = typeof badgeNotifications.$inferSelect;
export type InsertBadgeNotification = z.infer<typeof insertBadgeNotificationSchema>;
export type DriverIcon = typeof driverIcons.$inferSelect;
export type ProfileDriverIcon = typeof profileDriverIcons.$inferSelect;
export type DriverIconNotification = typeof driverIconNotifications.$inferSelect;
export type InsertDriverIcon = z.infer<typeof insertDriverIconSchema>;
export type InsertProfileDriverIcon = z.infer<typeof insertProfileDriverIconSchema>;
export type InsertDriverIconNotification = z.infer<typeof insertDriverIconNotificationSchema>;
