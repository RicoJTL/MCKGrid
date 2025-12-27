import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { api } from "@shared/routes";
import { z } from "zod";

// Middleware to check if user is admin
async function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const userId = req.user.claims.sub;
  const profile = await storage.getProfile(userId);
  if (!profile || profile.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
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
    const profile = await storage.getProfile(userId);
    
    // Parse input - allow partial updates
    const { userId: _ignore, ...updateData } = req.body;
    
    if (!profile) {
      // Create new profile
      const newProfile = await storage.createProfile({
        userId,
        role: updateData.role || "spectator",
        fullName: updateData.fullName || null,
        driverName: updateData.driverName || null,
        profileImage: updateData.profileImage || null,
        teamId: updateData.teamId || null,
      });
      return res.json(newProfile);
    }
    
    const updated = await storage.updateProfile(profile.id, updateData);
    res.json(updated);
  });

  // Get all profiles (for driver dropdown)
  app.get("/api/profiles", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const profiles = await storage.getAllProfiles();
    res.json(profiles);
  });

  // Admin: Update any profile
  app.patch("/api/profiles/:id", requireAdmin, async (req: any, res) => {
    const { userId: _ignore, ...updateData } = req.body;
    const updated = await storage.updateProfile(Number(req.params.id), updateData);
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
    const input = api.leagues.create.input.parse(req.body);
    const league = await storage.createLeague(input);
    res.status(201).json(league);
  });
  
  app.get(api.leagues.get.path, async (req, res) => {
    const league = await storage.getLeague(Number(req.params.id));
    if (!league) return res.sendStatus(404);
    res.json(league);
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

  // === Races ===
  app.get(api.races.list.path, async (req, res) => {
    const races = await storage.getRaces(Number(req.params.id));
    res.json(races);
  });
  
  app.post(api.races.create.path, requireAdmin, async (req, res) => {
    const input = api.races.create.input.parse(req.body);
    const race = await storage.createRace(input);
    res.status(201).json(race);
  });
  
  app.get(api.races.get.path, async (req, res) => {
    const race = await storage.getRace(Number(req.params.id));
    if (!race) return res.sendStatus(404);
    res.json(race);
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
