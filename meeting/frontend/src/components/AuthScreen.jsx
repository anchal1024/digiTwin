import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function AuthScreen() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('refreshToken');
    if (token) {
      setIsAuthenticated(true);
      navigate('/home');
    }
  }, [navigate]);

  const login = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      console.log('Google auth response received');
      setIsLoading(true);
      setError(null);
      
      const code = credentialResponse.code;
      if (!code) {
        setError('No authorization code received from Google');
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google`, { code });
        console.log('Backend auth successful');
        
        if (response.data.refresh_token) {
          localStorage.setItem('refreshToken', response.data.refresh_token);
          localStorage.setItem('authTime', new Date().toISOString());
          setIsAuthenticated(true);
          navigate('/home');
        } else {
          // Even without refresh token, we can still proceed if the auth was successful
          localStorage.setItem('authTime', new Date().toISOString());
          setIsAuthenticated(true);
          navigate('/home');
        }
      } catch (err) {
        console.error('Backend auth error:', err.response?.data || err.message);
        setError('Failed to authenticate with backend: ' + (err.response?.data?.detail || err.message));
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      setError('Google login failed: ' + (error.error || 'Unknown error'));
      setIsLoading(false);
    },
    scope: 'https://www.googleapis.com/auth/calendar',
    flow: 'auth-code',
    redirect_uri: 'http://localhost:5173',
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Calendar Assistant</h2>
        <p className="mb-6 text-gray-600 text-center">
          Sign in with your Google account to allow the application to manage your calendar.
        </p>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <button
            onClick={() => login()}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition duration-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
            </svg>
            Sign in with Google
          </button>
        )}
        
        <p className="mt-4 text-xs text-gray-500 text-center">
          This application requires access to your Google Calendar to schedule and manage meetings.
        </p>
      </div>
    </div>
  );
}

export default AuthScreen;