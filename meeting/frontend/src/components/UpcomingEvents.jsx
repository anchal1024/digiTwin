import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/calendar/events`);
      setEvents(response.data.items || []);
      setError(null);
    } catch (err) {
      setError('Error fetching events: ' + (err.response?.data?.detail || err.message));
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const cancelMeeting = async (eventId) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/schedule/cancel`, {
        event_id: eventId,
      });
      alert(response.data.message);
      await fetchEvents();
    } catch (err) {
      alert('Error canceling meeting: ' + (err.response?.data?.detail || err.message));
    }
  };

  const rescheduleMeeting = async (eventId) => {
    window.location.href = `/reschedule/${eventId}`;
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white relative overflow-hidden">
      {/* Back Button */}
      <button 
        onClick={() => window.location.href = '/'} 
        className="absolute top-4 left-4 bg-[#2A2A3E] p-2 rounded-full hover:bg-[#3A3A4E] transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <h2 className="text-2xl font-bold flex-grow">Upcoming Events</h2>
          <div className="flex space-x-2">
            <button className="bg-[#2A2A3E] p-2 rounded-full hover:bg-[#3A3A4E] transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="bg-[#2A2A3E] p-2 rounded-full hover:bg-[#3A3A4E] transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 bg-opacity-20 p-4 rounded-lg text-red-300 mb-4">
            {error}
          </div>
        )}

        {events.length === 0 ? (
          <div className="bg-[#2A2A3E] p-6 rounded-lg text-center">
            <p className="text-gray-400">No upcoming events found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="bg-[#2A2A3E] p-4 rounded-lg shadow-lg relative"
              >
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-purple-500 to-blue-500 rounded-l-lg"></div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100">{event.summary}</h3>
                    <div className="flex items-center text-sm text-gray-400 mt-1 space-x-2">
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        {new Date(event.start.dateTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                      {event.location && (
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {event.location}
                        </span>
                      )}
                    </div>
                    {/* Removed the attendees email display section */}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => rescheduleMeeting(event.id)}
                      className="bg-yellow-500 bg-opacity-20 text-yellow-300 p-2 rounded-full hover:bg-opacity-30 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => cancelMeeting(event.id)}
                      className="bg-red-500 bg-opacity-20 text-red-300 p-2 rounded-full hover:bg-opacity-30 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingEvents;