-- Migration: Create DIY Project Tracker Tables
-- Description: Adds tables for DIY project management, photo documentation, supplies, and community features
-- Date: 2025-01-27

-- Create DIYProjects table
CREATE TABLE DIYProjects (
    ProjectId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    ProjectType NVARCHAR(100), -- 'woodworking', 'plumbing', 'electrical', etc.
    DifficultyLevel NVARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
    Status NVARCHAR(50) DEFAULT 'planning', -- 'planning', 'active', 'completed', 'paused'
    EstimatedDuration INT, -- in hours
    ActualDuration INT, -- in hours
    EstimatedCost DECIMAL(10,2),
    ActualCost DECIMAL(10,2),
    ProgressPercentage INT DEFAULT 0,
    StartDate DATETIME2,
    CompletionDate DATETIME2,
    AIProjectPlan NVARCHAR(MAX), -- JSON with AI-generated plan
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);

-- Create ProjectSupplies table
CREATE TABLE ProjectSupplies (
    SupplyId INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId INT NOT NULL,
    ItemName NVARCHAR(255) NOT NULL,
    Category NVARCHAR(100), -- 'lumber', 'hardware', 'paint', 'tools', etc.
    Quantity DECIMAL(10,2),
    Unit NVARCHAR(50), -- 'pieces', 'feet', 'gallons', etc.
    EstimatedCost DECIMAL(10,2),
    ActualCost DECIMAL(10,2),
    IsOwned BIT DEFAULT 0,
    IsPurchased BIT DEFAULT 0,
    Supplier NVARCHAR(255),
    PurchaseUrl NVARCHAR(500),
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ProjectId) REFERENCES DIYProjects(ProjectId) ON DELETE CASCADE
);

-- Create ProjectPhotos table
CREATE TABLE ProjectPhotos (
    PhotoId INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId INT NOT NULL,
    FileName NVARCHAR(255) NOT NULL,
    FilePath NVARCHAR(500) NOT NULL,
    FileSize INT, -- in bytes
    PhotoType NVARCHAR(50), -- 'progress', 'before', 'after', 'issue', 'completed'
    StepNumber INT,
    Caption NVARCHAR(MAX),
    VoiceNote NVARCHAR(MAX), -- transcribed voice-to-text
    AIAnalysis NVARCHAR(MAX), -- JSON with AI insights
    ThumbnailPath NVARCHAR(500),
    TakenAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ProjectId) REFERENCES DIYProjects(ProjectId) ON DELETE CASCADE
);

-- Create ProjectMilestones table
CREATE TABLE ProjectMilestones (
    MilestoneId INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    EstimatedDuration INT, -- in hours
    ActualDuration INT,
    StepOrder INT,
    Status NVARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'skipped'
    Dependencies NVARCHAR(MAX), -- JSON array of dependent milestone IDs
    CompletedAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ProjectId) REFERENCES DIYProjects(ProjectId) ON DELETE CASCADE
);

-- Create ProjectIssues table
CREATE TABLE ProjectIssues (
    IssueId INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId INT NOT NULL,
    PhotoId INT,
    IssueType NVARCHAR(100), -- 'measurement_error', 'material_defect', 'tool_problem', 'technique_issue'
    Description NVARCHAR(MAX),
    Severity NVARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    Status NVARCHAR(50) DEFAULT 'open', -- 'open', 'resolved', 'ignored', 'in_progress'
    AIDetected BIT DEFAULT 0,
    AISuggestions NVARCHAR(MAX), -- JSON with AI-generated solutions
    Resolution NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    ResolvedAt DATETIME2,
    FOREIGN KEY (ProjectId) REFERENCES DIYProjects(ProjectId) ON DELETE CASCADE,
    FOREIGN KEY (PhotoId) REFERENCES ProjectPhotos(PhotoId)
);

-- Create CommunityShares table
CREATE TABLE CommunityShares (
    ShareId INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId INT NOT NULL,
    UserId INT NOT NULL,
    Title NVARCHAR(255),
    Description NVARCHAR(MAX),
    Tags NVARCHAR(MAX), -- JSON array of tags
    IsPublic BIT DEFAULT 1,
    ViewCount INT DEFAULT 0,
    LikeCount INT DEFAULT 0,
    AllowComments BIT DEFAULT 1,
    FeaturedPhotoId INT,
    SharedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ProjectId) REFERENCES DIYProjects(ProjectId) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (FeaturedPhotoId) REFERENCES ProjectPhotos(PhotoId)
);

-- Create UserInventory table
CREATE TABLE UserInventory (
    InventoryId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    ItemName NVARCHAR(255) NOT NULL,
    Category NVARCHAR(100),
    Quantity DECIMAL(10,2),
    Unit NVARCHAR(50),
    Location NVARCHAR(255), -- 'garage', 'basement', 'shed', etc.
    PurchaseDate DATE,
    PurchasePrice DECIMAL(10,2),
    ExpirationDate DATE,
    Condition NVARCHAR(50), -- 'new', 'good', 'fair', 'poor'
    IsAvailableForLending BIT DEFAULT 0,
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);

