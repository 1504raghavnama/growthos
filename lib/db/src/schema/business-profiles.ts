import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessProfilesTable = pgTable("business_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessName: text("business_name").notNull(),
  businessType: text("business_type").notNull(),
  location: text("location").notNull(),
  monthlyBudget: text("monthly_budget").notNull(),
  primaryGoal: text("primary_goal").notNull(),
  summary: text("summary").notNull(),
  targetPersona: text("target_persona").notNull(),
  usp: text("usp").notNull(),
  brandTone: text("brand_tone").notNull(),
  competitorInsight: text("competitor_insight").notNull(),
  contentPillars: jsonb("content_pillars").$type<string[]>().notNull(),
  topHashtags: jsonb("top_hashtags").$type<string[]>().notNull(),
  bestPostingTimes: jsonb("best_posting_times").$type<string[]>().notNull(),
  recommendedPlatforms: jsonb("recommended_platforms").$type<string[]>().notNull(),
  rawInput: jsonb("raw_input").$type<Record<string, string>>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBusinessProfileSchema = createInsertSchema(businessProfilesTable).omit({ id: true, createdAt: true });
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;
export type BusinessProfile = typeof businessProfilesTable.$inferSelect;
