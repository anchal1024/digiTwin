import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [settingsPrompt, setSettingsPrompt] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState(null);
  const [settingsError, setSettingsError] = useState(null);

  // Function to set user preferences
  const setPreferences = async () => {
    if (!settingsPrompt) {
      setSettingsError('Please enter a preference prompt.');
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/preferences/set`, {
        prompt: settingsPrompt,
      });
      setSettingsMessage(response.data.message);
      setSettingsError(null);
      setSettingsPrompt(''); // Clear the input field
    } catch (err) {
      setSettingsError('Error setting preferences: ' + (err.response?.data?.detail || err.message));
      setSettingsMessage(null);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333' }}>Dashboard</h1>

      {/* Quick Actions Section */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#333', marginBottom: '15px' }}>Quick Actions</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
          }}
        >
          {/* Schedule a Meeting */}
          <button
            onClick={() => navigate('/schedule')}
            style={{
              padding: '15px',
              background: 'linear-gradient(90deg, #6B48FF, #A674FF)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
          >
            Schedule a Meeting
          </button>

          {/* Find Availability */}
          <button
            onClick={() => navigate('/availability')}
            style={{
              padding: '15px',
              background: 'linear-gradient(90deg, #6B48FF, #A674FF)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
          >
            Find Availability
          </button>

          {/* Settings (Replaced View Calendar) */}
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              padding: '15px',
              background: 'linear-gradient(90deg, #6B48FF, #A674FF)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
          >
            Settings
          </button>

          {/* Cancel or Reschedule */}
          <button
            onClick={() => navigate('/events')}
            style={{
              padding: '15px',
              background: 'linear-gradient(90deg, #6B48FF, #A674FF)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
          >
            Cancel or Reschedule
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '400px',
              maxWidth: '90%',
            }}
          >
            <h3 style={{ marginBottom: '15px' }}>Set Availability Preferences</h3>
            <input
              type="text"
              value={settingsPrompt}
              onChange={(e) => setSettingsPrompt(e.target.value)}
              placeholder="e.g., Set work hours from 9 AM to 5 PM"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                marginBottom: '15px',
                fontSize: '16px',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={setPreferences}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(90deg, #6B48FF, #A674FF)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Update
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Close
              </button>
            </div>
            {settingsMessage && (
              <p style={{ color: 'green', marginTop: '10px' }}>{settingsMessage}</p>
            )}
            {settingsError && (
              <p style={{ color: 'red', marginTop: '10px' }}>{settingsError}</p>
            )}
          </div>
        </div>
      )}

      {/* Other Dashboard Content */}
      <div>
        <h2 style={{ color: '#333' }}>Welcome to Your Dashboard</h2>
        <p>Manage your meetings and preferences with ease.</p>
      </div>
    </div>
  );
};

export default Dashboard;