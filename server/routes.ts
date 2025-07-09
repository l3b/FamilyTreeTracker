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
  familyMembers,
  familyNews,
  familyDocuments,
  familyPhotos
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Import GEDCOM parser - we'll create a server-side version
interface GedcomIndividual {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  birth?: string;
  death?: string;
  birthPlace?: string;
  deathPlace?: string;
  occupation?: string;
  father?: string;
  mother?: string;
  spouse?: string[];
  children?: string[];
}

function processRelationships(individuals: GedcomIndividual[], families: GedcomFamily[]) {
  // Create lookup maps
  const individualMap = new Map(individuals.map(ind => [ind.id, ind]));
  const familyMap = new Map(families.map(fam => [fam.id, fam]));

  console.log(`Processing relationships for ${individuals.length} individuals and ${families.length} families`);

  // Process family relationships
  for (const individual of individuals) {
    // Find parents through parent family
    if ((individual as any).parentFamily) {
      const parentFamily = familyMap.get((individual as any).parentFamily);
      if (parentFamily) {
        if (parentFamily.husband) {
          individual.father = parentFamily.husband;
          console.log(`Set father for ${individual.name}: ${parentFamily.husband}`);
        }
        if (parentFamily.wife) {
          individual.mother = parentFamily.wife;
          console.log(`Set mother for ${individual.name}: ${parentFamily.wife}`);
        }
      }
    }

    // Find spouses through spouse families
    if ((individual as any).spouseFamilies) {
      for (const familyId of (individual as any).spouseFamilies) {
        const family = familyMap.get(familyId);
        if (family) {
          if (family.husband && family.husband !== individual.id) {
            if (!individual.spouse) individual.spouse = [];
            individual.spouse.push(family.husband);
          }
          if (family.wife && family.wife !== individual.id) {
            if (!individual.spouse) individual.spouse = [];
            individual.spouse.push(family.wife);
          }
          // Add children
          if (family.children) {
            individual.children = [...(individual.children || []), ...family.children];
          }
        }
      }
    }
  }
}

interface GedcomFamily {
  id: string;
  husband?: string;
  wife?: string;
  children?: string[];
  marriageDate?: string;
  marriagePlace?: string;
}

interface ParsedGedcom {
  individuals: GedcomIndividual[];
  families: GedcomFamily[];
  sources: any[];
}

