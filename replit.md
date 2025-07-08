# Arabic Family Genealogy Platform - عائلتنا

## Overview

This is a comprehensive Arabic family genealogy platform designed to help Arabic-speaking families document, preserve, and share their family history. The application features full Arabic language support with right-to-left (RTL) interface design, GEDCOM import/export capabilities, and multiple visualization options for family trees.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern component architecture
- **Wouter** for lightweight client-side routing
- **TanStack Query** for efficient data fetching, caching, and state management
- **Tailwind CSS** with custom Arabic/RTL styling and heritage color scheme
- **Shadcn/UI** components for consistent design system
- **Vite** as the build tool with hot module replacement for development

### Backend Architecture
- **Node.js** with Express.js for RESTful API endpoints
- **PostgreSQL** database with Drizzle ORM for type-safe database operations
- **Neon Database** integration for serverless PostgreSQL
- **Session-based authentication** with Replit Auth integration
- **Multer** for file upload handling (documents, photos, GEDCOM files)

### Database Design
- **User management** with Replit Auth integration
- **Family member** relationships with parent/child/spouse connections
- **Content management** for news, documents, and photos
- **Session storage** for authentication state
- **GEDCOM import/export** support with multimedia references

## Key Components

### Authentication & User Management
- **Replit Auth Integration**: Secure OAuth-based authentication
- **User Profiles**: Personal accounts with Arabic name support
- **Session Management**: PostgreSQL-based session storage with TTL

### Family Tree Management
- **Multiple View Types**: Compact, Full Family, Pedigree, and Fan views
- **Interactive Navigation**: Click-to-center functionality for large family trees
- **Relationship Mapping**: Parent-child, spouse, and sibling relationships
- **GEDCOM Support**: Import/export with duplicate detection and photo extraction

### Content Management System
- **Family News**: Announcements and updates with image support
- **Document Storage**: PDF and image upload with categorization
- **Photo Galleries**: Family photo management with metadata
- **File Upload**: Multer-based file handling with validation

### Arabic Language Support
- **RTL Interface**: Complete right-to-left layout optimization
- **Arabic Typography**: Noto Sans Arabic font integration
- **Dual Language Names**: Support for both Arabic and English names
- **Cultural Customization**: Arabic-specific UI patterns and conventions

## Data Flow

### Client-Side Data Management
1. **TanStack Query** handles API calls with automatic caching
2. **Optimistic updates** for better user experience
3. **Error boundaries** for graceful error handling
4. **Loading states** with Arabic text and animations

### Server-Side Data Processing
1. **Express middleware** for authentication and request processing
2. **Drizzle ORM** for type-safe database operations
3. **File upload pipeline** with validation and storage
4. **GEDCOM parsing** with relationship extraction

### Database Operations
1. **User data** synchronized with Replit Auth
2. **Family relationships** stored with referential integrity
3. **Content metadata** with user ownership
4. **Session persistence** for authentication state

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **@radix-ui/react-***: Accessible UI component primitives
- **@tanstack/react-query**: Data fetching and state management
- **drizzle-orm**: Type-safe database ORM
- **passport**: Authentication middleware
- **multer**: File upload handling

### Development Tools
- **TypeScript**: Static type checking
- **ESLint**: Code linting and formatting
- **Vite**: Build tool with development server
- **Tailwind CSS**: Utility-first CSS framework

### Authentication Services
- **Replit Auth**: OAuth provider integration
- **OpenID Connect**: Authentication protocol
- **Session management**: PostgreSQL-based storage

## Deployment Strategy

### Development Environment
- **Replit integration** with automatic deployment
- **Hot module replacement** for rapid development
- **Environment variables** for configuration
- **Development banners** for non-production environments

### Production Configuration
- **Static asset serving** with Express
- **Database migrations** with Drizzle Kit
- **Session persistence** with PostgreSQL
- **File upload storage** with proper validation

### Database Management
- **Drizzle Kit** for schema management and migrations
- **Connection pooling** with Neon serverless
- **Backup and recovery** through database provider
- **Performance monitoring** with query optimization

## Changelog

- July 08, 2025: Initial setup
- July 08, 2025: Enhanced GEDCOM import with relationship linking and bulk clear functionality
- July 08, 2025: Fixed foreign key constraint issues during family member deletion
- July 08, 2025: Successfully imported 330-member family tree with Arabic names and relationships

## User Preferences

Preferred communication style: Simple, everyday language.