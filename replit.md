# Soar TV - Free Streaming Platform

## Overview

Soar TV is a Netflix-style streaming platform built with React, Express, and PostgreSQL. The application provides a modern video streaming experience with a hero banner, category browsing, video grid displays, and a modal video player. It features a full-stack architecture with a REST API backend and a responsive frontend using shadcn/ui components.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and production builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives via shadcn/ui for consistent, accessible components

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript throughout the stack
- **API Style**: RESTful API with JSON responses
- **Development**: tsx for TypeScript execution in development

### Component Structure
- Modular component architecture with reusable UI components
- Custom components for video streaming features (hero banner, video grid, player modal)
- Shared schema definitions between client and server

## Key Components

### Database Layer
- **Primary Database**: Firebase Firestore for real-time data storage
- **Authentication**: Firebase Authentication for user management
- **File Storage**: Firebase Storage for media assets
- **Collections**:
  - `projects`: User-uploaded content with metadata
  - `users`: User profiles and preferences
  - `posts`: Social feed content
- **Storage Structure**:
  - `posters/`: Movie/project poster images
  - `videos/`: Video file uploads
- **Legacy Schema**: Drizzle ORM schema in `shared/schema.ts` for local development

### Data Storage Architecture
**Firebase Integration:**
- **Firestore Users Collection**: Each user document contains:
  ```javascript
  // Path: users/{uid}
  {
    name: string,
    bio: string,
    role: string,
    profilePhotoUrl?: string, // Link to Firebase Storage
    featuredProjects?: string[] // Array of project IDs
  }
  ```
- **Firestore Projects Collection**: Each project document contains:
  ```javascript
  {
    userId: "uid123",
    title: "My Film", 
    genre: "Drama",
    description: "A story of love and survival.",
    posterURL: "firebase_storage_url",
    videoURL: "firebase_storage_url", 
    createdAt: Timestamp,
    cast: ["Actor 1", "Actor 2"],
    crew: ["Director", "Producer"],
    tags: ["drama", "indie"]
  }
  ```
- **Firebase Storage Paths**:
  - `posters/`: User-uploaded poster images
  - `videos/`: User-uploaded video files

**API Endpoints:**
- `GET /api/videos` - Retrieve sample videos for demo
- Local development uses in-memory storage for rapid prototyping

### Frontend Features
- **Hero Banner**: Rotating featured content with auto-advancing slides
- **Category Navigation**: Filter content by genre/category
- **Video Grid**: Responsive grid layout for content browsing
- **Video Player Modal**: Full-screen video playback with controls
- **TV Shows Section**: Dedicated section for TV series content
- **Responsive Design**: Mobile-first design with Tailwind CSS

### Storage Strategy
The application implements a flexible storage interface (`IStorage`) with two implementations:
- **Development**: In-memory storage with sample data for rapid prototyping
- **Production**: Database storage using Drizzle ORM (ready for PostgreSQL integration)

## Data Flow

1. **Content Loading**: React components use TanStack Query to fetch video data from REST API
2. **Category Filtering**: Client-side state manages selected category, triggering API calls for filtered content
3. **Video Playback**: Modal system handles video player overlay with support for multiple video formats
4. **State Management**: Server state cached and synchronized via React Query, local UI state managed with React hooks

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver for serverless environments
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **@tanstack/react-query**: Server state management and caching
- **express**: Web framework for Node.js backend

### UI and Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Utility for creating variant-based component APIs
- **lucide-react**: Icon library for consistent iconography

