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
    const profile = await storage.getProfile(userId);
    if (!profile) return res.sendStatus(404);
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
      await storage.updateProfile(profile.id, { adminLevel: 'super_admin' });
    }
    
    // Auto-promote existing user to super_admin if no admins exist in the system
    const hasAdmin = await storage.hasAnyAdmin();
    if (!hasAdmin && profile.adminLevel === 'none') {
      const promoted = await storage.updateProfile(profile.id, { adminLevel: 'super_admin' });
      return res.json(promoted);
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
    
    const updated = await storage.updateProfile(profile.id, filteredUpdate);
    res.json(updated);
  });

  // Get all profiles (for driver dropdown)
  app.get("/api/profiles", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const profiles = await storage.getAllProfiles();
    res.json(profiles);
  });

  // Admin: Create a new driver profile (role is account type, admin access is separate)
  app.post("/api/profiles/create-driver", requireAdmin, async (req: any, res) => {
    const { driverName, fullName, role } = req.body;
    if (!driverName || !fullName) {
      return res.status(400).json({ error: "Driver name and full name are required" });
    }
    // Only allow racer or spectator as account types - admin access is controlled via adminLevel
    const validRole = role && ['racer', 'spectator'].includes(role) ? role : 'racer';
    const newProfile = await storage.createProfile({
      userId: `manual-${Date.now()}`,
      driverName,
      fullName,
      role: validRole,
      adminLevel: 'none',
    });
    res.status(201).json(newProfile);
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

  // Super Admin: Grant or revoke admin access
  app.patch("/api/profiles/:id/admin-level", requireSuperAdmin, async (req: any, res) => {
    const { adminLevel } = req.body;
    if (!adminLevel || !['none', 'admin', 'super_admin'].includes(adminLevel)) {
      return res.status(400).json({ error: "Invalid admin level" });
    }
    const updated = await storage.updateProfile(Number(req.params.id), { adminLevel });
    res.json(updated);
  });

  // Get profile race history
  app.get("/api/profiles/:id/history", async (req: any, res) => {
    const history = await storage.getProfileRaceHistory(Number(req.params.id));
    res.json(history);
  });

  // === Leagues ===
  app.get(api.leagues.list.path, async (req, res) => {
    const leagues = await storage.getLeagues();
    res.json(leagues);
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
    const { name, description, seasonStart, seasonEnd } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (seasonStart !== undefined) data.seasonStart = new Date(seasonStart);
    if (seasonEnd !== undefined) data.seasonEnd = seasonEnd ? new Date(seasonEnd) : null;
    const updated = await storage.updateLeague(Number(req.params.id), data);
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
    const { name, type, rules } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (rules !== undefined) data.rules = rules;
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
    const race = await storage.createRace(input);
    res.status(201).json(race);
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

  return httpServer;
}
