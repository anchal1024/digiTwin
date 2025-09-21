import axios from 'axios';

const API_URL = '/meeting/api';

// Meeting calendar events
export const getMeetingEvents = async () => {
  try {
    const response = await axios.get(`${API_URL}/calendar/events`);
    return response.data;
  } catch (error) {
    console.error('Error fetching meeting events:', error);
    throw error;
  }
};

// Schedule a new meeting
export const scheduleMeeting = async (meetingData) => {
  try {
    const response = await axios.post(`${API_URL}/schedule/meeting`, meetingData);
    return response.data;
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    throw error;
  }
};

// Cancel a meeting
export const cancelMeeting = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/schedule/cancel`, data);
    return response.data;
  } catch (error) {
    console.error('Error canceling meeting:', error);
    throw error;
  }
};

// Reschedule a meeting
export const rescheduleMeeting = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/schedule/reschedule`, data);
    return response.data;
  } catch (error) {
    console.error('Error rescheduling meeting:', error);
    throw error;
  }
};

// Get availability slots
export const getAvailability = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/availability`, { params });
    return response.data;
  } catch (error) {
    console.error('Error getting availability:', error);
    throw error;
  }
};

// Set meeting preferences
export const setPreferences = async (preferences) => {
  try {
    const response = await axios.post(`${API_URL}/preferences/set`, preferences);
    return response.data;
  } catch (error) {
    console.error('Error setting preferences:', error);
    throw error;
  }
};

// Get meeting analytics
export const getMeetingAnalytics = async (startDate) => {
  try {
    const params = startDate ? { start_date: startDate } : {};
    const response = await axios.get(`${API_URL}/analytics`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

// Google auth for meetings
export const googleMeetingAuth = async (code) => {
  try {
    const response = await axios.post(`${API_URL}/auth/google`, { code });
    return response.data;
  } catch (error) {
    console.error('Error authenticating with Google for meetings:', error);
    throw error;
  }
}; 