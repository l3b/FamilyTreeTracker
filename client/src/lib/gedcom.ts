export interface GedcomIndividual {
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
  photos?: string[]; // OBJE references for multimedia
}

export interface GedcomFamily {
  id: string;
  husband?: string;
  wife?: string;
  children?: string[];
  marriageDate?: string;
  marriagePlace?: string;
}

export interface GedcomSource {
  id: string;
  title?: string;
  author?: string;
  publication?: string;
}

export interface ParsedGedcom {
  individuals: GedcomIndividual[];
  families: GedcomFamily[];
  sources: GedcomSource[];
}

export function parseGedcom(gedcomText: string): ParsedGedcom {
  const lines = gedcomText.split('\n').map(line => line.trim()).filter(line => line);
  
  const individuals: GedcomIndividual[] = [];
  const families: GedcomFamily[] = [];
  const sources: GedcomSource[] = [];
  
  let currentRecord: any = null;
  let currentType: 'INDI' | 'FAM' | 'SOUR' | null = null;
  let currentSubRecord: string | null = null;

  for (const line of lines) {
    const parts = line.split(' ');
    const level = parseInt(parts[0]);
    const tag = parts[1];
    const value = parts.slice(2).join(' ');

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

      // Start new record
      if (tag === 'INDI') {
        currentType = 'INDI';
        currentRecord = { id: parts[1].replace(/[@]/g, ''), spouse: [], children: [] };
      } else if (tag === 'FAM') {
        currentType = 'FAM';
        currentRecord = { id: parts[1].replace(/[@]/g, ''), children: [] };
      } else if (tag === 'SOUR') {
        currentType = 'SOUR';
        currentRecord = { id: parts[1].replace(/[@]/g, '') };
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
        case 'FAMC':
          // Child in family
          currentRecord.parentFamily = value.replace(/[@]/g, '');
          break;
        case 'FAMS':
          // Spouse in family
          if (!currentRecord.spouseFamilies) currentRecord.spouseFamilies = [];
          currentRecord.spouseFamilies.push(value.replace(/[@]/g, ''));
          break;
        case 'HUSB':
          currentRecord.husband = value.replace(/[@]/g, '');
          break;
        case 'WIFE':
          currentRecord.wife = value.replace(/[@]/g, '');
          break;
        case 'CHIL':
          currentRecord.children.push(value.replace(/[@]/g, ''));
          break;
        case 'MARR':
          currentSubRecord = 'MARR';
          break;
        case 'TITL':
          currentRecord.title = value;
          break;
        case 'AUTH':
          currentRecord.author = value;
          break;
        case 'PUBL':
          currentRecord.publication = value;
          break;
        case 'OBJE':
          // Multimedia object reference
          if (!currentRecord.photos) currentRecord.photos = [];
          currentRecord.photos.push(value.replace(/[@]/g, ''));
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

  // Post-process to establish relationships
  processRelationships(individuals, families);

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
  // Simple date parsing - could be enhanced for various GEDCOM date formats
  // Common formats: "DD MMM YYYY", "YYYY", "ABT YYYY", etc.
  
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
        return match[1];
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

function processRelationships(individuals: GedcomIndividual[], families: GedcomFamily[]) {
  // Create lookup maps
  const individualMap = new Map(individuals.map(ind => [ind.id, ind]));
  const familyMap = new Map(families.map(fam => [fam.id, fam]));

  // Process family relationships
  for (const individual of individuals) {
    // Find parents through parent family
    if ((individual as any).parentFamily) {
      const parentFamily = familyMap.get((individual as any).parentFamily);
      if (parentFamily) {
        if (parentFamily.husband) {
          individual.father = parentFamily.husband;
        }
        if (parentFamily.wife) {
          individual.mother = parentFamily.wife;
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

export function generateGedcom(individuals: GedcomIndividual[], families: GedcomFamily[] = []): string {
  let gedcomContent = '';

  // Header
  gedcomContent += '0 HEAD\n';
  gedcomContent += '1 SOUR عائلتنا\n';
  gedcomContent += '1 GEDC\n';
  gedcomContent += '2 VERS 5.5.1\n';
  gedcomContent += '2 FORM LINEAGE-LINKED\n';
  gedcomContent += '1 CHAR UTF-8\n';

  // Individuals
  for (const individual of individuals) {
    gedcomContent += `0 @I${individual.id}@ INDI\n`;
    
    if (individual.name || individual.firstName || individual.lastName) {
      const firstName = individual.firstName || '';
      const lastName = individual.lastName || '';
      gedcomContent += `1 NAME ${firstName} /${lastName}/\n`;
      if (firstName) gedcomContent += `2 GIVN ${firstName}\n`;
      if (lastName) gedcomContent += `2 SURN ${lastName}\n`;
    }

    if (individual.gender) {
      const sex = individual.gender === 'ذكر' ? 'M' : individual.gender === 'أنثى' ? 'F' : 'U';
      gedcomContent += `1 SEX ${sex}\n`;
    }

    if (individual.birth) {
      gedcomContent += '1 BIRT\n';
      gedcomContent += `2 DATE ${individual.birth}\n`;
      if (individual.birthPlace) {
        gedcomContent += `2 PLAC ${individual.birthPlace}\n`;
      }
    }

    if (individual.death) {
      gedcomContent += '1 DEAT\n';
      gedcomContent += `2 DATE ${individual.death}\n`;
      if (individual.deathPlace) {
        gedcomContent += `2 PLAC ${individual.deathPlace}\n`;
      }
    }

    if (individual.occupation) {
      gedcomContent += `1 OCCU ${individual.occupation}\n`;
    }
  }

  // Families
  for (const family of families) {
    gedcomContent += `0 @F${family.id}@ FAM\n`;
    
    if (family.husband) {
      gedcomContent += `1 HUSB @I${family.husband}@\n`;
    }
    
    if (family.wife) {
      gedcomContent += `1 WIFE @I${family.wife}@\n`;
    }

    if (family.children) {
      for (const child of family.children) {
        gedcomContent += `1 CHIL @I${child}@\n`;
      }
    }

    if (family.marriageDate) {
      gedcomContent += '1 MARR\n';
      gedcomContent += `2 DATE ${family.marriageDate}\n`;
      if (family.marriagePlace) {
        gedcomContent += `2 PLAC ${family.marriagePlace}\n`;
      }
    }
  }

  // Trailer
  gedcomContent += '0 TRLR\n';

  return gedcomContent;
}

export function convertToFamilyMembers(individuals: GedcomIndividual[]): any[] {
  return individuals.map(individual => ({
    firstName: individual.firstName || '',
    lastName: individual.lastName || '',
    arabicName: individual.name || '',
    birthDate: individual.birth ? new Date(individual.birth) : null,
    deathDate: individual.death ? new Date(individual.death) : null,
    gender: individual.gender || '',
    birthPlace: individual.birthPlace || '',
    occupation: individual.occupation || '',
    profileImageUrl: individual.photos && individual.photos.length > 0 ? individual.photos[0] : null,
    notes: `استُورد من ملف GEDCOM - معرف: ${individual.id}${individual.photos ? ` - صور: ${individual.photos.length}` : ''}`,
  }));
}
