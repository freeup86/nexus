-- Migration: Fix DIY Project Tracker ID columns to use UNIQUEIDENTIFIER
-- Description: Changes ID columns from NVARCHAR to UNIQUEIDENTIFIER for proper GUID generation
-- Date: 2025-01-27

-- Drop existing foreign key constraints first
IF OBJECT_ID('FK__ProjectPh__proje__XXXXXXXX', 'F') IS NOT NULL
    ALTER TABLE ProjectPhotos DROP CONSTRAINT FK__ProjectPh__proje__XXXXXXXX;

IF OBJECT_ID('FK__ProjectMi__proje__XXXXXXXX', 'F') IS NOT NULL  
    ALTER TABLE ProjectMilestones DROP CONSTRAINT FK__ProjectMi__proje__XXXXXXXX;

IF OBJECT_ID('FK__ProjectSu__proje__XXXXXXXX', 'F') IS NOT NULL
    ALTER TABLE ProjectSupplies DROP CONSTRAINT FK__ProjectSu__proje__XXXXXXXX;

IF OBJECT_ID('FK__ProjectIs__proje__XXXXXXXX', 'F') IS NOT NULL
    ALTER TABLE ProjectIssues DROP CONSTRAINT FK__ProjectIs__proje__XXXXXXXX;

IF OBJECT_ID('FK__ProgressT__proje__XXXXXXXX', 'F') IS NOT NULL
    ALTER TABLE ProgressTracking DROP CONSTRAINT FK__ProgressT__proje__XXXXXXXX;

IF OBJECT_ID('FK__ProgressT__miles__XXXXXXXX', 'F') IS NOT NULL
    ALTER TABLE ProgressTracking DROP CONSTRAINT FK__ProgressT__miles__XXXXXXXX;

IF OBJECT_ID('FK__Community__proje__XXXXXXXX', 'F') IS NOT NULL
    ALTER TABLE CommunityShares DROP CONSTRAINT FK__Community__proje__XXXXXXXX;

IF OBJECT_ID('FK__ProjectLi__proje__XXXXXXXX', 'F') IS NOT NULL
    ALTER TABLE ProjectLikes DROP CONSTRAINT FK__ProjectLi__proje__XXXXXXXX;

IF OBJECT_ID('FK__ProjectCo__proje__XXXXXXXX', 'F') IS NOT NULL
    ALTER TABLE ProjectComments DROP CONSTRAINT FK__ProjectCo__proje__XXXXXXXX;

IF OBJECT_ID('FK__ProjectLe__proje__XXXXXXXX', 'F') IS NOT NULL
    ALTER TABLE ProjectLessonsLearned DROP CONSTRAINT FK__ProjectLe__proje__XXXXXXXX;

