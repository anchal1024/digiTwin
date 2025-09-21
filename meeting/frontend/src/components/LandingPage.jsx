import React from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Welcome to Meeting Scheduler
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Schedule meetings effortlessly with Google Calendar integration
      </p>
      <button
        onClick={handleGetStarted}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Get Started
      </button>
    </div>
  );
}

export default LandingPage;