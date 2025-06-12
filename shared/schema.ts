import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  arabicName: varchar("arabic_name"),
  familyName: varchar("family_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Family members table
export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  arabicName: varchar("arabic_name"),
  birthDate: timestamp("birth_date"),
  deathDate: timestamp("death_date"),
  gender: varchar("gender", { length: 10 }),
  fatherId: integer("father_id").references(() => familyMembers.id),
  motherId: integer("mother_id").references(() => familyMembers.id),
  spouseId: integer("spouse_id").references(() => familyMembers.id),
  birthPlace: text("birth_place"),
  occupation: text("occupation"),
  notes: text("notes"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Family news table
export const familyNews = pgTable("family_news", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Family documents table
export const familyDocuments = pgTable("family_documents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  fileUrl: varchar("file_url").notNull(),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  category: varchar("category"),
  memberId: integer("member_id").references(() => familyMembers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Family photos table
export const familyPhotos = pgTable("family_photos", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  title: varchar("title"),
  description: text("description"),
  imageUrl: varchar("image_url").notNull(),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size"),
  memberId: integer("member_id").references(() => familyMembers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Family invitations table
export const familyInvitations = pgTable("family_invitations", {
  id: serial("id").primaryKey(),
  fromUserId: varchar("from_user_id").references(() => users.id),
  email: varchar("email").notNull(),
  role: varchar("role").default("member"),
  status: varchar("status").default("pending"), // pending, accepted, declined
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertFamilyMember = typeof familyMembers.$inferInsert;
export type FamilyMember = typeof familyMembers.$inferSelect;

export type InsertFamilyNews = typeof familyNews.$inferInsert;
export type FamilyNews = typeof familyNews.$inferSelect;

export type InsertFamilyDocument = typeof familyDocuments.$inferInsert;
export type FamilyDocument = typeof familyDocuments.$inferSelect;

export type InsertFamilyPhoto = typeof familyPhotos.$inferInsert;
export type FamilyPhoto = typeof familyPhotos.$inferSelect;

export type InsertFamilyInvitation = typeof familyInvitations.$inferInsert;
export type FamilyInvitation = typeof familyInvitations.$inferSelect;

// Zod schemas
export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFamilyNewsSchema = createInsertSchema(familyNews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFamilyDocumentSchema = createInsertSchema(familyDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFamilyPhotoSchema = createInsertSchema(familyPhotos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFamilyInvitationSchema = createInsertSchema(familyInvitations).omit({
  id: true,
  createdAt: true,
});