function parseGedcom(gedcomText: string): ParsedGedcom {
  const lines = gedcomText.split('\n').map(line => line.trim()).filter(line => line);
  
  const individuals: GedcomIndividual[] = [];
  const families: GedcomFamily[] = [];
  const sources: any[] = [];
  
  let currentRecord: any = null;
  let currentType: 'INDI' | 'FAM' | 'SOUR' | null = null;
  let currentSubRecord: string | null = null;

  console.log(`Processing ${lines.length} lines from GEDCOM file`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.length < 3) continue;

    // Parse level, tag, and value more carefully
    const spaceIndex = line.indexOf(' ');
    if (spaceIndex === -1) continue;

    const level = parseInt(line.substring(0, spaceIndex));
    if (isNaN(level)) continue;

    const remainder = line.substring(spaceIndex + 1);
    const secondSpaceIndex = remainder.indexOf(' ');
    
    let tag: string;
    let value: string;
    
    if (secondSpaceIndex === -1) {
      tag = remainder;
      value = '';
    } else {
      tag = remainder.substring(0, secondSpaceIndex);
      value = remainder.substring(secondSpaceIndex + 1);
    }

    // Debug first few lines
    if (i < 10) {
      console.log(`Line ${i}: Level=${level}, Tag="${tag}", Value="${value}"`);
    }

    // Start of a new record
    if (level === 0) {
      // Save previous record
      if (currentRecord && currentType) {
        switch (currentType) {
          case 'INDI':
            individuals.push(currentRecord);
            break;
          case 'FAM':
            families.push(currentRecord);
            break;
          case 'SOUR':
            sources.push(currentRecord);
            break;
        }
      }

      // Start new record - check if tag starts with @ (indicating ID)
      if (tag.startsWith('@') && tag.endsWith('@')) {
        const recordId = tag.replace(/[@]/g, '');
        if (value === 'INDI') {
          currentType = 'INDI';
          currentRecord = { id: recordId, spouse: [], children: [] };
          console.log(`Found individual: ${recordId}`);
        } else if (value === 'FAM') {
          currentType = 'FAM';
          currentRecord = { id: recordId, children: [] };
          console.log(`Found family: ${recordId}`);
        } else if (value === 'SOUR') {
          currentType = 'SOUR';
          currentRecord = { id: recordId };
          console.log(`Found source: ${recordId}`);
        } else {
          currentType = null;
          currentRecord = null;
        }
      } else {
        currentType = null;
        currentRecord = null;
      }
      currentSubRecord = null;
    }
    // Level 1 tags
    else if (level === 1 && currentRecord) {
      currentSubRecord = tag;
      
      switch (tag) {
        case 'NAME':
          parseNameField(currentRecord, value);
          break;
        case 'SEX':
          currentRecord.gender = value === 'M' ? 'ذكر' : value === 'F' ? 'أنثى' : value;
          break;
        case 'BIRT':
          currentSubRecord = 'BIRT';
          break;
        case 'DEAT':
          currentSubRecord = 'DEAT';
          break;
        case 'OCCU':
          currentRecord.occupation = value;
          break;
        case 'EDUC':
          currentRecord.education = value;
          break;
        case 'PHONE':
          currentRecord.phone = value;
          break;
        case 'EMAIL':
          currentRecord.email = value;
          break;
        case 'MARR':
          currentSubRecord = 'MARR';
          break;
        case 'FAMC':
          // Family as Child - parent family
          (currentRecord as any).parentFamily = value.replace(/[@]/g, '');
          console.log(`Set parentFamily for ${currentRecord.name}: ${(currentRecord as any).parentFamily}`);
          break;
        case 'FAMS':
          // Family as Spouse - spouse family
          if (!(currentRecord as any).spouseFamilies) (currentRecord as any).spouseFamilies = [];
          (currentRecord as any).spouseFamilies.push(value.replace(/[@]/g, ''));
          console.log(`Set spouseFamilies for ${currentRecord.name}: ${(currentRecord as any).spouseFamilies}`);
          break;
        case 'HUSB':
          if (currentRecord.children !== undefined) { // This is a family record
            currentRecord.husband = value.replace(/[@]/g, '');
          }
          break;
        case 'WIFE':
          if (currentRecord.children !== undefined) { // This is a family record
            currentRecord.wife = value.replace(/[@]/g, '');
          }
          break;
        case 'CHIL':
          if (currentRecord.children !== undefined) { // This is a family record
            currentRecord.children.push(value.replace(/[@]/g, ''));
          }
          break;
      }
    }
    // Level 2 tags
    else if (level === 2 && currentRecord && currentSubRecord) {
      switch (currentSubRecord) {
        case 'BIRT':
          if (tag === 'DATE') {
            currentRecord.birth = parseDate(value);
          } else if (tag === 'PLAC') {
            currentRecord.birthPlace = value;
          }
          break;
        case 'DEAT':
          if (tag === 'DATE') {
            currentRecord.death = parseDate(value);
          } else if (tag === 'PLAC') {
            currentRecord.deathPlace = value;
          }
          break;
        case 'MARR':
          if (tag === 'DATE') {
            currentRecord.marriageDate = parseDate(value);
          } else if (tag === 'PLAC') {
            currentRecord.marriagePlace = value;
          }
          break;
      }
    }
  }

  // Save the last record
  if (currentRecord && currentType) {
    switch (currentType) {
      case 'INDI':
        individuals.push(currentRecord);
        break;
      case 'FAM':
        families.push(currentRecord);
        break;
      case 'SOUR':
        sources.push(currentRecord);
        break;
    }
  }

  // Process relationships after parsing all records
  processRelationships(individuals, families);

  console.log(`Parsed GEDCOM: ${individuals.length} individuals, ${families.length} families`);
  if (individuals.length > 0) {
    console.log('Sample individual:', individuals[0]);
  }

  return { individuals, families, sources };
}

function parseNameField(individual: GedcomIndividual, nameValue: string) {
  // Parse name in format "FirstName /LastName/" or "FirstName LastName"
  const nameParts = nameValue.split('/');
  
  if (nameParts.length >= 3) {
    // Format: "FirstName /LastName/"
    individual.firstName = nameParts[0].trim();
    individual.lastName = nameParts[1].trim();
    individual.name = `${individual.firstName} ${individual.lastName}`;
  } else {
    // Format: "FirstName LastName" or single name
    const parts = nameValue.trim().split(' ');
    if (parts.length >= 2) {
      individual.firstName = parts[0];
      individual.lastName = parts.slice(1).join(' ');
    } else {
      individual.firstName = parts[0] || '';
      individual.lastName = '';
    }
    individual.name = nameValue.trim();
  }
}

