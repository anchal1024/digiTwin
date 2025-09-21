import React from 'react';
import { useNavigate } from 'react-router-dom';

function AuthScreen() {
  const navigate = useNavigate();

  console.log('AuthScreen is rendering'); // Check if component mounts

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Auth Screen Test
        </h2>
        <button
          onClick={() => {
            console.log('Button clicked');
            navigate('/calendar');
          }}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Go to Calendar
        </button>
      </div>
    </div>
  );
}

export default AuthScreen;