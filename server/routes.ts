import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

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
    if (!profile) {
      // Auto-create? Or fail. For now, create if missing with minimal data?
      // Better: Explicit create flow. But for simplicity let's fail.
      // Actually, let's allow creating a profile via this endpoint if it doesn't exist?
      // No, let's keep it strict. 
      // But wait, user needs to create profile first time.
      // Let's add auto-create logic here if missing.
      const input = api.profiles.update.input.parse(req.body);
      const newProfile = await storage.createProfile({
        userId,
        role: "spectator", // default
        ...input
      } as any);
      return res.json(newProfile);
    }
    
    const input = api.profiles.update.input.parse(req.body);
    const updated = await storage.updateProfile(profile.id, input);
    res.json(updated);
  });

  // === Leagues ===
  app.get(api.leagues.list.path, async (req, res) => {
    const leagues = await storage.getLeagues();
    res.json(leagues);
  });
  app.post(api.leagues.create.path, async (req, res) => {
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
  app.post(api.competitions.create.path, async (req, res) => {
    const input = api.competitions.create.input.parse(req.body);
    const competition = await storage.createCompetition(input);
    res.status(201).json(competition);
  });

  // === Races ===
  app.get(api.races.list.path, async (req, res) => {
    const races = await storage.getRaces(Number(req.params.id));
    res.json(races);
  });
  app.post(api.races.create.path, async (req, res) => {
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
  app.post(api.results.submit.path, async (req, res) => {
    const input = api.results.submit.input.parse(req.body);
    const results = await storage.submitResults(input);
    res.status(201).json(results);
  });

  // === Teams ===
  app.get(api.teams.list.path, async (req, res) => {
    const teams = await storage.getTeams();
    res.json(teams);
  });
  app.post(api.teams.create.path, async (req, res) => {
    const input = api.teams.create.input.parse(req.body);
    const team = await storage.createTeam(input);
    res.status(201).json(team);
  });

  return httpServer;
}