function parseDate(dateValue: string): string {
  // Simple date parsing for GEDCOM date formats
  const cleanDate = dateValue.replace(/^(ABT|EST|CAL|AFT|BEF)\s+/i, '').trim();
  
  // Try to parse different date formats
  const datePatterns = [
    /(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})/i,
    /(\d{4})/,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/
  ];

  for (const pattern of datePatterns) {
    const match = cleanDate.match(pattern);
    if (match) {
      if (pattern === datePatterns[0]) {
        // DD MMM YYYY format
        const monthMap: { [key: string]: string } = {
          'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
          'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
          'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
        };
        const day = match[1].padStart(2, '0');
        const month = monthMap[match[2].toUpperCase()];
        const year = match[3];
        return `${year}-${month}-${day}`;
      } else if (pattern === datePatterns[1]) {
        // YYYY format
        return `${match[1]}-01-01`;
      } else if (pattern === datePatterns[2]) {
        // MM/DD/YYYY format
        const month = match[1].padStart(2, '0');
        const day = match[2].padStart(2, '0');
        const year = match[3];
        return `${year}-${month}-${day}`;
      } else if (pattern === datePatterns[3]) {
        // YYYY-MM-DD format
        return cleanDate;
      }
    }
  }

  return cleanDate; // Return as-is if no pattern matches
}

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

  app.get("/api/family-members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const memberId = parseInt(req.params.id);
      const member = await storage.getFamilyMember(memberId);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Verify the member belongs to the user's family
      const userId = req.user.claims.sub;
      if (member.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(member);
    } catch (error) {
      console.error("Error fetching family member:", error);
      res.status(500).json({ message: "Failed to fetch family member" });
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
      const userId = req.user.claims.sub;
      
      // Get the member to check permissions
      const member = await storage.getFamilyMember(id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Get user to check admin status
      const user = await storage.getUser(userId);
      const isAdmin = user?.isAdmin || user?.isSuperAdmin;
      
      // Check permissions: admin can update anyone, regular users can update their own family
      if (!isAdmin && member.userId !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only update your own family members" });
      }
      
      const memberData = insertFamilyMemberSchema.partial().parse(req.body);
      const updatedMember = await storage.updateFamilyMember(id, memberData);
      
      // Log the activity
      await storage.logUserActivity({
        userId,
        action: "update_member",
        entityType: "family_member",
        entityId: id,
        details: { updatedFields: Object.keys(memberData) },
        ipAddress: req.ip
      });
      
      res.json(updatedMember);
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
      let documents = await storage.getFamilyDocuments(userId);
      
      // Filter by familyMemberId if provided
      const familyMemberId = req.query.familyMemberId;
      if (familyMemberId) {
        documents = documents.filter((doc: any) => doc.familyMemberId === parseInt(familyMemberId));
      }
      
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
      let photos = await storage.getFamilyPhotos(userId);
      
      // Filter by familyMemberId if provided
      const familyMemberId = req.query.familyMemberId;
      if (familyMemberId) {
        photos = photos.filter((photo: any) => photo.familyMemberId === parseInt(familyMemberId));
      }
      
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

  // Complete database cleanup route
  app.post("/api/admin/cleanup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      console.log("Starting complete database cleanup for user:", userId);
      
      // Get counts before cleanup
      const [membersBefore, photosBefore, documentsBefore, newsBefore] = await Promise.all([
        storage.getFamilyMembers(userId),
        storage.getFamilyPhotos(userId),
        storage.getFamilyDocuments(userId),
        storage.getFamilyNews(userId)
      ]);
      
      // Step 1: Remove all relationships first
      console.log("Step 1: Removing all relationships...");
      await db.update(familyMembers)
        .set({ 
          fatherId: null, 
          motherId: null, 
          spouseId: null 
        })
        .where(eq(familyMembers.userId, userId));
      
      // Step 2: Delete all records
      console.log("Step 2: Deleting all family data...");
      await Promise.all([
        db.delete(familyMembers).where(eq(familyMembers.userId, userId)),
        db.delete(familyPhotos).where(eq(familyPhotos.userId, userId)),
        db.delete(familyDocuments).where(eq(familyDocuments.userId, userId)),
        db.delete(familyNews).where(eq(familyNews.userId, userId))
      ]);
      
      console.log("Complete cleanup finished successfully");
      
      res.json({ 
        message: "Database cleaned successfully",
        removed: {
          members: membersBefore.length,
          photos: photosBefore.length,
          documents: documentsBefore.length,
          news: newsBefore.length
        }
      });
    } catch (error) {
      console.error("Error during cleanup:", error);
      res.status(500).json({ message: "Failed to cleanup database", error: (error as Error).message });
    }
  });

  // GEDCOM import/export routes
  app.post("/api/gedcom/import", isAuthenticated, upload.single("gedcom"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ message: "No GEDCOM file uploaded" });
      }

      // Read and parse GEDCOM file
      const gedcomContent = await fs.promises.readFile(req.file.path, 'utf-8');
      const parsedData = parseGedcom(gedcomContent);
      
      console.log(`Parsed GEDCOM: ${parsedData.individuals.length} individuals, ${parsedData.families.length} families`);
      
      // Check if user wants to clear existing data
      const clearExisting = req.body.clearExisting === 'true';
      
      // Get existing family members
      const existingMembers = await storage.getFamilyMembers(userId);
      
      // Clear existing data if requested
      let clearedCount = 0;
      if (clearExisting && existingMembers.length > 0) {
        console.log(`Clearing ${existingMembers.length} existing family members for fresh import`);
        
        try {
          // First, clear all relationship references to avoid foreign key conflicts
          await db.update(familyMembers)
            .set({ 
              fatherId: null, 
              motherId: null, 
              spouseId: null 
            })
            .where(eq(familyMembers.userId, userId));
          
          // Then delete all members for this user
          await db.delete(familyMembers)
            .where(eq(familyMembers.userId, userId));
          
          clearedCount = existingMembers.length;
        } catch (clearError) {
          console.error('Error clearing existing members:', clearError);
          throw new Error('Failed to clear existing family members');
        }
      }
      
      // Convert and import family members
      let importedCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;
      const importedMembers = [];
      const gedcomToDbMap = new Map(); // Map GEDCOM IDs to database IDs
      
      // First pass: Create all individuals without relationships
      for (const individual of parsedData.individuals) {
        try {
          const firstName = individual.firstName || individual.name?.split(' ')[0] || 'غير محدد';
          const lastName = individual.lastName || individual.name?.split(' ').slice(1).join(' ') || 'غير محدد';
          const fullName = individual.name || `${firstName} ${lastName}`;
          
          // Check if member already exists by name or similar birth date
          const existingMember = existingMembers.find(member => 
            (member.firstName === firstName && member.lastName === lastName) ||
            (member.arabicName === fullName) ||
            (individual.birth && member.birthDate && 
             Math.abs(new Date(individual.birth).getTime() - member.birthDate.getTime()) < 86400000) // Within 1 day
          );

          if (existingMember) {
            // Update existing member with GEDCOM data if it has more information
            const hasNewInfo = individual.birth || individual.death || individual.birthPlace || individual.occupation;
            if (hasNewInfo && !existingMember.notes?.includes('GEDCOM')) {
              const updateData: any = {
                notes: existingMember.notes 
                  ? `${existingMember.notes} | محدث من GEDCOM - معرف: ${individual.id}`
                  : `محدث من GEDCOM - معرف: ${individual.id}`,
              };
              
              if (individual.birth && !existingMember.birthDate) {
                updateData.birthDate = new Date(individual.birth);
              }
              if (individual.death && !existingMember.deathDate) {
                updateData.deathDate = new Date(individual.death);
              }
              if (individual.birthPlace && !existingMember.birthPlace) {
                updateData.birthPlace = individual.birthPlace;
              }
              if (individual.occupation && !existingMember.occupation) {
                updateData.occupation = individual.occupation;
              }
              if (individual.gender && !existingMember.gender) {
                updateData.gender = individual.gender;
              }

              await storage.updateFamilyMember(existingMember.id, updateData);
              updatedCount++;
            } else {
              skippedCount++;
            }
            gedcomToDbMap.set(individual.id, existingMember.id);
            continue;
          }

          // Create new member
          const memberData: any = {
            userId,
            firstName,
            lastName,
            arabicName: fullName,
            birthDate: individual.birth ? new Date(individual.birth) : null,
            deathDate: individual.death ? new Date(individual.death) : null,
            gender: individual.gender || null,
            birthPlace: individual.birthPlace || null,
            deathPlace: individual.deathPlace || null,
            occupation: individual.occupation || null,
            education: individual.education || null,
            phone: individual.phone || null,
            email: individual.email || null,
            marriageDate: individual.marriageDate ? new Date(individual.marriageDate) : null,
            marriagePlace: individual.marriagePlace || null,
            gedcomId: individual.id,
            notes: `استُورد من ملف GEDCOM - معرف: ${individual.id}`,
          };

          // Remove null values to avoid database issues
          Object.keys(memberData).forEach(key => {
            if (memberData[key] === null || memberData[key] === '') {
              delete memberData[key];
            }
          });

          const member = await storage.createFamilyMember(memberData);
          importedMembers.push(member);
          gedcomToDbMap.set(individual.id, member.id);
          importedCount++;
        } catch (memberError) {
          console.error(`Error importing individual ${individual.id}:`, memberError);
        }
      }

      // Second pass: Update relationships
      for (const individual of parsedData.individuals) {
        try {
          const dbId = gedcomToDbMap.get(individual.id);
          if (!dbId) continue;

          const updateData: any = {};
          
          // Set father relationship - verify ID exists in database
          if (individual.father && gedcomToDbMap.has(individual.father)) {
            const fatherId = gedcomToDbMap.get(individual.father);
            // Double-check the father exists in database
            const fatherExists = await storage.getFamilyMember(fatherId!);
            if (fatherExists) {
              updateData.fatherId = fatherId;
            }
          }
          
          // Set mother relationship - verify ID exists in database
          if (individual.mother && gedcomToDbMap.has(individual.mother)) {
            const motherId = gedcomToDbMap.get(individual.mother);
            // Double-check the mother exists in database
            const motherExists = await storage.getFamilyMember(motherId!);
            if (motherExists) {
              updateData.motherId = motherId;
            }
          }
          
          // Set spouse relationship (take first spouse if multiple)
          if (individual.spouse && individual.spouse.length > 0 && gedcomToDbMap.has(individual.spouse[0])) {
            const spouseId = gedcomToDbMap.get(individual.spouse[0]);
            // Double-check the spouse exists in database
            const spouseExists = await storage.getFamilyMember(spouseId!);
            if (spouseExists) {
              updateData.spouseId = spouseId;
            }
          }

          // Update if there are relationships to set
          if (Object.keys(updateData).length > 0) {
            await storage.updateFamilyMember(dbId, updateData);
          }
        } catch (relationshipError) {
          console.error(`Error updating relationships for individual ${individual.id}:`, relationshipError);
        }
      }

      // Store the GEDCOM file as a document for reference
      const documentData = {
        userId,
        title: `GEDCOM Import - ${req.file.originalname}`,
        description: `استُورد ${importedCount} جديد، حُدث ${updatedCount}، تم تخطي ${skippedCount} من أصل ${parsedData.individuals.length} فرد`,
        fileUrl: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        category: "gedcom",
      };
      
      const document = await storage.createFamilyDocument(documentData);
      
      res.json({ 
        message: "GEDCOM file imported successfully", 
        document,
        clearedCount,
        importedCount,
        updatedCount,
        skippedCount,
        totalIndividuals: parsedData.individuals.length,
        importedMembers: importedMembers.slice(0, 5) // Return first 5 for preview
      });
    } catch (error) {
      console.error("Error importing GEDCOM:", error);
      res.status(500).json({ message: "Failed to import GEDCOM file", error: (error as Error).message });
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

  // Admin routes
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin && !user?.isSuperAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/invitations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin && !user?.isSuperAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const invitations = await storage.getFamilyInvitations(userId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post("/api/admin/invitations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin && !user?.isSuperAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const invitation = await storage.createFamilyInvitation({
        ...req.body,
        userId,
        invitedBy: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      res.status(201).json(invitation);
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.get("/api/admin/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin && !user?.isSuperAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const settings = await storage.getFamilySettings(userId);
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin && !user?.isSuperAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const settings = await storage.updateFamilySettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.get("/api/admin/activity", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin && !user?.isSuperAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const activities = await storage.getUserActivities(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
