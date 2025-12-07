// src/components/Dashboard/InstructorDashboard.js
import React from 'react';
import { clearCurrentUser } from '../../utils/storage';

const InstructorDashboard = ({ setScreen, currentUser }) => {
  const mockResults = [
    { id: 1, name: "John Doe", score: 85, violations: 1, submittedAt: "2025-12-02 10:30 AM" },
    { id: 2, name: "Jane Smith", score: 92, violations: 0, submittedAt: "2025-12-02 11:00 AM" },
    { id: 3, name: "Alice Johnson", score: 78, violations: 3, submittedAt: "2025-12-02 12:45 PM" },
  ];

  const handleLogout = () => {
    clearCurrentUser(); 
    setScreen("choose");
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col w-full max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
        <h1 className="text-3xl font-extrabold text-green-300">Instructor Dashboard</h1>
        <button
          className="px-4 py-2 bg-red-600 rounded-xl hover:bg-red-700 transition-colors font-bold shadow-md"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2 border-gray-700 text-green-400">Quiz Results: Introduction to React</h2>
        
        <div className='overflow-x-auto'>
          <table className="w-full min-w-[600px] table-auto border-collapse rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-700 text-left">
                <th className="px-4 py-3 border-b border-gray-600">Name</th>
                <th className="px-4 py-3 border-b border-gray-600">Score (%)</th>
                <th className="px-4 py-3 border-b border-gray-600">Violations</th>
                <th className="px-4 py-3 border-b border-gray-600">Submitted At</th>
                <th className="px-4 py-3 border-b border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockResults.map(r => (
                <tr key={r.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3 font-semibold text-xl">{r.score}</td>
                  <td className={`px-4 py-3 font-semibold ${r.violations > 0 ? 'text-red-400' : 'text-green-400'}`}>{r.violations}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{r.submittedAt}</td>
                  <td className="px-4 py-3">
                    <button className="text-blue-400 hover:text-blue-300 text-sm">Review Attempt</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <button className="mt-4 px-6 py-3 bg-green-600 rounded-lg hover:bg-green-500 transition-colors font-bold shadow-md">
          Release All Results
        </button>
      </div>
    </div>
  );
};

export default InstructorDashboard;