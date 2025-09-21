import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // For animations
import axios from 'axios';

function Home() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/calendar/events`)
      .then((response) => {
        console.log('Events response:', response.data);
        setEvents(response.data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching events:', err.response?.data || err.message);
        setError('Failed to fetch events: ' + (err.response?.data?.detail || err.message));
        setLoading(false);
      });
  }, []);

  const toggleEventExpand = (eventId) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white relative overflow-hidden">
      {/* Background Geometric Shapes */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 opacity-30 transform rotate-45"></div>
      <div className="absolute top-10 left-20 w-24 h-24 border-4 border-purple-500 opacity-30 transform rotate-45"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 opacity-30 transform rotate-45"></div>

      {/* Header */}
      <header className="flex justify-between items-center p-6 px-12">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
          ChronosAI
        </h1>
        <div className="space-x-4">
          <button className="relative bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full hover:from-purple-600 hover:to-blue-600 transition transform hover:scale-105">
            + New Event
            <span className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
          </button>
          {/* <button className="relative bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full hover:from-purple-600 hover:to-blue-600 transition transform hover:scale-105">
            🎙️ Voice Command
            <span className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
          </button> */}
        </div>
      </header>

      {/* Main Content with Padding */}
      <div className="p-6 px-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Schedule</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="bg-[#2A2A3E] p-4 rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-600 rounded w-1/4 mb-2"></div>
                  <div className="h-6 bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : events.length === 0 ? (
            <p className="text-gray-400">No upcoming events found.</p>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3 }}
                    className="relative bg-[#2A2A3E] p-4 rounded-lg shadow-lg transform hover:rotate-1 transition-transform duration-300 cursor-pointer"
                    onClick={() => toggleEventExpand(event.id)}
                  >
                    {/* 3D Time Block */}
                    <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-purple-500 to-blue-500 transform -skew-y-12 shadow-md"></div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-400">
                          {new Date(event.start.dateTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {new Date(event.end.dateTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <h3 className="text-lg font-medium">{event.summary}</h3>
                        {event.attendees && event.attendees.length > 0 && (
                          <p className="text-blue-400">
                            {event.attendees.map((attendee) => attendee.email).join(', ')}
                          </p>
                        )}
                        <AnimatePresence>
                          {expandedEvent === event.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-2 text-gray-300"
                            >
                              <p>{event.description || 'No description available.'}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <button className="relative bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full hover:from-purple-600 hover:to-blue-600 transition transform hover:scale-105">
                        Remind
                        <span className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Analytics */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>
          <div className="bg-[#2A2A3E] p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium mb-4">Weekly Activity</h3>
            <div className="flex justify-between items-end h-40">
              <div className="flex-1">
                <motion.div
                  className="bg-gradient-to-t from-purple-500 to-blue-500 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: '6rem' }}
                  transition={{ duration: 0.5 }}
                ></motion.div>
                <p className="text-center text-gray-400 mt-2">Mon</p>
              </div>
              <div className="flex-1">
                <motion.div
                  className="bg-gradient-to-t from-purple-500 to-blue-500 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: '8rem' }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                ></motion.div>
                <p className="text-center text-gray-400 mt-2">Tue</p>
              </div>
              <div className="flex-1">
                <motion.div
                  className="bg-gradient-to-t from-purple-500 to-blue-500 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: '7rem' }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                ></motion.div>
                <p className="text-center text-gray-400 mt-2">Wed</p>
              </div>
              <div className="flex-1">
                <motion.div
                  className="bg-gradient-to-t from-purple-500 to-blue-500 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: '4rem' }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                ></motion.div>
                <p className="text-center text-gray-400 mt-2">Thu</p>
              </div>
              <div className="flex-1">
                <motion.div
                  className="bg-gradient-to-t from-purple-500 to-blue-500 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: '5rem' }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                ></motion.div>
                <p className="text-center text-gray-400 mt-2">Fri</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/schedule"
              className="relative bg-[#2A2A3E] p-4 rounded-lg flex items-center justify-center hover:bg-[#3A3A4E] transition transform hover:scale-105 shadow-inner"
            >
              <span className="text-blue-400 mr-2">📅</span>
              <span>Schedule Meeting</span>
              <span className="absolute inset-0 rounded-lg bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
            </Link>
            <Link
              to="/availability"
              className="relative bg-[#2A2A3E] p-4 rounded-lg flex items-center justify-center hover:bg-[#3A3A4E] transition transform hover:scale-105 shadow-inner"
            >
              <span className="text-purple-400 mr-2">⏰</span>
              <span>Find Availability</span>
              <span className="absolute inset-0 rounded-lg bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
            </Link>
            <Link
              to="/settings"
              className="relative bg-[#2A2A3E] p-4 rounded-lg flex items-center justify-center hover:bg-[#3A3A4E] transition transform hover:scale-105 shadow-inner"
            >
              <span className="text-blue-400 mr-2">📆</span>
              <span>Settings</span>
              <span className="absolute inset-0 rounded-lg bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
            </Link>
            <Link
              to="/cancel-reschedule"
              className="relative bg-[#2A2A3E] p-4 rounded-lg flex items-center justify-center hover:bg-[#3A3A4E] transition transform hover:scale-105 shadow-inner"
            >
              <span className="text-purple-400 mr-2">🔄</span>
              <span>Cancel or Reschedule</span>
              <span className="absolute inset-0 rounded-lg bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
            </Link>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Upcoming Tasks</h2>
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative bg-[#2A2A3E] p-4 rounded-lg flex justify-between items-center shadow-lg"
            >
              <div>
                <h3 className="text-lg font-medium">Review AI Model Performance</h3>
              </div>
              <p className="text-blue-400 animate-pulse">Tomorrow</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="relative bg-[#2A2A3E] p-4 rounded-lg flex justify-between items-center shadow-lg"
            >
              <div>
                <h3 className="text-lg font-medium">Update Neural Network Parameters</h3>
              </div>
              <p className="text-purple-400 animate-pulse">In 2 days</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #2A2A3E;
          border-radius: 10px;
          box-shadow: inset 0 0 5px rgba(147, 51, 234, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #9333EA, #3B82F6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #A855F7, #60A5FA);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #9333EA #2A2A3E;
        }
      `}</style>
    </div>
  );
}

export default Home;