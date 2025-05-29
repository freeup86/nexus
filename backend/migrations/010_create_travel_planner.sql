-- Migration: Create Travel & Trip Planner Tables
-- Description: Adds tables for travel planning, itineraries, budgets, packing lists, and trip management
-- Date: 2025-01-28

-- Create Trips table
CREATE TABLE Trips (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    userId NVARCHAR(1000) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    destination NVARCHAR(255) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    status NVARCHAR(50) DEFAULT 'planning', -- 'planning', 'booked', 'ongoing', 'completed', 'cancelled'
    tripType NVARCHAR(50), -- 'leisure', 'business', 'family', 'adventure', 'romantic'
    totalBudget DECIMAL(10,2),
    actualSpent DECIMAL(10,2) DEFAULT 0,
    currency NVARCHAR(3) DEFAULT 'USD',
    coverPhoto NVARCHAR(500),
    isPublic BIT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE CASCADE
);

-- Create TripItineraries table
CREATE TABLE TripItineraries (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tripId UNIQUEIDENTIFIER NOT NULL,
    dayNumber INT NOT NULL,
    date DATE NOT NULL,
    title NVARCHAR(255),
    description NVARCHAR(MAX),
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (tripId) REFERENCES Trips(id) ON DELETE CASCADE
);

-- Create ItineraryItems table
CREATE TABLE ItineraryItems (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    itineraryId UNIQUEIDENTIFIER NOT NULL,
    startTime TIME,
    endTime TIME,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    location NVARCHAR(500),
    address NVARCHAR(500),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    category NVARCHAR(50), -- 'transport', 'accommodation', 'activity', 'meal', 'sightseeing'
    cost DECIMAL(10,2),
    bookingReference NVARCHAR(255),
    bookingUrl NVARCHAR(500),
    notes NVARCHAR(MAX),
    itemOrder INT,
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (itineraryId) REFERENCES TripItineraries(id) ON DELETE CASCADE
);

-- Create TripExpenses table
CREATE TABLE TripExpenses (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tripId UNIQUEIDENTIFIER NOT NULL,
    itineraryItemId UNIQUEIDENTIFIER,
    date DATE NOT NULL,
    category NVARCHAR(50) NOT NULL, -- 'accommodation', 'transport', 'food', 'activities', 'shopping', 'other'
    description NVARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency NVARCHAR(3) DEFAULT 'USD',
    paymentMethod NVARCHAR(50), -- 'cash', 'credit_card', 'debit_card', 'digital_wallet'
    receipt NVARCHAR(500), -- file path for receipt image
    notes NVARCHAR(MAX),
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (tripId) REFERENCES Trips(id) ON DELETE CASCADE,
    FOREIGN KEY (itineraryItemId) REFERENCES ItineraryItems(id) ON DELETE SET NULL
);

-- Create TripBudgets table
CREATE TABLE TripBudgets (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tripId UNIQUEIDENTIFIER NOT NULL,
    category NVARCHAR(50) NOT NULL,
    plannedAmount DECIMAL(10,2) NOT NULL,
    alertThreshold INT DEFAULT 80, -- percentage to trigger alert
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (tripId) REFERENCES Trips(id) ON DELETE CASCADE,
    UNIQUE(tripId, category)
);

-- Create PackingLists table
CREATE TABLE PackingLists (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tripId UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) DEFAULT 'Main Packing List',
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (tripId) REFERENCES Trips(id) ON DELETE CASCADE
);

-- Create PackingItems table
CREATE TABLE PackingItems (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    packingListId UNIQUEIDENTIFIER NOT NULL,
    itemName NVARCHAR(255) NOT NULL,
    category NVARCHAR(50), -- 'clothing', 'toiletries', 'electronics', 'documents', 'medications', 'other'
    quantity INT DEFAULT 1,
    isPacked BIT DEFAULT 0,
    isEssential BIT DEFAULT 0,
    notes NVARCHAR(MAX),
    itemOrder INT,
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (packingListId) REFERENCES PackingLists(id) ON DELETE CASCADE
);