### Development Tools
- **tsx**: TypeScript execution for Node.js development
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development tools and error handling

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev` starts both client and server in development mode
- **Port**: Application runs on port 5000 with hot reloading
- **Database**: Uses in-memory storage for quick development cycles

### Production Build
- **Build Process**: `npm run build` creates optimized client bundle and server distribution
- **Client**: Vite builds optimized React application to `dist/public`
- **Server**: esbuild bundles Express server to `dist/index.js`
- **Deployment**: Configured for Replit's autoscale deployment target

### Database Setup
- **Migrations**: Drizzle Kit manages database schema migrations in `migrations/` directory
- **Environment**: Requires `DATABASE_URL` environment variable for PostgreSQL connection
- **Schema Push**: `npm run db:push` applies schema changes to database

## Changelog
- August 22, 2025: Complete Public/Private Project Visibility System Implementation
  - **Comprehensive Privacy Controls**: Added complete visibility system allowing users to set projects as Public or Private with default Private for user protection
  - **Project Visibility Toggle UI**: Interactive button-based visibility controls in ProjectCard with green (Public) and red (Private) color coding for clear status indication
  - **Privacy-First Default**: All new projects default to Private visibility, protecting user content until explicitly made public  
  - **Discovery Feed Filtering**: getBrowseVideos function filters for visibility="public" in all Firestore queries ensuring only public content appears in Browse page
  - **Community Feed Privacy**: Feed component filters out private project posts from social feed, maintaining privacy across all public-facing components
  - **User Profile Separation**: UserPublicProfile shows only public projects from other users, while UserProfile shows all projects (public/private) to logged-in owner
  - **Watch Page Privacy**: Related videos suggestions include only public content, preventing private project exposure
  - **Social Post Control**: createProjectPost only creates community feed posts for public projects, private projects skip automatic social sharing
  - **Real-time Visibility Switching**: Toggle functionality with immediate Firestore updates and local state synchronization for instant feedback
  - **Database Schema Enhancement**: Added visibility field with "private" default throughout project collection for comprehensive privacy protection
- August 22, 2025: Complete Visibility Control System Implementation
  - **Project Visibility Toggle UI**: Added interactive button-based visibility controls in ProjectCard with green/red color coding
  - **Comprehensive Privacy Filtering**: Implemented visibility="public" filtering across all public-facing components
  - **Browse Page Protection**: getBrowseVideos function filters for public projects only in Firestore queries
  - **Feed Privacy Controls**: Community feed shows only public project posts, private projects completely hidden
  - **User Profile Separation**: UserPublicProfile shows only public projects from other users, while UserProfile shows all projects to owner
  - **Related Videos Filtering**: Watch page suggestions include only public content
  - **Owner Access Preservation**: Profile and upload pages show all projects (public/private) to logged-in users
  - **Database Schema Enhancement**: Added visibility field with "private" default for user privacy protection
  - **Toggle Functionality**: Real-time visibility switching with Firestore updates and local state synchronization
- August 22, 2025: Complete Profile and Upload System Implementation
  - **Enhanced UserProfile Component**: Updated UserProfile.tsx with onAuthStateChanged listener for real-time auth state management
  - **Dual Project Query Support**: Added support for both 'owner' and 'userId' fields in Firestore projects collection for backwards compatibility
  - **Better Error Handling**: Enhanced project fetching with try-catch blocks and proper error logging
  - **Professional Profile Dropdown**: Created ProfileMenu component with user avatar and navigation options
  - **Streamlined Navigation**: Integrated ProfileMenu into PrimeNavbar replacing individual profile buttons
  - **Enhanced User Experience**: Added proper loading states and fallback handling throughout profile system
  - **Firestore Schema Update**: Standardized users collection structure with profilePhotoUrl field for Firebase Storage integration
  - **Profile Editing System**: Implemented comprehensive profile editing with live preview and proper data validation
  - **Profile Photo Upload**: Added Firebase Storage integration for profile photos at profilePhotos/{uid} path
  - **Public Profile Pages**: Created UserPublicProfile.tsx for viewing other users' profiles and projects
  - **Profile Linking System**: Added clickable profile links throughout Feed, Browse, and Watch pages
  - **Upload Route Aliases**: Added both /upload-project and /upload routes for project upload functionality
  - **Enhanced Project Display**: Updated UserProfile.tsx to query projects using 'uploadedBy' field with backward compatibility for 'owner' and 'userId' fields
  - **Complete Project Management**: Added edit/delete functionality with professional UI components
  - **EditProjectModal Component**: Comprehensive modal for editing project details, uploading new files, with Firebase integration
  - **Delete Confirmation System**: Secure project deletion with user confirmation and proper cleanup from Firestore and local state
- August 21, 2025: Fixed Application Startup and Firebase Integration
  - **Amazon Prime-Style Browse Page**: Categories, filtering, sorting with grid/list views and pagination
  - **Professional Watch Page**: Full video player with controls, related videos sidebar, creator profiles
  - **Intelligent Recommendation Engine**: Genre matching, role compatibility, activity scoring with 100-point algorithm
  - **Professional Profile System**: Complete filmmaker profiles with image uploads, bio editing, portfolio links
  - **Project Upload Feature**: Video/image uploads to Firebase Storage with cast, crew, tags, and metadata
  - **Social Community Feed**: Facebook/LinkedIn-style feed showing recent projects and filmmaker updates
  - **Firebase Storage Architecture**: Complete file upload system with posters/ and videos/ directories
  - **Firestore Projects Collection**: Structured document storage with userId, title, genre, description, posterURL, videoURL, createdAt
  - **Application Startup Fix**: Resolved JSX parsing errors by removing duplicate .js files and explicit React imports
  - **React Import Optimization**: Updated components to use direct imports instead of React namespace for Vite compatibility
  - **Navigation Updates**: Added Browse, Community, and Discover tabs to main navigation
  - **Auto-Post Creation**: Projects automatically create social feed posts when uploaded
  - Complete authentication system with enhanced UI
  - Redesigned login page with SoarTV gradient background and styled components
  - Added Google Sign-In functionality with professional branding and OAuth popup
  - Implemented smart user flow - new users to preferences, returning users to dashboard
  - Enhanced error handling for authentication failures and pop-up blockers
  - Firebase API key configuration working properly
  - Email verification automatically sent after signup
  - User data properly saved to Firestore
  - Profile setup flow ready for user onboarding
- June 24, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.