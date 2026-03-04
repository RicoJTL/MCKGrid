import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { db } from "../../db";
import { sql } from "drizzle-orm";
import { authStorage } from "./storage";

export function getSession() {
  const sessionTtl = 90 * 24 * 60 * 60 * 1000; // 90 days

  // Check for required environment variables
  if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
    console.warn("DATABASE_URL or SESSION_SECRET not set - using memory session store");
    return session({
      secret: process.env.SESSION_SECRET || "development-secret-not-for-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: sessionTtl,
      },
    });
  }

  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
    errorLog: (error) => {
      console.error("Session store error:", error);
    },
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

/** Build the req.user object that the rest of the app expects. */
function buildSessionUser(user: { id: string; email: string | null }) {
  const expiresAt = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60; // now + 90 days
  return {
    claims: {
      sub: user.id,
      email: user.email ?? "",
    },
    expires_at: expiresAt,
  };
}

export async function setupAuth(app: Express) {
  // Ensure password_hash column exists (idempotent – safe to run on every start)
  try {
    await db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar`
    );
  } catch (err) {
    console.warn("Could not ensure password_hash column:", err);
  }

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const user = await authStorage.getUserWithPassword(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          if (!user.passwordHash) {
            return done(null, false, { message: "Invalid email or password" });
          }
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, buildSessionUser(user));
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Store the full shaped user object in the session
  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // Session expired – force re-login
  return res.status(401).json({ message: "Unauthorized" });
};
