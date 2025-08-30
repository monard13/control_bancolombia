# FinanceTracker - Personal Finance Management Application

## Overview

FinanceTracker is a full-stack personal finance management application that allows users to track income and expenses, upload receipts with automatic OCR and AI data extraction, and view financial summaries. The application features a modern React frontend with a comprehensive UI component library and an Express.js backend with PostgreSQL database integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and API caching
- **UI Framework**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **File Handling**: Multer for multipart form data and file uploads
- **Image Processing**: Sharp for image optimization and preprocessing
- **OCR Processing**: Tesseract.js for optical character recognition of receipt images
- **AI Integration**: OpenAI GPT-5 for intelligent transaction data extraction from OCR text

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon Database serverless deployment (fully configured and operational)
- **Database Schema**: Two main entities - users and transactions with UUID primary keys
- **Schema Management**: Drizzle Kit for database migrations and schema synchronization
- **Storage Implementation**: DatabaseStorage class using Drizzle ORM for all CRUD operations
- **Session Storage**: Connect-pg-simple for PostgreSQL-based session management
- **Object Storage**: Google Cloud Storage integration for receipt image storage with custom ACL policy management

### Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL store
- **Object Access Control**: Custom ACL policy system for controlling access to stored receipts
- **User Authentication**: Username/password based authentication with hashed passwords

### External Dependencies

#### Core Dependencies
- **Database**: Neon Database (serverless PostgreSQL)
- **AI Service**: OpenAI API (GPT-5) for transaction data extraction
- **Object Storage**: Google Cloud Storage for receipt file storage
- **OCR Service**: Tesseract.js for text extraction from images

#### Development Tools
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **Type Safety**: Shared TypeScript schemas between frontend and backend
- **Styling**: Tailwind CSS with custom design system variables
- **Component Library**: Extensive Radix UI component collection through Shadcn/ui

#### Key Features
- **Receipt Processing Pipeline**: Upload → OCR → AI Analysis → Data Extraction → User Confirmation
- **Financial Dashboard**: Real-time summary cards showing balance, income, and expenses
- **Transaction Management**: Full CRUD operations with filtering and pagination
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Real-time Updates**: Optimistic updates and background synchronization

The application follows a modern full-stack architecture with strong separation of concerns, comprehensive type safety, and scalable data processing capabilities for financial document management.