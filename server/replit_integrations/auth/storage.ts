import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq, sql } from "drizzle-orm";

export type UserWithPassword = User & { passwordHash: string | null };

// Interface for auth storage operations
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserWithPassword(email: string): Promise<UserWithPassword | undefined>;
  setUserPassword(userId: string, hash: string): Promise<void>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserWithPassword(email: string): Promise<UserWithPassword | undefined> {
    // password_hash lives outside the drizzle schema – use raw SQL.
    const result = await db.execute(
      sql`SELECT id, email, first_name AS "firstName", last_name AS "lastName",
             profile_image_url AS "profileImageUrl",
             created_at AS "createdAt", updated_at AS "updatedAt",
             password_hash AS "passwordHash"
          FROM users WHERE email = ${email} LIMIT 1`
    );
    const row = result.rows[0] as any;
    if (!row) return undefined;
    return row as UserWithPassword;
  }

  async setUserPassword(userId: string, hash: string): Promise<void> {
    await db.execute(
      sql`UPDATE users SET password_hash = ${hash}, updated_at = NOW() WHERE id = ${userId}`
    );
  }
}

export const authStorage = new AuthStorage();
