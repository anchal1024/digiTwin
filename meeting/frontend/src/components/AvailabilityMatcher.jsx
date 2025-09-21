import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

function AvailabilityMatcher() {
  const navigate = useNavigate();
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [participant, setParticipant] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      setLoading(true);
      try {
        // Get user's timezone
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Fetch available time slots based on user preferences
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/availability`, {
          params: {
            timezone: userTimezone
          }
        });
        setTimeSlots(response.data.timeSlots || []);
      } catch (err) {
        console.error('Error fetching time slots:', err.response?.data || err.message);
        setError('Failed to fetch time slots: ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSlots();
  }, []);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setScheduleError(null);
  };

  const handleScheduleMeeting = async () => {
    if (!selectedSlot || !participant) {
      setScheduleError('Please select a time slot and enter participant name');
      return;
    }

    setScheduleLoading(true);
    setScheduleError(null);

    try {
      // Parse the start time from the selected slot
      const startDate = new Date(selectedSlot.start);
      
      // Get the user's local timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Format the prompt for the scheduling API
      const prompt = `Schedule a meeting with ${participant} on ${
        startDate.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })
      } at ${
        startDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      } for 30 minutes`;

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/schedule/meeting`, {
        prompt,
        use_suggested_slot: true, // Skip conflict checking as this is a known available slot
        timezone: userTimezone
      });

      console.log('Meeting scheduled:', response.data);
      setScheduleSuccess(true);
      
      // Redirect to events page after 2 seconds
      setTimeout(() => navigate('/events'), 2000);
    } catch (err) {
      console.error('Error scheduling meeting:', err.response?.data || err.message);
      setScheduleError('Failed to schedule meeting: ' + (err.response?.data?.detail || err.message));
    } finally {
      setScheduleLoading(false);
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
        className="bg-[#2A2A3E] p-8 rounded-lg shadow-lg w-full max-w-lg transform hover:rotate-1 transition-transform duration-300"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-100">Available Time Slots</h2>
        <p className="text-gray-400 mb-6">These time slots reflect your current availability preferences. Select a slot to schedule a meeting.</p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="bg-[#1A1A2E] p-4 rounded-lg animate-pulse">
                <div className="h-6 bg-gray-600 rounded w-3/4"></div>
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
        ) : timeSlots.length === 0 ? (
          <p className="text-gray-400">No available time slots found based on your preferences.</p>
        ) : (
          <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {timeSlots.map((slot, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`relative bg-[#1A1A2E] p-4 rounded-lg shadow-lg transform cursor-pointer transition-all duration-200 ${selectedSlot === slot ? 'bg-[#2D2D45] border-l-4 border-purple-500' : 'hover:bg-[#262639]'}`}
                onClick={() => handleSlotSelect(slot)}
              >
                <div className={`absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-purple-500 to-blue-500 transform -skew-y-12 shadow-md ${selectedSlot === slot ? 'opacity-0' : 'opacity-100'}`}></div>
                <p className="text-gray-100 text-lg">
                  {slot.start}
                </p>
                <p className="text-gray-400 text-sm">
                  30 minute meeting
                </p>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {selectedSlot && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 bg-[#1A1A2E] p-4 rounded-lg"
            >
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Schedule Meeting</h3>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Participant Name</label>
                <input
                  type="text"
                  value={participant}
                  onChange={(e) => setParticipant(e.target.value)}
                  placeholder="Enter participant name"
                  className="w-full bg-[#2A2A3E] border border-gray-700 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={scheduleLoading}
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                  disabled={scheduleLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleMeeting}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded hover:from-purple-600 hover:to-blue-600 transition"
                  disabled={scheduleLoading || !participant}
                >
                  {scheduleLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scheduling...
                    </span>
                  ) : (
                    'Schedule Meeting'
                  )}
                </button>
              </div>

              {scheduleError && (
                <p className="mt-3 text-red-400 text-sm">{scheduleError}</p>
              )}

              {scheduleSuccess && (
                <p className="mt-3 text-green-400 text-sm">Meeting scheduled successfully! Redirecting...</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => navigate('/home')}
          className="relative mt-6 w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-full hover:from-purple-600 hover:to-blue-600 transition transform hover:scale-105"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Home
          <span className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
        </motion.button>

        {/* 3D Effect: Floating Icons */}
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full shadow-lg transform rotate-12"></div>
      </motion.div>
    </div>
  );
}

export default AvailabilityMatcher;