-- Drop dependent tables temporarily (we'll recreate them)
DROP TABLE IF EXISTS ProjectLessonsLearned;
DROP TABLE IF EXISTS ProjectComments;
DROP TABLE IF EXISTS ProjectLikes;
DROP TABLE IF EXISTS CommunityShares;
DROP TABLE IF EXISTS ProgressTracking;
DROP TABLE IF EXISTS ProjectIssues;
DROP TABLE IF EXISTS ProjectSupplies;
DROP TABLE IF EXISTS ProjectMilestones;
DROP TABLE IF EXISTS ProjectPhotos;
DROP TABLE IF EXISTS DIYProjects;

-- Recreate DIYProjects table with proper UNIQUEIDENTIFIER
CREATE TABLE DIYProjects (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    userId NVARCHAR(1000) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    projectType NVARCHAR(100), -- 'woodworking', 'plumbing', 'electrical', etc.
    difficultyLevel NVARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
    status NVARCHAR(50) DEFAULT 'planning', -- 'planning', 'active', 'completed', 'paused'
    estimatedDuration INT, -- in hours
    actualDuration INT, -- in hours
    estimatedCost DECIMAL(10,2),
    actualCost DECIMAL(10,2),
    progressPercentage INT DEFAULT 0,
    startDate DATETIME2,
    completionDate DATETIME2,
    aiProjectPlan NVARCHAR(MAX), -- JSON with AI-generated plan
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE CASCADE
);

-- Recreate ProjectSupplies table
CREATE TABLE ProjectSupplies (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    projectId UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    estimatedCost DECIMAL(10,2),
    actualCost DECIMAL(10,2),
    supplier NVARCHAR(255),
    isPurchased BIT DEFAULT 0,
    isOwned BIT DEFAULT 0,
    notes NVARCHAR(MAX),
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE
);

-- Recreate ProjectPhotos table
CREATE TABLE ProjectPhotos (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    projectId UNIQUEIDENTIFIER NOT NULL,
    fileName NVARCHAR(500) NOT NULL,
    originalFileName NVARCHAR(500),
    photoType NVARCHAR(50), -- 'before', 'progress', 'after', 'issue'
    caption NVARCHAR(MAX),
    takenAt DATETIME2 DEFAULT GETDATE(),
    uploadedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE
);

-- Recreate ProjectMilestones table
CREATE TABLE ProjectMilestones (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    projectId UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    estimatedDuration INT, -- in hours
    actualDuration INT, -- in hours
    status NVARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    stepOrder INT,
    completedAt DATETIME2,
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE
);

-- Recreate ProjectIssues table
CREATE TABLE ProjectIssues (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    projectId UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    severity NVARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    status NVARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved'
    photoId UNIQUEIDENTIFIER,
    aiSuggestion NVARCHAR(MAX),
    resolution NVARCHAR(MAX),
    reportedAt DATETIME2 DEFAULT GETDATE(),
    resolvedAt DATETIME2,
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE,
    FOREIGN KEY (photoId) REFERENCES ProjectPhotos(id) ON DELETE SET NULL
);

-- Recreate ProgressTracking table
CREATE TABLE ProgressTracking (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    projectId UNIQUEIDENTIFIER NOT NULL,
    milestoneId UNIQUEIDENTIFIER,
    progressType NVARCHAR(50), -- 'milestone_completed', 'time_logged', 'cost_updated'
    hoursWorked DECIMAL(5,2),
    costIncurred DECIMAL(10,2),
    notes NVARCHAR(MAX),
    loggedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE,
    FOREIGN KEY (milestoneId) REFERENCES ProjectMilestones(id) ON DELETE SET NULL
);

-- Recreate CommunityShares table
CREATE TABLE CommunityShares (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    projectId UNIQUEIDENTIFIER NOT NULL,
    isPublic BIT DEFAULT 0,
    shareDescription NVARCHAR(MAX),
    tags NVARCHAR(500), -- Comma-separated tags
    sharedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE
);

-- Recreate ProjectLikes table
CREATE TABLE ProjectLikes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    projectId UNIQUEIDENTIFIER NOT NULL,
    userId NVARCHAR(1000) NOT NULL,
    likedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE CASCADE,
    UNIQUE(projectId, userId)
);

-- Recreate ProjectComments table
CREATE TABLE ProjectComments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    projectId UNIQUEIDENTIFIER NOT NULL,
    userId NVARCHAR(1000) NOT NULL,
    comment NVARCHAR(MAX) NOT NULL,
    parentCommentId UNIQUEIDENTIFIER,
    commentedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE CASCADE,
    FOREIGN KEY (parentCommentId) REFERENCES ProjectComments(id) ON DELETE NO ACTION
);

-- Recreate ProjectLessonsLearned table
CREATE TABLE ProjectLessonsLearned (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    projectId UNIQUEIDENTIFIER NOT NULL,
    lesson NVARCHAR(MAX) NOT NULL,
    category NVARCHAR(100), -- 'technique', 'planning', 'cost', 'time', 'tools'
    difficulty NVARCHAR(50), -- 'easy', 'medium', 'hard'
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IX_DIYProjects_UserId ON DIYProjects(userId);
CREATE INDEX IX_DIYProjects_Status ON DIYProjects(status);
CREATE INDEX IX_ProjectPhotos_ProjectId ON ProjectPhotos(projectId);
CREATE INDEX IX_ProjectMilestones_ProjectId ON ProjectMilestones(projectId);
CREATE INDEX IX_ProjectSupplies_ProjectId ON ProjectSupplies(projectId);
CREATE INDEX IX_ProjectIssues_ProjectId ON ProjectIssues(projectId);
CREATE INDEX IX_ProgressTracking_ProjectId ON ProgressTracking(projectId);