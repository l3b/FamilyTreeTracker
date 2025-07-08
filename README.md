# عائلتنا - Arabic Family Genealogy Platform

An advanced Arabic family genealogy platform that enables comprehensive family history documentation and visualization with full Arabic language support and RTL interface.

## Features

### 🌳 Family Tree Visualization
- **Compact View**: Streamlined interface perfect for large families (300+ members)
- **MyHeritage-Style Layout**: User-centered tree showing immediate family relationships
- **Interactive Navigation**: Click any family member to center the tree around them
- **Multiple View Options**: Compact, Full Family, Pedigree, and Fan views

### 📁 GEDCOM Import/Export
- **Smart Import**: Intelligent duplicate detection during GEDCOM file import
- **Photo Support**: Extracts and displays photos from GEDCOM multimedia references
- **Relationship Mapping**: Automatically creates family relationships from GEDCOM data
- **Export Functionality**: Generate GEDCOM files for sharing with other genealogy platforms

### 🔐 Authentication & Security
- **Secure Login**: Integration with authentication providers
- **User Profiles**: Personal accounts with profile management
- **Data Privacy**: Each user manages their own family data securely

### 📚 Content Management
- **Family News**: Share family announcements and updates
- **Document Storage**: Upload and organize family documents (PDFs, images)
- **Photo Galleries**: Create and manage family photo collections
- **Member Profiles**: Detailed information for each family member

### 🌍 Arabic Language Support
- **Full RTL Interface**: Right-to-left layout optimized for Arabic
- **Arabic Names**: Support for Arabic names alongside English transliterations
- **Cultural Context**: Designed specifically for Arabic family structures

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for client-side routing
- **TanStack Query** for data fetching and caching
- **Tailwind CSS** with custom Arabic styling
- **Shadcn/UI** components for consistent design

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database with Drizzle ORM
- **File Upload** support with Multer
- **Session Management** with secure authentication

### Infrastructure
- **Replit** deployment ready
- **Database migrations** with Drizzle
- **Environment configuration** for development and production

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Replit account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd family-genealogy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Database configuration (provided by Replit)
   DATABASE_URL=your_database_url
   PGHOST=your_pg_host
   PGPORT=your_pg_port
   PGUSER=your_pg_user
   PGPASSWORD=your_pg_password
   PGDATABASE=your_pg_database
   
   # Session security
   SESSION_SECRET=your_session_secret
   
   # Replit configuration
   REPL_ID=your_repl_id
   REPLIT_DOMAINS=your_replit_domains
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions and API client
├── server/                # Backend Express application
│   ├── db.ts             # Database configuration
│   ├── routes.ts         # API route handlers
│   ├── storage.ts        # Data access layer
│   └── replitAuth.ts     # Authentication middleware
├── shared/                # Shared types and schemas
│   └── schema.ts         # Database schema and types
└── uploads/              # File upload directory
```

## Usage Guide

### Adding Family Members
1. Navigate to **Family Tree** page
2. Click **Add New Member** or use the + buttons in tree view
3. Fill in member details (names, dates, relationships)
4. Photos can be uploaded for profile pictures

### GEDCOM Import
1. Go to **Family Tree** page
2. Click **Import GEDCOM** button
3. Select your GEDCOM file
4. Review imported members and relationships
5. The system automatically handles duplicates intelligently

### Managing Content
- **News**: Share family announcements from the News page
- **Documents**: Upload important family documents
- **Photos**: Create photo galleries for family events

### Tree Navigation
- **Compact View**: Best for large families - shows immediate relationships
- **Full Family View**: MyHeritage-style with extended family
- **Interactive**: Click any person to center the tree around them

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Initiate login
- `GET /api/logout` - Logout user

### Family Members
- `GET /api/family-members` - Get all family members
- `POST /api/family-members` - Create new member
- `PUT /api/family-members/:id` - Update member
- `DELETE /api/family-members/:id` - Delete member

### Content Management
- `GET /api/family-news` - Get family news
- `POST /api/family-news` - Create news item
- `GET /api/family-documents` - Get documents
- `POST /api/family-documents` - Upload document
- `GET /api/family-photos` - Get photos
- `POST /api/family-photos` - Upload photo

### GEDCOM
- `POST /api/import-gedcom` - Import GEDCOM file
- `GET /api/export-gedcom` - Export family data as GEDCOM

## Database Schema

### Core Tables
- **users**: User accounts and profiles
- **family_members**: Individual family member records
- **family_news**: Family announcements and updates
- **family_documents**: Document storage and metadata
- **family_photos**: Photo galleries and metadata
- **sessions**: User session management

### Relationships
Family members are connected through:
- `fatherId` and `motherId` for parent relationships
- `spouseId` for marriage relationships
- Automatically calculated sibling and child relationships

## Development

### Running Tests
```bash
npm test
```

### Database Operations
```bash
# Push schema changes to database
npm run db:push

# Generate migrations (if needed)
npm run db:generate

# View database in Drizzle Studio
npm run db:studio
```

### Building for Production
```bash
npm run build
```

## Deployment

The application is designed for Replit deployment:

1. **Push to Replit**
2. **Configure environment variables** in Replit secrets
3. **Create PostgreSQL database** using Replit's database service
4. **Deploy** using Replit's deployment feature

The app will be available at your `.replit.app` domain.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the project guidelines in `replit.md`

## Acknowledgments

- Built with modern web technologies for optimal performance
- Designed specifically for Arabic genealogy research
- Inspired by MyHeritage and FamilySearch interfaces
- Optimized for large family trees (300+ members)

---

**عائلتنا** - Connecting Arab families across generations 🌳