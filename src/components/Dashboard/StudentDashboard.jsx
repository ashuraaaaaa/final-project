import React from 'react';
import { clearCurrentUser } from '../../utils/storage';

const StudentDashboard = ({ setScreen, currentUser }) => {
  const handleLogout = () => {
    clearCurrentUser(); 
    setScreen("choose");
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col w-full max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
        <h1 className="text-3xl font-extrabold text-blue-300">Welcome, {currentUser?.username || "Student"}!</h1>
        <button
          className="px-4 py-2 bg-red-600 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <div className="flex-1 bg-gray-800 p-6 rounded-xl shadow-2xl space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2 border-gray-700 text-blue-400">Available Quizzes</h2>
        <div className="flex flex-col gap-4">
          {/* Active quiz */}
          <div
            className="flex justify-between items-center p-4 border-l-4 border-blue-500 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors shadow-lg"
            onClick={() => setScreen("quiz")}
          >
            <div className='flex flex-col'>
                <span className="font-bold text-lg">Sample Quiz 1: Introduction to React</span>
                <span className='text-sm text-gray-400'>10 Questions | 15 minutes | Due: Dec 15th</span>
            </div>
            <button className="px-5 py-2 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition-colors shadow-md">
              Start
            </button>
          </div>

          {/* Already taken quiz */}
          <div className="flex justify-between items-center p-4 border-l-4 border-green-500 bg-gray-700 rounded-lg opacity-80 cursor-not-allowed shadow-inner">
            <div className='flex flex-col'>
                <span className="font-bold text-lg">Sample Quiz 2: Basic JavaScript</span>
                <span className='text-sm text-green-400'>Score: 92% | Taken on: Nov 28th</span>
            </div>
            <button className="px-5 py-2 bg-gray-600 rounded-lg font-bold opacity-50 cursor-not-allowed">
              Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;