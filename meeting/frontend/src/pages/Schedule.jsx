import React, { useState } from 'react';
import axios from 'axios';

const Schedule = () => {
  const [prompt, setPrompt] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [suggestedSlot, setSuggestedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get the user's local timezone
  const getUserTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  const scheduleMeeting = async (useCustomSlot = false, customSlotData = null) => {
    if (!prompt && !useCustomSlot) {
      setError('Please enter a scheduling prompt.');
      return;
    }

    setIsLoading(true);
    try {
      let response;
      const userTimezone = getUserTimezone();
      
      if (useCustomSlot && customSlotData) {
        // Schedule using the suggested slot
        response = await axios.post(`${import.meta.env.VITE_API_URL}/api/schedule/meeting`, {
          prompt: `Schedule a meeting with ${customSlotData.participant} on ${new Date(customSlotData.start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${new Date(customSlotData.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} for ${customSlotData.duration} minutes`,
          use_suggested_slot: true,
          timezone: userTimezone
        });
      } else {
        // Normal scheduling with user's prompt
        response = await axios.post(`${import.meta.env.VITE_API_URL}/api/schedule/meeting`, {
          prompt,
          timezone: userTimezone
        });
      }

      if (response.data.conflict) {
        setMessage(
          `${response.data.message} Suggested slot: ${new Date(response.data.suggested_slot.start).toLocaleString()} - ${new Date(response.data.suggested_slot.end).toLocaleString()}`
        );
        setSuggestedSlot(response.data.suggested_slot);
        setError(null);
      } else {
        setMessage(response.data.message);
        setError(null);
        setSuggestedSlot(null);
        setPrompt(''); // Clear the input field
        setTimeout(() => window.location.href = '/events', 2000);
      }
    } catch (err) {
      setError('Failed to schedule meeting: ' + (err.response?.data?.detail || err.message));
      setMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSuggestedSlot = () => {
    setSuggestedSlot(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white relative overflow-hidden flex items-center justify-center">
      {/* Background Geometric Shapes */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 opacity-30 transform rotate-45"></div>
      <div className="absolute top-10 left-20 w-24 h-24 border-4 border-purple-500 opacity-30 transform rotate-45"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 opacity-30 transform rotate-45"></div>

      {/* Main Content */}
      <div className="bg-[#2A2A3E] p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-100 flex-grow">Meeting Scheduler AI</h2>
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 01-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Quick Suggestions</label>
          <div className="bg-[#1A1A2E] p-3 rounded-lg opacity-50 mb-2">
            <span>Schedule a meeting</span>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your meeting scheduling request..."
            className="w-full bg-[#1A1A2E] border border-gray-700 rounded-lg py-3 px-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button 
            onClick={() => scheduleMeeting()}
            disabled={isLoading}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        <div className="mt-4 bg-purple-900 bg-opacity-20 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="mr-3 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-300">Schedule a Meeting</p>
              <p className="text-xs text-gray-400">Simply enter your meeting details and our AI will handle the scheduling for you</p>
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-4 bg-green-900 bg-opacity-20 p-3 rounded-lg text-green-300">
            {message}
            
            {suggestedSlot && (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-xs text-green-200 font-semibold">Would you like to schedule this meeting at the suggested time?</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => scheduleMeeting(true, suggestedSlot)}
                    className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Scheduling...' : 'Schedule at Suggested Time'}
                  </button>
                  <button 
                    onClick={clearSuggestedSlot}
                    className="bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700 transition"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {error && (
          <div className="mt-4 bg-red-900 bg-opacity-20 p-3 rounded-lg text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;