-- Create ProjectTools table
CREATE TABLE ProjectTools (
    ToolId INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId INT NOT NULL,
    ToolName NVARCHAR(255) NOT NULL,
    ToolType NVARCHAR(100), -- 'power_tool', 'hand_tool', 'measuring', 'safety'
    IsRequired BIT DEFAULT 1,
    IsOwned BIT DEFAULT 0,
    RentalCost DECIMAL(10,2),
    PurchaseCost DECIMAL(10,2),
    AlternativeSuggestions NVARCHAR(MAX), -- JSON array of alternatives
    FOREIGN KEY (ProjectId) REFERENCES DIYProjects(ProjectId) ON DELETE CASCADE
);

-- Create HelpRequests table
CREATE TABLE HelpRequests (
    RequestId INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId INT NOT NULL,
    UserId INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    RequestType NVARCHAR(100), -- 'technique', 'tool_use', 'material_choice', 'troubleshooting'
    Status NVARCHAR(50) DEFAULT 'open', -- 'open', 'answered', 'resolved', 'closed'
    PhotoId INT,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    ResolvedAt DATETIME2,
    FOREIGN KEY (ProjectId) REFERENCES DIYProjects(ProjectId) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (PhotoId) REFERENCES ProjectPhotos(PhotoId)
);

-- Create HelpResponses table
CREATE TABLE HelpResponses (
    ResponseId INT IDENTITY(1,1) PRIMARY KEY,
    RequestId INT NOT NULL,
    UserId INT NOT NULL,
    ResponseText NVARCHAR(MAX),
    IsAcceptedAnswer BIT DEFAULT 0,
    HelpfulCount INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (RequestId) REFERENCES HelpRequests(RequestId) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Create ProjectComments table
CREATE TABLE ProjectComments (
    CommentId INT IDENTITY(1,1) PRIMARY KEY,
    ShareId INT NOT NULL,
    UserId INT NOT NULL,
    CommentText NVARCHAR(MAX),
    ParentCommentId INT, -- for nested comments
    LikeCount INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ShareId) REFERENCES CommunityShares(ShareId) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (ParentCommentId) REFERENCES ProjectComments(CommentId)
);

-- Create ProjectLikes table
CREATE TABLE ProjectLikes (
    LikeId INT IDENTITY(1,1) PRIMARY KEY,
    ShareId INT NOT NULL,
    UserId INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ShareId) REFERENCES CommunityShares(ShareId) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    UNIQUE(ShareId, UserId) -- One like per user per share
);

-- Create indexes for better performance
CREATE INDEX IX_DIYProjects_UserId ON DIYProjects(UserId);
CREATE INDEX IX_DIYProjects_Status ON DIYProjects(Status);
CREATE INDEX IX_ProjectSupplies_ProjectId ON ProjectSupplies(ProjectId);
CREATE INDEX IX_ProjectPhotos_ProjectId ON ProjectPhotos(ProjectId);
CREATE INDEX IX_ProjectMilestones_ProjectId ON ProjectMilestones(ProjectId);
CREATE INDEX IX_CommunityShares_ProjectId ON CommunityShares(ProjectId);
CREATE INDEX IX_UserInventory_UserId ON UserInventory(UserId);
CREATE INDEX IX_HelpRequests_ProjectId ON HelpRequests(ProjectId);
CREATE INDEX IX_HelpRequests_Status ON HelpRequests(Status);

-- Add stored procedures for common operations
GO

-- Procedure to update project progress
CREATE PROCEDURE UpdateProjectProgress
    @ProjectId INT
AS
BEGIN
    DECLARE @TotalMilestones INT;
    DECLARE @CompletedMilestones INT;
    DECLARE @Progress INT;
    
    SELECT @TotalMilestones = COUNT(*)
    FROM ProjectMilestones
    WHERE ProjectId = @ProjectId;
    
    SELECT @CompletedMilestones = COUNT(*)
    FROM ProjectMilestones
    WHERE ProjectId = @ProjectId AND Status = 'completed';
    
    IF @TotalMilestones > 0
        SET @Progress = (@CompletedMilestones * 100) / @TotalMilestones;
    ELSE
        SET @Progress = 0;
    
    UPDATE DIYProjects
    SET ProgressPercentage = @Progress,
        UpdatedAt = GETDATE()
    WHERE ProjectId = @ProjectId;
END;
GO

-- Procedure to calculate actual project cost
CREATE PROCEDURE CalculateActualProjectCost
    @ProjectId INT
AS
BEGIN
    DECLARE @TotalCost DECIMAL(10,2);
    
    SELECT @TotalCost = SUM(ActualCost)
    FROM ProjectSupplies
    WHERE ProjectId = @ProjectId AND IsPurchased = 1;
    
    UPDATE DIYProjects
    SET ActualCost = ISNULL(@TotalCost, 0),
        UpdatedAt = GETDATE()
    WHERE ProjectId = @ProjectId;
END;
GO