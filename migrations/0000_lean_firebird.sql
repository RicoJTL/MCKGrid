-- Current sql file was generated after introspecting the database
-- These tables already exist in production, so statements are commented out
-- This migration serves as the baseline for future migrations

/*
CREATE TYPE "public"."admin_level" AS ENUM('none', 'admin', 'super_admin');
CREATE TYPE "public"."competition_type" AS ENUM('series', 'single_event', 'head_to_head', 'time_attack');
CREATE TYPE "public"."race_status" AS ENUM('scheduled', 'completed', 'cancelled');
CREATE TYPE "public"."role" AS ENUM('admin', 'racer', 'spectator');
CREATE TABLE "competitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"league_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" "competition_type" DEFAULT 'series' NOT NULL,
	"rules" jsonb DEFAULT '{"pointsSystem":{}}'::jsonb
);
CREATE TABLE "competition_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"competition_id" integer NOT NULL,
	"profile_id" integer NOT NULL
);
CREATE TABLE "leagues" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"season_start" timestamp,
	"season_end" timestamp
);
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"role" "role" DEFAULT 'spectator' NOT NULL,
	"admin_level" "admin_level" DEFAULT 'none' NOT NULL,
	"team_id" integer,
	"full_name" text,
	"driver_name" text,
	"profile_image" text
);
CREATE TABLE "races" (
	"id" serial PRIMARY KEY NOT NULL,
	"competition_id" integer NOT NULL,
	"name" text NOT NULL,
	"date" timestamp NOT NULL,
	"location" text NOT NULL,
	"status" "race_status" DEFAULT 'scheduled' NOT NULL
);
CREATE TABLE "results" (
	"id" serial PRIMARY KEY NOT NULL,
	"race_id" integer NOT NULL,
	"racer_id" integer NOT NULL,
	"position" integer NOT NULL,
	"points" integer NOT NULL,
	"race_time" text
);
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"logo_url" text,
	CONSTRAINT "teams_code_unique" UNIQUE("code")
);
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "competition_enrollments" ADD CONSTRAINT "competition_enrollments_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "competition_enrollments" ADD CONSTRAINT "competition_enrollments_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "races" ADD CONSTRAINT "races_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "results" ADD CONSTRAINT "results_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "results" ADD CONSTRAINT "results_racer_id_profiles_id_fk" FOREIGN KEY ("racer_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");
*/
