import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

function CancelReschedule() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/calendar/events`);
        setEvents(response.data.items || []);
      } catch (err) {
        console.error('Error fetching events:', err.response?.data || err.message);
        setError('Failed to fetch events: ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleCancel = async (eventId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/calendar/events/${eventId}`);
      setEvents(events.filter((event) => event.id !== eventId));
    } catch (err) {
      console.error('Error canceling event:', err.response?.data || err.message);
      setError('Failed to cancel event: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleReschedule = async (eventId) => {
    // Navigate to schedule page or open a reschedule form (not implemented here)
    console.log(`Rescheduling event with ID: ${eventId}`);
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
        <h2 className="text-2xl font-bold mb-6 text-gray-100">Cancel or Reschedule Meeting</h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((_, index) => (
              <div key={index} className="bg-[#1A1A2E] p-4 rounded-lg animate-pulse">
                <div className="h-6 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 mb-4"
          >
            {error}
          </motion.p>
        ) : events.length === 0 ? (
          <p className="text-gray-400">No upcoming events found.</p>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative bg-[#1A1A2E] p-4 rounded-lg shadow-lg transform hover:rotate-1 transition-transform duration-300"
              >
                <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-purple-500 to-blue-500 transform -skew-y-12 shadow-md"></div>
                <p className="text-gray-100">
                  {event.summary} on{' '}
                  {new Date(event.start.dateTime).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
                <div className="mt-2 flex space-x-2">
                  
                  <motion.button
                    onClick={() => handleReschedule(event.id)}
                    className="relative bg-gradient-to-b from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition transform hover:scale-105"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Reschedule
                    <span className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
                  </motion.button>
                  <motion.button
                    onClick={() => handleCancel(event.id)}
                    className="relative bg-red-500 text-white px-4 py-2 rounded-full hover:bg-yellow-600 transition transform hover:scale-105"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                    <span className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
                  </motion.button>
                </div>
              </motion.div>
                  
            ))}
          </div>
        )}

        {/* 3D Effect: Floating Icons */}
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full shadow-lg transform rotate-12"></div>
      </motion.div>
    </div>
  );
}

export default CancelReschedule;