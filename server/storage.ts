import {
  users,
  familyMembers,
  familyNews,
  familyDocuments,
  familyPhotos,
  familyInvitations,
  familySettings,
  userActivityLog,
  type User,
  type UpsertUser,
  type FamilyMember,
  type InsertFamilyMember,
  type FamilyNews,
  type InsertFamilyNews,
  type FamilyDocument,
  type InsertFamilyDocument,
  type FamilyPhoto,
  type InsertFamilyPhoto,
  type FamilyInvitation,
  type InsertFamilyInvitation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Family member operations
  getFamilyMembers(userId: string): Promise<FamilyMember[]>;
  getFamilyMember(id: number): Promise<FamilyMember | undefined>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMember(id: number, member: Partial<InsertFamilyMember>): Promise<FamilyMember>;
  deleteFamilyMember(id: number): Promise<void>;

  // Family news operations
  getFamilyNews(userId: string): Promise<FamilyNews[]>;
  getFamilyNewsItem(id: number): Promise<FamilyNews | undefined>;
  createFamilyNews(news: InsertFamilyNews): Promise<FamilyNews>;
  updateFamilyNews(id: number, news: Partial<InsertFamilyNews>): Promise<FamilyNews>;
  deleteFamilyNews(id: number): Promise<void>;

  // Family document operations
  getFamilyDocuments(userId: string): Promise<FamilyDocument[]>;
  getFamilyDocument(id: number): Promise<FamilyDocument | undefined>;
  createFamilyDocument(document: InsertFamilyDocument): Promise<FamilyDocument>;
  updateFamilyDocument(id: number, document: Partial<InsertFamilyDocument>): Promise<FamilyDocument>;
  deleteFamilyDocument(id: number): Promise<void>;

  // Family photo operations
  getFamilyPhotos(userId: string): Promise<FamilyPhoto[]>;
  getFamilyPhoto(id: number): Promise<FamilyPhoto | undefined>;
  createFamilyPhoto(photo: InsertFamilyPhoto): Promise<FamilyPhoto>;
  updateFamilyPhoto(id: number, photo: Partial<InsertFamilyPhoto>): Promise<FamilyPhoto>;
  deleteFamilyPhoto(id: number): Promise<void>;

  // Family invitation operations
  getFamilyInvitations(userId: string): Promise<FamilyInvitation[]>;
  createFamilyInvitation(invitation: InsertFamilyInvitation): Promise<FamilyInvitation>;
  getFamilyInvitationByToken(token: string): Promise<FamilyInvitation | undefined>;
  updateFamilyInvitation(id: number, invitation: Partial<InsertFamilyInvitation>): Promise<FamilyInvitation>;

  // Family settings operations
  getFamilySettings(userId: string): Promise<any>;
  updateFamilySettings(userId: string, settings: any): Promise<any>;

  // Activity log operations
  getUserActivities(userId: string): Promise<any[]>;
  logUserActivity(activity: any): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
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

  // Family member operations
  async getFamilyMembers(userId: string): Promise<FamilyMember[]> {
    return await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.userId, userId))
      .orderBy(familyMembers.firstName);
  }

  async getFamilyMember(id: number): Promise<FamilyMember | undefined> {
    const [member] = await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.id, id));
    return member;
  }

  async createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    const [newMember] = await db
      .insert(familyMembers)
      .values(member)
      .returning();
    return newMember;
  }

  async updateFamilyMember(id: number, member: Partial<InsertFamilyMember>): Promise<FamilyMember> {
    const [updatedMember] = await db
      .update(familyMembers)
      .set({ ...member, updatedAt: new Date() })
      .where(eq(familyMembers.id, id))
      .returning();
    return updatedMember;
  }

  async deleteFamilyMember(id: number): Promise<void> {
    await db.delete(familyMembers).where(eq(familyMembers.id, id));
  }

  // Family news operations
  async getFamilyNews(userId: string): Promise<FamilyNews[]> {
    return await db
      .select()
      .from(familyNews)
      .where(eq(familyNews.userId, userId))
      .orderBy(desc(familyNews.createdAt));
  }

  async getFamilyNewsItem(id: number): Promise<FamilyNews | undefined> {
    const [news] = await db
      .select()
      .from(familyNews)
      .where(eq(familyNews.id, id));
    return news;
  }

  async createFamilyNews(news: InsertFamilyNews): Promise<FamilyNews> {
    const [newNews] = await db
      .insert(familyNews)
      .values(news)
      .returning();
    return newNews;
  }

  async updateFamilyNews(id: number, news: Partial<InsertFamilyNews>): Promise<FamilyNews> {
    const [updatedNews] = await db
      .update(familyNews)
      .set({ ...news, updatedAt: new Date() })
      .where(eq(familyNews.id, id))
      .returning();
    return updatedNews;
  }

  async deleteFamilyNews(id: number): Promise<void> {
    await db.delete(familyNews).where(eq(familyNews.id, id));
  }

  // Family document operations
  async getFamilyDocuments(userId: string): Promise<FamilyDocument[]> {
    return await db
      .select()
      .from(familyDocuments)
      .where(eq(familyDocuments.userId, userId))
      .orderBy(desc(familyDocuments.createdAt));
  }

  async getFamilyDocument(id: number): Promise<FamilyDocument | undefined> {
    const [document] = await db
      .select()
      .from(familyDocuments)
      .where(eq(familyDocuments.id, id));
    return document;
  }

  async createFamilyDocument(document: InsertFamilyDocument): Promise<FamilyDocument> {
    const [newDocument] = await db
      .insert(familyDocuments)
      .values(document)
      .returning();
    return newDocument;
  }

  async updateFamilyDocument(id: number, document: Partial<InsertFamilyDocument>): Promise<FamilyDocument> {
    const [updatedDocument] = await db
      .update(familyDocuments)
      .set({ ...document, updatedAt: new Date() })
      .where(eq(familyDocuments.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteFamilyDocument(id: number): Promise<void> {
    await db.delete(familyDocuments).where(eq(familyDocuments.id, id));
  }

  // Family photo operations
  async getFamilyPhotos(userId: string): Promise<FamilyPhoto[]> {
    return await db
      .select()
      .from(familyPhotos)
      .where(eq(familyPhotos.userId, userId))
      .orderBy(desc(familyPhotos.createdAt));
  }

  async getFamilyPhoto(id: number): Promise<FamilyPhoto | undefined> {
    const [photo] = await db
      .select()
      .from(familyPhotos)
      .where(eq(familyPhotos.id, id));
    return photo;
  }

  async createFamilyPhoto(photo: InsertFamilyPhoto): Promise<FamilyPhoto> {
    const [newPhoto] = await db
      .insert(familyPhotos)
      .values(photo)
      .returning();
    return newPhoto;
  }

  async updateFamilyPhoto(id: number, photo: Partial<InsertFamilyPhoto>): Promise<FamilyPhoto> {
    const [updatedPhoto] = await db
      .update(familyPhotos)
      .set({ ...photo, updatedAt: new Date() })
      .where(eq(familyPhotos.id, id))
      .returning();
    return updatedPhoto;
  }

  async deleteFamilyPhoto(id: number): Promise<void> {
    await db.delete(familyPhotos).where(eq(familyPhotos.id, id));
  }

  // Family invitation operations
  async getFamilyInvitations(userId: string): Promise<FamilyInvitation[]> {
    return await db
      .select()
      .from(familyInvitations)
      .where(eq(familyInvitations.fromUserId, userId))
      .orderBy(desc(familyInvitations.createdAt));
  }

  async createFamilyInvitation(invitation: InsertFamilyInvitation): Promise<FamilyInvitation> {
    const [newInvitation] = await db
      .insert(familyInvitations)
      .values(invitation)
      .returning();
    return newInvitation;
  }

  async getFamilyInvitationByToken(token: string): Promise<FamilyInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(familyInvitations)
      .where(eq(familyInvitations.token, token));
    return invitation;
  }

  async updateFamilyInvitation(id: number, invitation: Partial<InsertFamilyInvitation>): Promise<FamilyInvitation> {
    const [updatedInvitation] = await db
      .update(familyInvitations)
      .set(invitation)
      .where(eq(familyInvitations.id, id))
      .returning();
    return updatedInvitation;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  // Family settings operations
  async getFamilySettings(userId: string): Promise<any> {
    const [settings] = await db
      .select()
      .from(familySettings)
      .where(eq(familySettings.userId, userId));
    return settings || {};
  }

  async updateFamilySettings(userId: string, settings: any): Promise<any> {
    const existing = await this.getFamilySettings(userId);
    
    if (existing && Object.keys(existing).length > 0) {
      const [updated] = await db
        .update(familySettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(familySettings.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(familySettings)
        .values({ ...settings, userId })
        .returning();
      return created;
    }
  }

  // Activity log operations
  async getUserActivities(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(userActivityLog)
      .orderBy(desc(userActivityLog.createdAt))
      .limit(100);
  }

  async logUserActivity(activity: any): Promise<void> {
    await db
      .insert(userActivityLog)
      .values(activity);
  }
}

export const storage = new DatabaseStorage();
