import { pgTable, text, serial, integer, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (expanded with profile information)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  preferences: text("preferences").default("{}"), // JSON string for user preferences
  notificationsEnabled: boolean("notifications_enabled").default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
  avatarUrl: true,
  notificationsEnabled: true,
});

// User session for maintaining login state
export const userSessions = pgTable("user_sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Deities table
export const deities = pgTable("deities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description").notNull(),
  svgIcon: text("svg_icon").notNull(),
  mantraCount: integer("mantra_count").notNull(),
});

export const insertDeitySchema = createInsertSchema(deities);

// Mantras table
export const mantras = pgTable("mantras", {
  id: text("id").primaryKey(),
  deityId: text("deity_id").notNull(),
  title: text("title").notNull(),
  sanskrit: text("sanskrit").notNull(),
  transliteration: text("transliteration").notNull(),
  meaning: text("meaning").notNull(),
  benefits: text("benefits").notNull(),
  audioUrl: text("audio_url"),
  backgroundMusic: text("background_music"), // Optional background music URL
});

export const insertMantraSchema = createInsertSchema(mantras);

// User favorite mantras
export const userFavorites = pgTable("user_favorites", {
  userId: integer("user_id").notNull(),
  mantraId: text("mantra_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.mantraId] })
  };
});

export const insertUserFavoriteSchema = createInsertSchema(userFavorites);

// Chant history - track user chanting sessions
export const chantHistory = pgTable("chant_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mantraId: text("mantra_id").notNull(),
  deityId: text("deity_id").notNull(),
  repetitions: integer("repetitions").notNull(),
  duration: integer("duration").notNull(), // in seconds
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  notes: text("notes"),
});

export const insertChantHistorySchema = createInsertSchema(chantHistory).omit({
  id: true,
});

// Daily featured mantras
export const dailyMantras = pgTable("daily_mantras", {
  id: serial("id").primaryKey(),
  mantraId: text("mantra_id").notNull(),
  featureDate: timestamp("feature_date").defaultNow().notNull(),
  description: text("description"), // Special description for the featured mantra
});

export const insertDailyMantraSchema = createInsertSchema(dailyMantras).omit({
  id: true,
});

// Community shared experiences
export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mantraId: text("mantra_id"),
  deityId: text("deity_id"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Guided meditation sessions
export const guidedMeditations = pgTable("guided_meditations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // in minutes
  audioUrl: text("audio_url").notNull(),
  mantraId: text("mantra_id"), // Optional associated mantra
  deityId: text("deity_id"), // Optional associated deity
  difficulty: text("difficulty").default("beginner"), // beginner, intermediate, advanced
});

export const insertGuidedMeditationSchema = createInsertSchema(guidedMeditations).omit({
  id: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type UserSession = typeof userSessions.$inferSelect;

export type InsertDeity = z.infer<typeof insertDeitySchema>;
export type Deity = typeof deities.$inferSelect;

export type InsertMantra = z.infer<typeof insertMantraSchema>;
export type Mantra = typeof mantras.$inferSelect;

export type InsertUserFavorite = z.infer<typeof insertUserFavoriteSchema>;
export type UserFavorite = typeof userFavorites.$inferSelect;

export type InsertChantHistory = z.infer<typeof insertChantHistorySchema>;
export type ChantHistory = typeof chantHistory.$inferSelect;

export type InsertDailyMantra = z.infer<typeof insertDailyMantraSchema>;
export type DailyMantra = typeof dailyMantras.$inferSelect;

export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;

export type InsertGuidedMeditation = z.infer<typeof insertGuidedMeditationSchema>;
export type GuidedMeditation = typeof guidedMeditations.$inferSelect;

// Create a Featured Mantra type
export interface FeaturedMantra {
  mantra: Mantra;
  deityId: string;
  deityName: string;
  deityDescription: string;
  svgIcon: string;
}

// User profile with stats
export interface UserProfile extends User {
  totalChants: number;
  favoriteCount: number;
  streakDays: number;
  lastActive: Date;
}

// Extended mantra with user-specific data
export interface UserMantra extends Mantra {
  isFavorite: boolean;
  lastChanted?: Date;
  totalChants: number;
}

// Blog schema
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  featuredImage: text("featured_image"),
  author: text("author").default("Divine Mantras Team"),
  category: text("category").default("Spiritual Teachings"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  published: boolean("published").default(true),
  viewCount: integer("view_count").default(0),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
