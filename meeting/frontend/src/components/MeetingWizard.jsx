import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // For animations
import axios from 'axios';

function MeetingWizard() {
  const navigate = useNavigate();
  const [request, setRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Assuming an API endpoint to process the meeting request
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/schedule`, {
        request,
      });
      console.log('Meeting scheduled:', response.data);
      navigate('/availability'); // Navigate to availability matcher after scheduling
    } catch (err) {
      console.error('Error scheduling meeting:', err.response?.data || err.message);
      setError('Failed to schedule meeting: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white relative overflow-hidden flex items-center justify-center">
      {/* Background Geometric Shapes */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 opacity-30 transform rotate-45"></div>
      <div className="absolute top-10 left-20 w-24 h-24 border-4 border-purple-500 opacity-30 transform rotate-45"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 opacity-30 transform rotate-45"></div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-[#2A2A3E] p-8 rounded-lg shadow-lg w-full max-w-md transform hover:rotate-1 transition-transform duration-300"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-100">Schedule a Meeting</h2>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 mb-4"
          >
            {error}
          </motion.p>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block text-gray-400 mb-2">Enter your meeting request</label>
          <motion.input
            type="text"
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="e.g., Schedule a meeting with John on March 27, 2025, at 2 PM for 30 minutes"
            className="w-full p-3 rounded-lg bg-[#1A1A2E] text-white border-none shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
            whileFocus={{ scale: 1.02 }}
          />
          <motion.button
            type="submit"
            disabled={loading}
            className="relative mt-4 w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-full hover:from-purple-600 hover:to-blue-600 transition transform hover:scale-105 disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                Scheduling...
              </div>
            ) : (
              'Schedule Meeting'
            )}
            <span className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
          </motion.button>
        </form>

        {/* 3D Effect: Floating Icons */}
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full shadow-lg transform rotate-12"></div>
      </motion.div>
    </div>
  );
}

export default MeetingWizard;