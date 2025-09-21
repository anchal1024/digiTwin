import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CalendarView() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/calendar/events`);
        setEvents(response.data.items || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Your Upcoming Events</h2>
      {events.length > 0 ? (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="p-4 bg-white rounded shadow">
              <h3 className="text-lg font-semibold">{event.summary}</h3>
              <p className="text-gray-600">
                {new Date(event.start.dateTime || event.start.date).toLocaleString()} -{' '}
                {new Date(event.end.dateTime || event.end.date).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">No upcoming events found.</p>
      )}
      <button
        onClick={() => navigate('/schedule')}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Schedule a New Meeting
      </button>
    </div>
  );
}

export default CalendarView;