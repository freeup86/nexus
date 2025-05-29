-- Migration: Create DIY Project Tracker Tables
-- Description: Adds tables for DIY project management, photo documentation, supplies, and community features
-- Date: 2025-01-27

-- Create DIYProjects table
CREATE TABLE DIYProjects (
    id NVARCHAR(1000) PRIMARY KEY DEFAULT NEWID(),
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

-- Create ProjectSupplies table
CREATE TABLE ProjectSupplies (
    id NVARCHAR(1000) PRIMARY KEY DEFAULT NEWID(),
    projectId NVARCHAR(1000) NOT NULL,
    itemName NVARCHAR(255) NOT NULL,
    category NVARCHAR(100), -- 'lumber', 'hardware', 'paint', 'tools', etc.
    quantity DECIMAL(10,2),
    unit NVARCHAR(50), -- 'pieces', 'feet', 'gallons', etc.
    estimatedCost DECIMAL(10,2),
    actualCost DECIMAL(10,2),
    isOwned BIT DEFAULT 0,
    isPurchased BIT DEFAULT 0,
    supplier NVARCHAR(255),
    purchaseUrl NVARCHAR(500),
    notes NVARCHAR(MAX),
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE
);

-- Create ProjectPhotos table
CREATE TABLE ProjectPhotos (
    id NVARCHAR(1000) PRIMARY KEY DEFAULT NEWID(),
    projectId NVARCHAR(1000) NOT NULL,
    fileName NVARCHAR(255) NOT NULL,
    filePath NVARCHAR(500) NOT NULL,
    fileSize INT, -- in bytes
    photoType NVARCHAR(50), -- 'progress', 'before', 'after', 'issue', 'completed'
    stepNumber INT,
    caption NVARCHAR(MAX),
    voiceNote NVARCHAR(MAX), -- transcribed voice-to-text
    aiAnalysis NVARCHAR(MAX), -- JSON with AI insights
    thumbnailPath NVARCHAR(500),
    takenAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE
);

-- Create ProjectMilestones table
CREATE TABLE ProjectMilestones (
    id NVARCHAR(1000) PRIMARY KEY DEFAULT NEWID(),
    projectId NVARCHAR(1000) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    estimatedDuration INT, -- in hours
    actualDuration INT,
    stepOrder INT,
    status NVARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'skipped'
    dependencies NVARCHAR(MAX), -- JSON array of dependent milestone IDs
    completedAt DATETIME2,
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE
);

-- Create ProjectIssues table
CREATE TABLE ProjectIssues (
    id NVARCHAR(1000) PRIMARY KEY DEFAULT NEWID(),
    projectId NVARCHAR(1000) NOT NULL,
    photoId NVARCHAR(1000),
    issueType NVARCHAR(100), -- 'measurement_error', 'material_defect', 'tool_problem', 'technique_issue'
    description NVARCHAR(MAX),
    severity NVARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    status NVARCHAR(50) DEFAULT 'open', -- 'open', 'resolved', 'ignored', 'in_progress'
    aiDetected BIT DEFAULT 0,
    aiSuggestions NVARCHAR(MAX), -- JSON with AI-generated solutions
    resolution NVARCHAR(MAX),
    createdAt DATETIME2 DEFAULT GETDATE(),
    resolvedAt DATETIME2,
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE,
    FOREIGN KEY (photoId) REFERENCES ProjectPhotos(id)
);

-- Create CommunityShares table
CREATE TABLE CommunityShares (
    id NVARCHAR(1000) PRIMARY KEY DEFAULT NEWID(),
    projectId NVARCHAR(1000) NOT NULL,
    userId NVARCHAR(1000) NOT NULL,
    title NVARCHAR(255),
    description NVARCHAR(MAX),
    tags NVARCHAR(MAX), -- JSON array of tags
    isPublic BIT DEFAULT 1,
    viewCount INT DEFAULT 0,
    likeCount INT DEFAULT 0,
    allowComments BIT DEFAULT 1,
    featuredPhotoId NVARCHAR(1000),
    sharedAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES [User](id),
    FOREIGN KEY (featuredPhotoId) REFERENCES ProjectPhotos(id)
);

-- Create UserInventory table
CREATE TABLE UserInventory (
    id NVARCHAR(1000) PRIMARY KEY DEFAULT NEWID(),
    userId NVARCHAR(1000) NOT NULL,
    itemName NVARCHAR(255) NOT NULL,
    category NVARCHAR(100),
    quantity DECIMAL(10,2),
    unit NVARCHAR(50),
    location NVARCHAR(255), -- 'garage', 'basement', 'shed', etc.
    purchaseDate DATE,
    purchasePrice DECIMAL(10,2),
    expirationDate DATE,
    condition NVARCHAR(50), -- 'new', 'good', 'fair', 'poor'
    isAvailableForLending BIT DEFAULT 0,
    notes NVARCHAR(MAX),
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE CASCADE
);

-- Create ProjectTools table
CREATE TABLE ProjectTools (
    id NVARCHAR(1000) PRIMARY KEY DEFAULT NEWID(),
    projectId NVARCHAR(1000) NOT NULL,
    toolName NVARCHAR(255) NOT NULL,
    toolType NVARCHAR(100), -- 'power_tool', 'hand_tool', 'measuring', 'safety'
    isRequired BIT DEFAULT 1,
    isOwned BIT DEFAULT 0,
    rentalCost DECIMAL(10,2),
    purchaseCost DECIMAL(10,2),
    alternativeSuggestions NVARCHAR(MAX), -- JSON array of alternatives
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE
);

-- Create HelpRequests table
CREATE TABLE HelpRequests (
    id NVARCHAR(1000) PRIMARY KEY DEFAULT NEWID(),
    projectId NVARCHAR(1000) NOT NULL,
    userId NVARCHAR(1000) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    requestType NVARCHAR(100), -- 'technique', 'tool_use', 'material_choice', 'troubleshooting'
    status NVARCHAR(50) DEFAULT 'open', -- 'open', 'answered', 'resolved', 'closed'
    photoId NVARCHAR(1000),
    createdAt DATETIME2 DEFAULT GETDATE(),
    resolvedAt DATETIME2,
    FOREIGN KEY (projectId) REFERENCES DIYProjects(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES [User](id),
    FOREIGN KEY (photoId) REFERENCES ProjectPhotos(id)
);

-- Create HelpResponses table
CREATE TABLE HelpResponses (
    id NVARCHAR(1000) PRIMARY KEY DEFAULT NEWID(),
    requestId NVARCHAR(1000) NOT NULL,
    userId NVARCHAR(1000) NOT NULL,
    responseText NVARCHAR(MAX),
    isAcceptedAnswer BIT DEFAULT 0,
    helpfulCount INT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (requestId) REFERENCES HelpRequests(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES [User](id)
);

-- Create ProjectComments table
CREATE TABLE ProjectComments (
    id NVARCHAR(1000) PRIMARY KEY DEFAULT NEWID(),
    shareId NVARCHAR(1000) NOT NULL,
    userId NVARCHAR(1000) NOT NULL,
    commentText NVARCHAR(MAX),
    parentCommentId NVARCHAR(1000), -- for nested comments
    likeCount INT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (shareId) REFERENCES CommunityShares(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES [User](id),
    FOREIGN KEY (parentCommentId) REFERENCES ProjectComments(id)
);

-- Create ProjectLikes table
CREATE TABLE ProjectLikes (
    id NVARCHAR(1000) PRIMARY KEY DEFAULT NEWID(),
    shareId NVARCHAR(1000) NOT NULL,
    userId NVARCHAR(1000) NOT NULL,
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (shareId) REFERENCES CommunityShares(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES [User](id),
    CONSTRAINT UQ_ProjectLikes_User_Share UNIQUE(shareId, userId) -- One like per user per share
);

-- Create indexes for better performance
CREATE INDEX IX_DIYProjects_UserId ON DIYProjects(userId);
CREATE INDEX IX_DIYProjects_Status ON DIYProjects(status);
CREATE INDEX IX_ProjectSupplies_ProjectId ON ProjectSupplies(projectId);
CREATE INDEX IX_ProjectPhotos_ProjectId ON ProjectPhotos(projectId);
CREATE INDEX IX_ProjectMilestones_ProjectId ON ProjectMilestones(projectId);
CREATE INDEX IX_CommunityShares_ProjectId ON CommunityShares(projectId);
CREATE INDEX IX_UserInventory_UserId ON UserInventory(userId);
CREATE INDEX IX_HelpRequests_ProjectId ON HelpRequests(projectId);
CREATE INDEX IX_HelpRequests_Status ON HelpRequests(status);