-- Create TripDocuments table
CREATE TABLE TripDocuments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tripId UNIQUEIDENTIFIER NOT NULL,
    documentType NVARCHAR(50) NOT NULL, -- 'passport', 'visa', 'ticket', 'booking', 'insurance', 'other'
    title NVARCHAR(255) NOT NULL,
    filePath NVARCHAR(500),
    expiryDate DATE,
    documentNumber NVARCHAR(255),
    notes NVARCHAR(MAX),
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (tripId) REFERENCES Trips(id) ON DELETE CASCADE
);

-- Create TripCompanions table
CREATE TABLE TripCompanions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tripId UNIQUEIDENTIFIER NOT NULL,
    userId NVARCHAR(1000),
    email NVARCHAR(255),
    name NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) DEFAULT 'companion', -- 'organizer', 'companion'
    status NVARCHAR(50) DEFAULT 'invited', -- 'invited', 'accepted', 'declined'
    joinedAt DATETIME2,
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (tripId) REFERENCES Trips(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE SET NULL
);

-- Create TripPhotos table
CREATE TABLE TripPhotos (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tripId UNIQUEIDENTIFIER NOT NULL,
    itineraryItemId UNIQUEIDENTIFIER,
    filePath NVARCHAR(500) NOT NULL,
    thumbnailPath NVARCHAR(500),
    caption NVARCHAR(MAX),
    location NVARCHAR(255),
    takenAt DATETIME2 DEFAULT GETDATE(),
    uploadedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (tripId) REFERENCES Trips(id) ON DELETE CASCADE,
    FOREIGN KEY (itineraryItemId) REFERENCES ItineraryItems(id) ON DELETE SET NULL
);

-- Create TripNotes table
CREATE TABLE TripNotes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tripId UNIQUEIDENTIFIER NOT NULL,
    itineraryItemId UNIQUEIDENTIFIER,
    title NVARCHAR(255),
    content NVARCHAR(MAX) NOT NULL,
    category NVARCHAR(50), -- 'general', 'reminder', 'review', 'tip'
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (tripId) REFERENCES Trips(id) ON DELETE CASCADE,
    FOREIGN KEY (itineraryItemId) REFERENCES ItineraryItems(id) ON DELETE SET NULL
);

-- Create TripTemplates table (for saving and reusing trip plans)
CREATE TABLE TripTemplates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    userId NVARCHAR(1000) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    destination NVARCHAR(255),
    duration INT, -- days
    estimatedBudget DECIMAL(10,2),
    tripType NVARCHAR(50),
    templateData NVARCHAR(MAX), -- JSON with itinerary structure
    isPublic BIT DEFAULT 0,
    useCount INT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE CASCADE
);

-- Create TripSharedExpenses table (for group expense splitting)
CREATE TABLE TripSharedExpenses (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    expenseId UNIQUEIDENTIFIER NOT NULL,
    companionId UNIQUEIDENTIFIER NOT NULL,
    shareAmount DECIMAL(10,2) NOT NULL,
    isPaid BIT DEFAULT 0,
    paidAt DATETIME2,
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (expenseId) REFERENCES TripExpenses(id) ON DELETE CASCADE,
    FOREIGN KEY (companionId) REFERENCES TripCompanions(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IX_Trips_UserId ON Trips(userId);
CREATE INDEX IX_Trips_Status ON Trips(status);
CREATE INDEX IX_Trips_StartDate ON Trips(startDate);
CREATE INDEX IX_TripItineraries_TripId ON TripItineraries(tripId);
CREATE INDEX IX_ItineraryItems_ItineraryId ON ItineraryItems(itineraryId);
CREATE INDEX IX_TripExpenses_TripId ON TripExpenses(tripId);
CREATE INDEX IX_TripExpenses_Date ON TripExpenses(date);
CREATE INDEX IX_PackingLists_TripId ON PackingLists(tripId);
CREATE INDEX IX_TripDocuments_TripId ON TripDocuments(tripId);
CREATE INDEX IX_TripCompanions_TripId ON TripCompanions(tripId);
CREATE INDEX IX_TripPhotos_TripId ON TripPhotos(tripId);