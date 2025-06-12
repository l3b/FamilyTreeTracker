import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import {
  insertFamilyMemberSchema,
  insertFamilyNewsSchema,
  insertFamilyDocumentSchema,
  insertFamilyPhotoSchema,
  insertFamilyInvitationSchema,
} from "@shared/schema";

// Setup multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static(uploadsDir));

  // Family members routes
  app.get("/api/family-members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const members = await storage.getFamilyMembers(userId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching family members:", error);
      res.status(500).json({ message: "Failed to fetch family members" });
    }
  });

  app.post("/api/family-members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const memberData = insertFamilyMemberSchema.parse({
        ...req.body,
        userId,
      });
      const member = await storage.createFamilyMember(memberData);
      res.json(member);
    } catch (error) {
      console.error("Error creating family member:", error);
      res.status(500).json({ message: "Failed to create family member" });
    }
  });

  app.put("/api/family-members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const memberData = insertFamilyMemberSchema.partial().parse(req.body);
      const member = await storage.updateFamilyMember(id, memberData);
      res.json(member);
    } catch (error) {
      console.error("Error updating family member:", error);
      res.status(500).json({ message: "Failed to update family member" });
    }
  });

  app.delete("/api/family-members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFamilyMember(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting family member:", error);
      res.status(500).json({ message: "Failed to delete family member" });
    }
  });

  // Family news routes
  app.get("/api/family-news", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const news = await storage.getFamilyNews(userId);
      res.json(news);
    } catch (error) {
      console.error("Error fetching family news:", error);
      res.status(500).json({ message: "Failed to fetch family news" });
    }
  });

  app.post("/api/family-news", isAuthenticated, upload.single("image"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let imageUrl = "";
      
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }

      const newsData = insertFamilyNewsSchema.parse({
        ...req.body,
        userId,
        imageUrl: imageUrl || undefined,
      });
      
      const news = await storage.createFamilyNews(newsData);
      res.json(news);
    } catch (error) {
      console.error("Error creating family news:", error);
      res.status(500).json({ message: "Failed to create family news" });
    }
  });

  // Family documents routes
  app.get("/api/family-documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getFamilyDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching family documents:", error);
      res.status(500).json({ message: "Failed to fetch family documents" });
    }
  });

  app.post("/api/family-documents", isAuthenticated, upload.single("document"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const documentData = insertFamilyDocumentSchema.parse({
        ...req.body,
        userId,
        fileUrl: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });
      
      const document = await storage.createFamilyDocument(documentData);
      res.json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Family photos routes
  app.get("/api/family-photos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const photos = await storage.getFamilyPhotos(userId);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching family photos:", error);
      res.status(500).json({ message: "Failed to fetch family photos" });
    }
  });

  app.post("/api/family-photos", isAuthenticated, upload.single("photo"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }

      const photoData = insertFamilyPhotoSchema.parse({
        ...req.body,
        userId,
        imageUrl: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });
      
      const photo = await storage.createFamilyPhoto(photoData);
      res.json(photo);
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // GEDCOM import/export routes
  app.post("/api/gedcom/import", isAuthenticated, upload.single("gedcom"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ message: "No GEDCOM file uploaded" });
      }

      // TODO: Implement GEDCOM parsing
      // For now, just store the file
      const documentData = {
        userId,
        title: "GEDCOM Import",
        description: "Imported GEDCOM file",
        fileUrl: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        category: "gedcom",
      };
      
      const document = await storage.createFamilyDocument(documentData);
      res.json({ message: "GEDCOM file imported successfully", document });
    } catch (error) {
      console.error("Error importing GEDCOM:", error);
      res.status(500).json({ message: "Failed to import GEDCOM file" });
    }
  });

  app.get("/api/gedcom/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const members = await storage.getFamilyMembers(userId);
      
      // TODO: Implement GEDCOM generation
      // For now, return a simple text file
      const gedcomContent = `0 HEAD
1 SOUR عائلتنا
1 GEDC
2 VERS 5.5.1
2 FORM LINEAGE-LINKED
0 @I1@ INDI
1 NAME ${members[0]?.firstName || "Unknown"} /${members[0]?.lastName || "Unknown"}/
2 GIVN ${members[0]?.firstName || "Unknown"}
2 SURN ${members[0]?.lastName || "Unknown"}
0 TRLR`;

      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", "attachment; filename=family.ged");
      res.send(gedcomContent);
    } catch (error) {
      console.error("Error exporting GEDCOM:", error);
      res.status(500).json({ message: "Failed to export GEDCOM file" });
    }
  });

  // Family invitations routes
  app.post("/api/family-invitations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const token = Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

      const invitationData = insertFamilyInvitationSchema.parse({
        ...req.body,
        fromUserId: userId,
        token,
        expiresAt,
      });
      
      const invitation = await storage.createFamilyInvitation(invitationData);
      res.json(invitation);
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.get("/api/family-invitations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invitations = await storage.getFamilyInvitations(userId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
