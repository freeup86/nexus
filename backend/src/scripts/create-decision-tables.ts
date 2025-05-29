import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function createDecisionTables() {
  try {
    console.log('Creating Decision Support System tables...');
    
    // Since we're using Azure SQL Server and can't use automatic migrations,
    // we need to create the tables manually
    await prisma.$executeRaw`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Decision' AND xtype='U')
      CREATE TABLE Decision (
        id NVARCHAR(1000) NOT NULL,
        userId NVARCHAR(1000) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        decisionType NVARCHAR(100),
        status NVARCHAR(50) DEFAULT 'active',
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_Decision PRIMARY KEY (id),
        CONSTRAINT FK_Decision_User FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DecisionCriteria' AND xtype='U')
      CREATE TABLE DecisionCriteria (
        id NVARCHAR(1000) NOT NULL,
        decisionId NVARCHAR(1000) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        weight FLOAT NOT NULL,
        criteriaOrder INT,
        CONSTRAINT PK_DecisionCriteria PRIMARY KEY (id),
        CONSTRAINT FK_DecisionCriteria_Decision FOREIGN KEY (decisionId) REFERENCES Decision(id) ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DecisionOption' AND xtype='U')
      CREATE TABLE DecisionOption (
        id NVARCHAR(1000) NOT NULL,
        decisionId NVARCHAR(1000) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        optionOrder INT,
        CONSTRAINT PK_DecisionOption PRIMARY KEY (id),
        CONSTRAINT FK_DecisionOption_Decision FOREIGN KEY (decisionId) REFERENCES Decision(id) ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DecisionScore' AND xtype='U')
      CREATE TABLE DecisionScore (
        id NVARCHAR(1000) NOT NULL,
        decisionId NVARCHAR(1000) NOT NULL,
        optionId NVARCHAR(1000) NOT NULL,
        criteriaId NVARCHAR(1000) NOT NULL,
        score FLOAT NOT NULL,
        CONSTRAINT PK_DecisionScore PRIMARY KEY (id),
        CONSTRAINT FK_DecisionScore_Decision FOREIGN KEY (decisionId) REFERENCES Decision(id) ON DELETE CASCADE,
        CONSTRAINT FK_DecisionScore_Option FOREIGN KEY (optionId) REFERENCES DecisionOption(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_DecisionScore_Criteria FOREIGN KEY (criteriaId) REFERENCES DecisionCriteria(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT UQ_DecisionScore_Option_Criteria UNIQUE (optionId, criteriaId)
      )
    `;

    await prisma.$executeRaw`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DecisionAnalysis' AND xtype='U')
      CREATE TABLE DecisionAnalysis (
        id NVARCHAR(1000) NOT NULL,
        decisionId NVARCHAR(1000) NOT NULL,
        analysisType NVARCHAR(100) NOT NULL,
        results NVARCHAR(MAX) NOT NULL,
        aiRecommendation NVARCHAR(MAX),
        confidenceScore FLOAT,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_DecisionAnalysis PRIMARY KEY (id),
        CONSTRAINT FK_DecisionAnalysis_Decision FOREIGN KEY (decisionId) REFERENCES Decision(id) ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DecisionScenario' AND xtype='U')
      CREATE TABLE DecisionScenario (
        id NVARCHAR(1000) NOT NULL,
        decisionId NVARCHAR(1000) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        variables NVARCHAR(MAX) NOT NULL,
        outcomes NVARCHAR(MAX) NOT NULL,
        probability FLOAT,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_DecisionScenario PRIMARY KEY (id),
        CONSTRAINT FK_DecisionScenario_Decision FOREIGN KEY (decisionId) REFERENCES Decision(id) ON DELETE CASCADE
      )
    `;

    console.log('Decision Support System tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDecisionTables();