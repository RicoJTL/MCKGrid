import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/models/auth";

async function seed() {
  console.log("Seeding database...");

  // Create a test user if none exist (this relies on auth, which might be empty)
  // We can't easily create a user without auth flow, but we can create leagues/competitions.

  const leagues = await storage.getLeagues();
  if (leagues.length === 0) {
    console.log("Creating default league...");
    const league = await storage.createLeague({
      name: "Championship 2025",
      description: "The main racing series for the year.",
      seasonStart: new Date(),
      seasonEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    });

    console.log("Creating default competition...");
    const competition = await storage.createCompetition({
      leagueId: league.id,
      name: "Summer Series",
      type: "series",
      rules: { pointsSystem: { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10 } },
    });

    console.log("Creating default race...");
    await storage.createRace({
      competitionId: competition.id,
      name: "Season Opener",
      date: new Date(new Date().setDate(new Date().getDate() + 7)), // 1 week from now
      location: "Karting Center A",
      status: "scheduled",
    });
  }

  console.log("Seeding complete.");
}

seed().catch(console.error);
