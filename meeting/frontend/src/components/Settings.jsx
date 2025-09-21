import React, { useState } from 'react';
import axios from 'axios';

function Settings() {
  const [prompt, setPrompt] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/preferences/set`,
        { prompt }
      );
      setMessage(response.data.message);
      setPrompt('');
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Error updating preferences');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1A1A2E] text-white">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 opacity-30 transform rotate-45"></div>
            <div className="absolute top-10 left-20 w-24 h-24 border-4 border-purple-500 opacity-30 transform rotate-45"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 opacity-30 transform rotate-45"></div>
      <div className="bg-[#1A1A2E] text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300">
        <h2 className="text-2xl font-bold mb-6 text-white-800">Set Availability Preferences</h2>
        <form onSubmit={handleSubmit}>
          
          <div className="mb-4">

            <label
              htmlFor="prompt"
              className="text-2xl font-bold mb-6 text-gray-100"
            >
              Enter your availability preferences
            </label>

            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Set my availability to weekdays 9 AM to 5 PM, Block weekends, Add 15 minutes buffer"
             className="w-full p-3 rounded-lg bg-[#1A1A2E] text-white border-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              rows="3"
            />
          </div>
          <button
            type="submit"
           className="relative mt-4 w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-full hover:from-purple-600 hover:to-blue-600 transition transform hover:scale-105 disabled:opacity-50"
          >
            Save Preferences
          </button>
        </form>
        {message && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-gray-800">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;