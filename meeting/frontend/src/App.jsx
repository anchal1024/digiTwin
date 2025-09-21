import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import CalendarView from './components/CalendarView.jsx';
import MeetingWizard from './components/MeetingWizard.jsx';
import AvailabilityMatcher from './components/AvailabilityMatcher.jsx';
import CancelReschedule from './components/CancelReschedule.jsx';
import Home from './components/Home.jsx';
import Settings from './components/Settings.jsx';
import Analytics from './components/Analytics.jsx';
import UpcomingEvents from './components/UpcomingEvents';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';

function App() {
  const isAuthenticated = !!localStorage.getItem('refreshToken');

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <ErrorBoundary>
            <Routes>
              <Route
                path="/"
                element={isAuthenticated ? <Navigate to="/home" /> : <Navigate to="/auth" />}
              />
              <Route path="/" element={<Dashboard />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/auth" element={<AuthScreen />} />
              <Route path="/home" element={<Home />} />
              <Route path="/events" element={<UpcomingEvents />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/schedule" element={<MeetingWizard />} />
              <Route path="/availability" element={<AvailabilityMatcher />} />
              <Route path="/cancel-reschedule" element={<CancelReschedule />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;