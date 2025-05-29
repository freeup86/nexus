# Nexus - Multi-Utility AI Application

A modern web application that serves as a central hub for various AI-powered utilities including Twitter Bot, Text Extractor, and Contract Analyzer.

## Features

### 🐦 Twitter Bot
- AI-powered tweet generation based on topics/keywords
- Multiple tone options (professional, casual, funny, etc.)
- Tweet scheduling and preview
- Analytics and history tracking

### 📄 Text Extractor
- Extract text from multiple file formats (PDF, DOCX, images)
- OCR support for image text extraction
- Drag-and-drop file upload
- Batch processing capability

### 📑 Contract Analyzer
- AI-powered contract analysis
- Plain English translation of legal terms
- Risk identification and key terms highlighting
- Export analysis reports

## Tech Stack

### Frontend
- React 18+ with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Zustand for state management
- Axios for API calls

### Backend
- Node.js with Express
- Prisma ORM with SQL Server
- JWT authentication
- OpenAI integration
- Twitter API v2 integration

## Prerequisites

- Node.js 16+
- SQL Server (local or cloud instance)
- OpenAI API key
- Twitter API credentials (optional, for Twitter Bot)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nexus
```

2. Install dependencies:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:

Create a `.env` file in the backend directory:
```env
# Copy from backend/.env.example and fill in your values
DATABASE_URL="sqlserver://localhost:1433;database=nexus;user=SA;password=YourPassword;encrypt=true"
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
# Add other API keys as needed
```

4. Set up the database:

```bash
cd backend
npx prisma generate
npx prisma db push
```

## Running the Application

### Development Mode

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm start
```

3. Access the application at `http://localhost:3000`

### Production Build

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Build the backend:
```bash
cd backend
npm run build
```

3. Start the production server:
```bash
cd backend
npm start
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### Twitter Bot Endpoints
- `POST /api/twitter/generate` - Generate tweet
- `GET /api/twitter/tweets` - Get user's tweets
- `PUT /api/twitter/tweets/:id` - Update tweet
- `DELETE /api/twitter/tweets/:id` - Delete tweet
- `POST /api/twitter/tweets/:id/publish` - Publish tweet

### Text Extractor Endpoints
- `POST /api/text-extractor/extract` - Extract text from file
- `GET /api/text-extractor/history` - Get extraction history
- `GET /api/text-extractor/extraction/:id` - Get specific extraction
- `DELETE /api/text-extractor/extraction/:id` - Delete extraction

### Contract Analyzer Endpoints
- `POST /api/contracts/analyze` - Analyze contract
- `GET /api/contracts/history` - Get contract history
- `GET /api/contracts/contract/:id` - Get specific contract analysis
- `DELETE /api/contracts/contract/:id` - Delete contract

## Project Structure

```
nexus/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── public/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   └── prisma/
└── shared/
    └── types/
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.