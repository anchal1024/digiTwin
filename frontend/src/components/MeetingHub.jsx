import React, { useState, useEffect } from 'react';
import { 
  getMeetingEvents, 
  scheduleMeeting, 
  cancelMeeting, 
  getAvailability, 
  setPreferences 
} from '../services/meetingService';

const MeetingHub = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('calendar'); // 'calendar', 'schedule', 'settings'

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await getMeetingEvents();
      setEvents(eventsData);
      setError(null);
    } catch (err) {
      setError('Failed to load meeting events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMeeting = async (eventId) => {
    if (window.confirm('Are you sure you want to cancel this meeting?')) {
      try {
        await cancelMeeting({ eventId });
        fetchEvents(); // Refresh events after canceling
      } catch (err) {
        setError('Failed to cancel meeting');
        console.error(err);
      }
    }
  };

  const renderCalendarView = () => (
    <div className="calendar-view">
      <h3>Upcoming Meetings</h3>
      {loading ? (
        <p>Loading events...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : events.length === 0 ? (
        <p>No upcoming meetings</p>
      ) : (
        <ul className="meeting-list">
          {events.map((event) => (
            <li key={event.id} className="meeting-item">
              <div className="meeting-details">
                <h4>{event.summary}</h4>
                <p>{new Date(event.start.dateTime).toLocaleString()}</p>
                {event.description && <p>{event.description}</p>}
              </div>
              <button onClick={() => handleCancelMeeting(event.id)}>Cancel</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderScheduleView = () => {
    // This would contain a form to schedule new meetings
    // For now, just a placeholder
    return (
      <div className="schedule-view">
        <h3>Schedule New Meeting</h3>
        <p>Meeting scheduling interface would go here</p>
        <button onClick={() => setView('calendar')}>Back to Calendar</button>
      </div>
    );
  };

  const renderSettingsView = () => {
    // This would contain meeting preferences
    // For now, just a placeholder
    return (
      <div className="settings-view">
        <h3>Meeting Preferences</h3>
        <p>Meeting settings interface would go here</p>
        <button onClick={() => setView('calendar')}>Back to Calendar</button>
      </div>
    );
  };

  return (
    <div className="meeting-hub">
      <div className="meeting-hub-header">
        <h2>Meeting Manager</h2>
        <div className="meeting-nav">
          <button 
            className={view === 'calendar' ? 'active' : ''} 
            onClick={() => setView('calendar')}
          >
            Calendar
          </button>
          <button 
            className={view === 'schedule' ? 'active' : ''} 
            onClick={() => setView('schedule')}
          >
            Schedule
          </button>
          <button 
            className={view === 'settings' ? 'active' : ''} 
            onClick={() => setView('settings')}
          >
            Settings
          </button>
        </div>
      </div>

      <div className="meeting-hub-content">
        {view === 'calendar' && renderCalendarView()}
        {view === 'schedule' && renderScheduleView()}
        {view === 'settings' && renderSettingsView()}
      </div>
    </div>
  );
};

export default MeetingHub; 