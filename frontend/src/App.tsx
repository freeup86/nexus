import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import TwitterBotPage from './pages/TwitterBotPage';
import TextExtractorPage from './pages/TextExtractorPage';
import ContractAnalyzerPage from './pages/ContractAnalyzerPage';
import DecisionSupportPage from './pages/DecisionSupportPage';
import DIYProjectsPage from './pages/DIYProjectsPage';
import TravelPlannerPage from './pages/TravelPlannerPage';
import DocumentSummarizerPage from './pages/DocumentSummarizerPage';
import DreamJournalPage from './pages/DreamJournalPage';
import DocumentOrganizerPage from './pages/DocumentOrganizerPage';
import SmartHabitsPage from './pages/SmartHabitsPage';
import PersonalInsightsPage from './pages/PersonalInsightsPage';
import GamificationPage from './pages/GamificationPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import { ApiTestPage } from './pages/ApiTestPage';
import { PrivateRoute } from './components/common/PrivateRoute';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Private routes */}
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="twitter-bot" element={<TwitterBotPage />} />
              <Route path="text-extractor" element={<TextExtractorPage />} />
              <Route path="contract-analyzer" element={<ContractAnalyzerPage />} />
              <Route path="decision-support" element={<DecisionSupportPage />} />
              <Route path="diy-projects" element={<DIYProjectsPage />} />
              <Route path="travel-planner" element={<TravelPlannerPage />} />
              <Route path="document-summarizer" element={<DocumentSummarizerPage />} />
              <Route path="dream-journal" element={<DreamJournalPage />} />
              <Route path="document-organizer" element={<DocumentOrganizerPage />} />
              <Route path="smart-habits" element={<SmartHabitsPage />} />
              <Route path="personal-insights" element={<PersonalInsightsPage />} />
              <Route path="gamification" element={<GamificationPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="api-test" element={<ApiTestPage />} />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;