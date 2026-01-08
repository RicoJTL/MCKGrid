import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { api } from "@shared/routes";
import { z } from "zod";

// Middleware to check if user is admin or super_admin
async function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const userId = req.user.claims.sub;
  const profile = await storage.getProfile(userId);
  if (!profile || (profile.adminLevel !== "admin" && profile.adminLevel !== "super_admin")) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// Middleware to check if user is super_admin
async function requireSuperAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const userId = req.user.claims.sub;
  const profile = await storage.getProfile(userId);
  if (!profile || profile.adminLevel !== "super_admin") {
    return res.status(403).json({ error: "Super Admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Object Storage routes
  registerObjectStorageRoutes(app);

  // === Profiles ===
  app.get(api.profiles.me.path, async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const userEmail = req.user.claims.email;
    let profile = await storage.getProfile(userId);
    if (!profile) return res.sendStatus(404);
    
    // Auto-promote ibzmebude@gmail.com to super_admin if they aren't already
    if (userEmail === 'ibzmebude@gmail.com' && profile.adminLevel !== 'super_admin') {
      profile = await storage.updateProfile(profile.id, { adminLevel: 'super_admin' });
    }
    
    res.json(profile);
  });

  app.patch(api.profiles.me.path, async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const userEmail = req.user.claims.email;
    const profile = await storage.getProfile(userId);
    
    // Parse input - allow partial updates
    const { userId: _ignore, ...updateData } = req.body;
    
    if (!profile) {
      // Auto-promote first user to super_admin if no admins exist
      // Also make ibzmebude@gmail.com a super_admin
      const hasAdmin = await storage.hasAnyAdmin();
      const isSuperAdminEmail = userEmail === 'ibzmebude@gmail.com';
      const adminLevel = (!hasAdmin || isSuperAdminEmail) ? 'super_admin' : 'none';
      const role = updateData.role || 'spectator';
      
      const newProfile = await storage.createProfile({
        userId,
        role,
        adminLevel,
        fullName: updateData.fullName || null,
        driverName: updateData.driverName || null,
        profileImage: updateData.profileImage || null,
      });
      return res.json(newProfile);
    }
    
    // Auto-promote ibzmebude@gmail.com to super_admin if they aren't already
    if (userEmail === 'ibzmebude@gmail.com' && profile.adminLevel !== 'super_admin') {
      const promoted = await storage.updateProfile(profile.id, { adminLevel: 'super_admin' });
      // Refresh the profile reference
      Object.assign(profile, promoted);
    }
    
    // Auto-promote existing user to super_admin if no admins exist in the system
    const hasAdmin = await storage.hasAnyAdmin();
    if (!hasAdmin && profile.adminLevel === 'none') {
      const promoted = await storage.updateProfile(profile.id, { adminLevel: 'super_admin' });
      Object.assign(profile, promoted);
    }
    
    // Only allow updating fields that are used by the profile page (NOT adminLevel)
    const allowedFields = ['role', 'fullName', 'driverName', 'profileImage'];
    const filteredUpdate: Record<string, any> = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updateData, key)) {
        // Explicitly handle null values for clearing fields
        filteredUpdate[key] = updateData[key] === null ? null : updateData[key];
      }
    }
    
    // If no actual updates needed, just return current profile (with any admin promotions applied)
    if (Object.keys(filteredUpdate).length === 0) {
      return res.json(profile);
    }
    
    const updated = await storage.updateProfile(profile.id, filteredUpdate);
    res.json(updated);
  });

  // Get all profiles (for driver dropdown)
  app.get("/api/profiles", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const profiles = await storage.getAllProfiles();
    res.json(profiles);
  });

  // Get public profile by ID (viewable by all authenticated users)
  app.get("/api/profiles/public/:id", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const targetProfile = await storage.getProfileById(Number(req.params.id));
    if (!targetProfile) return res.status(404).json({ error: "Profile not found" });
    
    // Return public profile info (exclude adminLevel for security)
    res.json({
      id: targetProfile.id,
      driverName: targetProfile.driverName,
      fullName: targetProfile.fullName,
      profileImage: targetProfile.profileImage,
      role: targetProfile.role,
    });
  });

  // Admin: Create a new driver profile (role is account type, admin access is separate)
  app.post("/api/profiles/create-driver", requireAdmin, async (req: any, res) => {
    try {
      const { driverName, fullName, role } = req.body;
      if (!driverName || !fullName) {
        return res.status(400).json({ error: "Driver name and full name are required" });
      }
      // Only allow racer or spectator as account types - admin access is controlled via adminLevel
      const validRole = role && ['racer', 'spectator'].includes(role) ? role : 'racer';
      const newProfile = await storage.createProfile({
        userId: null, // Manual drivers don't have a linked user account
        driverName,
        fullName,
        role: validRole,
        adminLevel: 'none',
      });
      res.status(201).json(newProfile);
    } catch (error) {
      console.error("Error creating driver:", error);
      res.status(500).json({ error: "Failed to create driver" });
    }
  });

  // Admin: Update any profile (role is account type only, admin access controlled via separate endpoint)
  app.patch("/api/profiles/:id", requireAdmin, async (req: any, res) => {
    const { driverName, fullName, role } = req.body;
    const safeData: Record<string, string | undefined> = {};
    if (driverName !== undefined) safeData.driverName = driverName;
    if (fullName !== undefined) safeData.fullName = fullName;
    // Only allow racer or spectator as role - admin access is controlled via adminLevel
    if (role !== undefined && ['racer', 'spectator'].includes(role)) {
      safeData.role = role;
    }
    const updated = await storage.updateProfile(Number(req.params.id), safeData);
    res.json(updated);
  });

  // Admin: Delete a profile
  app.delete("/api/profiles/:id", requireAdmin, async (req: any, res) => {
    await storage.deleteProfile(Number(req.params.id));
    res.sendStatus(204);
  });

  // Super Admin: Grant or revoke admin access (cannot promote to super_admin)
  app.patch("/api/profiles/:id/admin-level", requireSuperAdmin, async (req: any, res) => {
    const { adminLevel } = req.body;
    // Only allow setting to 'none' or 'admin' - super_admin cannot be granted via API
    if (!adminLevel || !['none', 'admin'].includes(adminLevel)) {
      return res.status(400).json({ error: "Invalid admin level" });
    }
    const updated = await storage.updateProfile(Number(req.params.id), { adminLevel });
    res.json(updated);
  });

  // Update profile picture (super admin only - for changing other users' pictures)
  app.patch("/api/profiles/:id/profile-image", requireSuperAdmin, async (req: any, res) => {
    const { profileImage } = req.body;
    if (typeof profileImage !== 'string') {
      return res.status(400).json({ error: "profileImage must be a string" });
    }
    const updated = await storage.updateProfile(Number(req.params.id), { profileImage });
    res.json(updated);
  });

  // Get profile race history (only accessible to profile owner or admins)
  app.get("/api/profiles/:id/history", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    const targetId = Number(req.params.id);
    
    // Only allow profile owner or admins to view history
    const isOwner = profile?.id === targetId;
    const isAdmin = profile?.adminLevel === 'admin' || profile?.adminLevel === 'super_admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Can only view your own race history" });
    }
    
    const history = await storage.getProfileRaceHistory(targetId);
    res.json(history);
  });

  // Get profile race history grouped by competition (only accessible to profile owner or admins)
  app.get("/api/profiles/:id/history-by-competition", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    const targetId = Number(req.params.id);
    
    // Only allow profile owner or admins to view history
    const isOwner = profile?.id === targetId;
    const isAdmin = profile?.adminLevel === 'admin' || profile?.adminLevel === 'super_admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Can only view your own race history" });
    }
    
    const history = await storage.getProfileRaceHistoryByCompetition(targetId);
    res.json(history);
  });

  // Get competitions a driver is enrolled in (only accessible to profile owner or admins)
  app.get("/api/profiles/:id/enrolled-competitions", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    const targetId = Number(req.params.id);
    
    // Only allow profile owner or admins to view enrolled competitions
    const isOwner = profile?.id === targetId;
    const isAdmin = profile?.adminLevel === 'admin' || profile?.adminLevel === 'super_admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Can only view your own enrolled competitions" });
    }
    
    const competitions = await storage.getDriverEnrolledCompetitions(targetId);
    res.json(competitions);
  });

  // Get all active competitions across all leagues
  app.get("/api/competitions/active", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const competitions = await storage.getAllActiveCompetitions();
    res.json(competitions);
  });

  // Get all upcoming races across all competitions
  app.get("/api/races/upcoming", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const races = await storage.getAllUpcomingRaces();
    res.json(races);
  });

  // Get main competition for dashboard
  app.get("/api/competitions/main", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const competition = await storage.getMainCompetition();
    res.json(competition);
  });

  // Set main competition (admin only)
  app.post("/api/competitions/:id/set-main", requireAdmin, async (req: any, res) => {
    try {
      const competitionId = Number(req.params.id);
      await storage.setMainCompetition(competitionId);
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === "Competition not found") {
        return res.status(404).json({ error: "Competition not found" });
      }
      throw error;
    }
  });

  // === Leagues ===
  app.get(api.leagues.list.path, async (req, res) => {
    const leagues = await storage.getLeagues();
    res.json(leagues);
  });

  // Get main league
  app.get("/api/leagues/main", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const league = await storage.getMainLeague();
    res.json(league);
  });

  // Set main league (admin only)
  app.post("/api/leagues/:id/set-main", requireAdmin, async (req: any, res) => {
    try {
      const leagueId = Number(req.params.id);
      await storage.setMainLeague(leagueId);
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === "League not found") {
        return res.status(404).json({ error: "League not found" });
      }
      throw error;
    }
  });
  
  app.post(api.leagues.create.path, requireAdmin, async (req, res) => {
    // Convert date strings to Date objects before validation
    const body = {
      ...req.body,
      seasonStart: req.body.seasonStart ? new Date(req.body.seasonStart) : undefined,
      seasonEnd: req.body.seasonEnd ? new Date(req.body.seasonEnd) : undefined,
    };
    const input = api.leagues.create.input.parse(body);
    const league = await storage.createLeague(input);
    res.status(201).json(league);
  });
  
  app.get(api.leagues.get.path, async (req, res) => {
    const league = await storage.getLeague(Number(req.params.id));
    if (!league) return res.sendStatus(404);
    res.json(league);
  });

  app.patch("/api/leagues/:id", requireAdmin, async (req, res) => {
    const { name, description, seasonStart, seasonEnd, status, iconName, iconColor } = req.body;
    const leagueId = Number(req.params.id);
    
    const existingLeague = await storage.getLeague(leagueId);
    const wasActive = existingLeague?.status === 'active';
    
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (seasonStart !== undefined) data.seasonStart = new Date(seasonStart);
    if (seasonEnd !== undefined) data.seasonEnd = seasonEnd ? new Date(seasonEnd) : null;
    if (status !== undefined) {
      if (status !== 'active' && status !== 'completed') {
        return res.status(400).json({ error: "Invalid status. Must be 'active' or 'completed'" });
      }
      data.status = status;
    }
    if (iconName !== undefined) data.iconName = iconName;
    if (iconColor !== undefined) data.iconColor = iconColor;
    const updated = await storage.updateLeague(leagueId, data);
    
    if (wasActive && status === 'completed') {
      const { checkSeasonEndBadges } = await import("./badge-automation");
      await checkSeasonEndBadges(leagueId);
    }
    
    res.json(updated);
  });

  app.delete("/api/leagues/:id", requireAdmin, async (req, res) => {
    await storage.deleteLeague(Number(req.params.id));
    res.sendStatus(204);
  });

  // === Competitions ===
  app.get(api.competitions.list.path, async (req, res) => {
    const competitions = await storage.getCompetitions(Number(req.params.id));
    res.json(competitions);
  });
  
  app.get("/api/competitions/:id", async (req, res) => {
    const competition = await storage.getCompetition(Number(req.params.id));
    if (!competition) return res.sendStatus(404);
    res.json(competition);
  });

  // Competition standings (league table)
  app.get("/api/competitions/:id/standings", async (req, res) => {
    const standings = await storage.getCompetitionStandings(Number(req.params.id));
    res.json(standings);
  });

  // Upcoming races for a competition
  app.get("/api/competitions/:id/upcoming", async (req, res) => {
    const upcoming = await storage.getUpcomingRaces(Number(req.params.id));
    res.json(upcoming);
  });
  
  app.post(api.competitions.create.path, requireAdmin, async (req, res) => {
    const input = api.competitions.create.input.parse(req.body);
    const competition = await storage.createCompetition(input);
    res.status(201).json(competition);
  });

  app.patch("/api/competitions/:id", requireAdmin, async (req, res) => {
    const { name, type, rules, iconName, iconColor } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (rules !== undefined) data.rules = rules;
    if (iconName !== undefined) data.iconName = iconName;
    if (iconColor !== undefined) data.iconColor = iconColor;
    const updated = await storage.updateCompetition(Number(req.params.id), data);
    res.json(updated);
  });

  app.delete("/api/competitions/:id", requireAdmin, async (req, res) => {
    await storage.deleteCompetition(Number(req.params.id));
    res.sendStatus(204);
  });

  // === Races ===
  app.get(api.races.list.path, async (req, res) => {
    const races = await storage.getRaces(Number(req.params.id));
    res.json(races);
  });
  
  app.post(api.races.create.path, requireAdmin, async (req, res) => {
    // Convert date string to Date object before validation
    const body = {
      ...req.body,
      date: req.body.date ? new Date(req.body.date) : undefined,
    };
    const input = api.races.create.input.parse(body);
    const { competitionIds, ...raceData } = input;
    const race = await storage.createRace(raceData, competitionIds);
    res.status(201).json(race);
  });
  
  // Get races by league
  app.get(api.races.listByLeague.path, async (req, res) => {
    const races = await storage.getRacesByLeague(Number(req.params.id));
    res.json(races);
  });
  
  // Get competitions for a race
  app.get(api.races.getCompetitions.path, async (req, res) => {
    const competitions = await storage.getRaceCompetitions(Number(req.params.id));
    res.json(competitions);
  });
  
  // Update race competitions
  app.patch("/api/races/:id/competitions", requireAdmin, async (req, res) => {
    const { competitionIds } = req.body;
    if (!Array.isArray(competitionIds)) {
      return res.status(400).json({ error: "competitionIds must be an array" });
    }
    await storage.updateRaceCompetitions(Number(req.params.id), competitionIds);
    res.sendStatus(204);
  });
  
  app.get(api.races.get.path, async (req, res) => {
    const race = await storage.getRace(Number(req.params.id));
    if (!race) return res.sendStatus(404);
    res.json(race);
  });

  app.patch("/api/races/:id", requireAdmin, async (req, res) => {
    const { name, location, date, status } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (location !== undefined) data.location = location;
    if (date !== undefined) data.date = new Date(date);
    if (status !== undefined) data.status = status;
    const updated = await storage.updateRace(Number(req.params.id), data);
    res.json(updated);
  });

  app.delete("/api/races/:id", requireAdmin, async (req, res) => {
    await storage.deleteRace(Number(req.params.id));
    res.sendStatus(204);
  });

  // === Results ===
  app.get(api.results.list.path, async (req, res) => {
    const results = await storage.getResults(Number(req.params.id));
    res.json(results);
  });
  
  app.post(api.results.submit.path, requireAdmin, async (req: any, res) => {
    const raceId = Number(req.params.id);
    const input = api.results.submit.input.parse(req.body);
    
    // Atomically replace all results for this race in a transaction
    const results = await storage.replaceRaceResults(raceId, input);
    res.status(201).json(results);
  });

  // === Teams ===
  app.get(api.teams.list.path, async (req, res) => {
    const teams = await storage.getTeams();
    res.json(teams);
  });
  
  app.post(api.teams.create.path, requireAdmin, async (req, res) => {
    const input = api.teams.create.input.parse(req.body);
    const team = await storage.createTeam(input);
    res.status(201).json(team);
  });

  // === Enrollments ===
  app.get("/api/competitions/:id/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const enrolledDrivers = await storage.getEnrolledDrivers(Number(req.params.id));
    res.json(enrolledDrivers);
  });

  app.post("/api/competitions/:id/enrollments", requireAdmin, async (req: any, res) => {
    const competitionId = Number(req.params.id);
    const { profileId } = req.body;
    if (!profileId) return res.status(400).json({ error: "profileId required" });
    const enrollment = await storage.enrollDriver(competitionId, profileId);
    res.status(201).json(enrollment);
  });

  app.delete("/api/competitions/:id/enrollments/:profileId", requireAdmin, async (req: any, res) => {
    const competitionId = Number(req.params.id);
    const profileId = Number(req.params.profileId);
    await storage.unenrollDriver(competitionId, profileId);
    res.sendStatus(204);
  });

  // === Driver Stats (only accessible to profile owner or admins) ===
  app.get("/api/profiles/:id/stats", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    const targetId = Number(req.params.id);
    
    const isOwner = profile?.id === targetId;
    const isAdmin = profile?.adminLevel === 'admin' || profile?.adminLevel === 'super_admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Can only view your own stats" });
    }
    
    const stats = await storage.getDriverStats(targetId);
    res.json(stats);
  });

  app.get("/api/profiles/:id/recent-results", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    const targetId = Number(req.params.id);
    
    const isOwner = profile?.id === targetId;
    const isAdmin = profile?.adminLevel === 'admin' || profile?.adminLevel === 'super_admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Can only view your own results" });
    }
    
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    const results = await storage.getRecentResults(targetId, limit);
    res.json(results);
  });

  // === Head-to-Head ===
  app.get("/api/head-to-head/:id1/:id2", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const stats = await storage.getHeadToHeadStats(Number(req.params.id1), Number(req.params.id2));
    res.json(stats);
  });

  // === Personal Bests (only accessible to profile owner or admins) ===
  app.get("/api/profiles/:id/personal-bests", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    const targetId = Number(req.params.id);
    
    const isOwner = profile?.id === targetId;
    const isAdmin = profile?.adminLevel === 'admin' || profile?.adminLevel === 'super_admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Can only view your own personal bests" });
    }
    
    const bests = await storage.getPersonalBests(targetId);
    res.json(bests);
  });

  app.post("/api/profiles/:id/personal-bests", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile || profile.id !== Number(req.params.id)) {
      return res.status(403).json({ error: "Can only update your own personal bests" });
    }
    const { location, bestTime, raceId } = req.body;
    const pb = await storage.updatePersonalBest(profile.id, location, bestTime, raceId);
    res.json(pb);
  });

  // === Badges ===
  app.get("/api/badges", async (req, res) => {
    const badges = await storage.getBadges();
    res.json(badges);
  });

  app.get("/api/profiles/:id/badges", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const badges = await storage.getProfileBadges(Number(req.params.id));
    res.json(badges);
  });

  app.post("/api/badges", requireAdmin, async (req, res) => {
    const { slug, name, description, category, iconName, iconColor, criteria, threshold } = req.body;
    const badge = await storage.createBadge({ slug, name, description, category, iconName, iconColor, criteria, threshold });
    res.status(201).json(badge);
  });

  app.delete("/api/badges/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteBadge(id);
    res.sendStatus(204);
  });

  app.get("/api/badges/:id/profiles", requireAdmin, async (req: any, res) => {
    const badgeId = Number(req.params.id);
    const profiles = await storage.getProfilesWithBadge(badgeId);
    res.json(profiles);
  });

  app.post("/api/profiles/:id/badges/:badgeId", requireAdmin, async (req: any, res) => {
    const profileId = Number(req.params.id);
    const badgeId = Number(req.params.badgeId);
    const awarded = await storage.awardBadge(profileId, badgeId);
    res.json(awarded);
  });

  app.delete("/api/profiles/:id/badges/:badgeId", requireAdmin, async (req: any, res) => {
    const profileId = Number(req.params.id);
    const badgeId = Number(req.params.badgeId);
    await storage.revokeBadge(profileId, badgeId);
    res.sendStatus(204);
  });

  // Badge Notifications (for logged-in user)
  app.get("/api/badge-notifications", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.json([]);
    const notifications = await storage.getUnreadBadgeNotifications(profile.id);
    res.json(notifications);
  });

  app.post("/api/badge-notifications/mark-read", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.sendStatus(404);
    await storage.markBadgeNotificationsRead(profile.id);
    res.sendStatus(204);
  });

  // === Driver Icons ===
  app.get("/api/driver-icons", async (req, res) => {
    const icons = await storage.getDriverIcons();
    res.json(icons);
  });

  app.post("/api/driver-icons", requireAdmin, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.sendStatus(404);
    
    const { slug, name, description, iconName, iconColor } = req.body;
    const icon = await storage.createDriverIcon({ 
      slug, 
      name, 
      description, 
      iconName, 
      iconColor,
      createdByProfileId: profile.id
    });
    res.status(201).json(icon);
  });

  app.delete("/api/driver-icons/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteDriverIcon(id);
    res.sendStatus(204);
  });

  app.get("/api/driver-icons/:id/profiles", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const iconId = Number(req.params.id);
    const profiles = await storage.getProfilesWithDriverIcon(iconId);
    res.json(profiles);
  });

  app.get("/api/profiles/:id/driver-icons", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const icons = await storage.getProfileDriverIcons(Number(req.params.id));
    res.json(icons);
  });

  app.get("/api/driver-icons/all-assignments", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const assignments = await storage.getAllDriversWithIcons();
    res.json(assignments);
  });

  app.post("/api/profiles/:id/driver-icons/:iconId", requireAdmin, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const adminProfile = await storage.getProfile(userId);
    if (!adminProfile) return res.sendStatus(404);
    
    const profileId = Number(req.params.id);
    const iconId = Number(req.params.iconId);
    const awarded = await storage.awardDriverIcon(profileId, iconId, adminProfile.id);
    res.json(awarded);
  });

  app.delete("/api/profiles/:id/driver-icons/:iconId", requireAdmin, async (req: any, res) => {
    const profileId = Number(req.params.id);
    const iconId = Number(req.params.iconId);
    await storage.revokeDriverIcon(profileId, iconId);
    res.sendStatus(204);
  });

  // Driver Icon Notifications (for logged-in user)
  app.get("/api/driver-icon-notifications", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.json([]);
    const notifications = await storage.getUnreadDriverIconNotifications(profile.id);
    res.json(notifications);
  });

  app.post("/api/driver-icon-notifications/mark-read", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.sendStatus(404);
    await storage.markDriverIconNotificationsRead(profile.id);
    res.sendStatus(204);
  });

  // === Season Goals (only accessible to profile owner or admins) ===
  app.get("/api/profiles/:id/goals", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    const targetId = Number(req.params.id);
    
    const isOwner = profile?.id === targetId;
    const isAdmin = profile?.adminLevel === 'admin' || profile?.adminLevel === 'super_admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Can only view your own goals" });
    }
    
    const leagueId = req.query.leagueId ? Number(req.query.leagueId) : undefined;
    const goals = await storage.getSeasonGoals(targetId, leagueId);
    res.json(goals);
  });

  app.post("/api/profiles/:id/goals", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile || profile.id !== Number(req.params.id)) {
      return res.status(403).json({ error: "Can only create your own goals" });
    }
    const { leagueId, goalType, targetValue } = req.body;
    const goal = await storage.createSeasonGoal({ profileId: profile.id, leagueId, goalType, targetValue });
    res.status(201).json(goal);
  });

  app.patch("/api/goals/:id", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    
    // Verify ownership of the goal
    const goal = await storage.getSeasonGoalById(Number(req.params.id));
    if (!goal || goal.profileId !== profile.id) {
      return res.status(403).json({ error: "Can only update your own goals" });
    }
    
    const { targetValue, currentValue } = req.body;
    const data: any = {};
    if (targetValue !== undefined) data.targetValue = targetValue;
    if (currentValue !== undefined) data.currentValue = currentValue;
    const updated = await storage.updateSeasonGoal(Number(req.params.id), data);
    res.json(updated);
  });

  app.delete("/api/goals/:id", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    
    // Verify ownership of the goal
    const goal = await storage.getSeasonGoalById(Number(req.params.id));
    if (!goal || goal.profileId !== profile.id) {
      return res.status(403).json({ error: "Can only delete your own goals" });
    }
    
    await storage.deleteSeasonGoal(Number(req.params.id));
    res.sendStatus(204);
  });

  // === Race Check-ins ===
  app.get("/api/races/:id/checkins", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const checkins = await storage.getRaceCheckins(Number(req.params.id));
    res.json(checkins);
  });

  app.get("/api/races/:id/my-checkin", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.sendStatus(404);
    const checkin = await storage.getProfileCheckin(Number(req.params.id), profile.id);
    res.json(checkin || null);
  });

  app.post("/api/races/:id/checkin", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    
    // Only racers can check in to races
    if (profile.role !== 'racer') {
      return res.status(403).json({ error: "Only drivers can check in to races" });
    }
    
    const raceId = Number(req.params.id);
    
    // Verify driver is enrolled in at least one competition this race belongs to
    const raceCompetitions = await storage.getRaceCompetitions(raceId);
    const enrolledCompetitions = await storage.getDriverEnrolledCompetitions(profile.id);
    const enrolledCompIds = new Set(enrolledCompetitions.map(c => c.id));
    const isEnrolled = raceCompetitions.some(c => enrolledCompIds.has(c.id));
    
    if (!isEnrolled) {
      return res.status(403).json({ error: "You must be enrolled in this competition to confirm attendance" });
    }
    
    const { status } = req.body;
    if (!['confirmed', 'maybe', 'not_attending'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const checkin = await storage.setCheckin({
      raceId,
      profileId: profile.id,
      status,
    });
    res.json(checkin);
  });

  // === Calendar Export (iCal) ===
  app.get("/api/calendar/races.ics", async (req: any, res) => {
    const upcomingRaces = await storage.getAllUpcomingRaces();
    
    let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MCK Grid//Race Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:MCK Grid Races
`;
    
    for (const race of upcomingRaces) {
      const startDate = new Date(race.date);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hour duration
      const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      ical += `BEGIN:VEVENT
UID:race-${race.id}@mckgrid
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${race.name}
LOCATION:${race.location}
DESCRIPTION:${race.competitionName || 'MCK Grid Race'}
END:VEVENT
`;
    }
    
    ical += 'END:VCALENDAR';
    
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="mck-grid-races.ics"');
    res.send(ical);
  });

  return httpServer;
}
