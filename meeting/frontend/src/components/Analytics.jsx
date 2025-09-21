import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');

  const fetchAnalytics = async (date) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/analytics`,
        { params: date ? { start_date: date } : {} }
      );
      setAnalytics(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load analytics');
      setAnalytics(null);
    }
  };

  useEffect(() => {
    fetchAnalytics(); // Load current week by default
  }, []);

  const handleDateChange = (e) => {
    setStartDate(e.target.value);
    fetchAnalytics(e.target.value);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Meeting Analytics</h2>
        
        <div className="mb-4">
          <label htmlFor="startDate" className="block text-gray-700 font-medium mb-2">
            Select Week Start Date (Monday)
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={handleDateChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {analytics && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Total Meeting Hours</h3>
              <p className="text-gray-700">{analytics.total_meeting_hours} hours</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold">Busiest Days</h3>
              {Object.keys(analytics.busiest_days).length > 0 ? (
                <ul className="list-disc pl-5">
                  {Object.entries(analytics.busiest_days).map(([day, count]) => (
                    <li key={day} className="text-gray-700">
                      {day}: {count} meeting{count !== 1 ? 's' : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No meetings this week.</p>
              )}
            </div>
            
            <div>
              <h3 className="text-xl font-semibold">Most Frequent Attendees</h3>
              {Object.keys(analytics.most_frequent_attendees).length > 0 ? (
                <ul className="list-disc pl-5">
                  {Object.entries(analytics.most_frequent_attendees).map(([email, count]) => (
                    <li key={email} className="text-gray-700">
                      {email}: {count} meeting{count !== 1 ? 's' : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No attendees this week.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;