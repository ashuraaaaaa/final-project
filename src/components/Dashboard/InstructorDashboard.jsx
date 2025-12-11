// src/components/Dashboard/InstructorDashboard.js
import React, { useState } from 'react';
import { clearCurrentUser } from '../../utils/storage.js';


const InstructorDashboard = ({ setScreen, currentUser, setModal }) => {
  const MOCK_TOTAL_QUESTIONS = 3;
  
  const storedSubmission = JSON.parse(localStorage.getItem('quiz_submission_status') || 'null');
  const [resultsReleased, setResultsReleased] = useState(storedSubmission?.isReleased || false);

  let currentResults = [];

  if (storedSubmission && storedSubmission.isSubmitted) {
    const username = currentUser?.username || "Student Submission";
    const scorePercentage = (storedSubmission.score / MOCK_TOTAL_QUESTIONS) * 100;

    currentResults.push({
        id: 'user_submission', 
        name: username, 
        score: scorePercentage, 
        violations: storedSubmission.violations,
        submittedAt: storedSubmission.submittedAt,
        isReleased: resultsReleased
    });
  }
  
  const handleReleaseResults = () => {
    if (storedSubmission) {
        localStorage.setItem('quiz_submission_status', JSON.stringify({ 
            ...storedSubmission, 
            isReleased: true 
        }));
    }
    setResultsReleased(true);
    setModal({ message: "Results have been successfully released to all students.", type: "success" });
  }

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
        <h2 className="text-2xl font-semibold border-b pb-4 border-gray-700 text-green-400">Quiz Management</h2>
        
        {/* === QUIZ CREATION BUTTON === */}
        <button
          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors font-bold shadow-md flex items-center gap-2"
          onClick={() => setScreen("createQuiz")} // New screen state
        >
          <span className='text-2xl'>+</span> Create New Quiz
        </button>
        
        <h2 className="text-2xl font-semibold border-b pb-2 border-gray-700 text-green-400 mt-8">Quiz Results: Introduction to React</h2>
        
        {/* === RESULTS TABLE === */}
        <div className='overflow-x-auto'>
          {currentResults.length > 0 ? (
            <table className="w-full min-w-[600px] table-auto border-collapse rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-700 text-left">
                  <th className="px-4 py-3 border-b border-gray-600">Name</th>
                  <th className="px-4 py-3 border-b border-gray-600">Score (%)</th>
                  <th className="px-4 py-3 border-b border-gray-600">Violations</th>
                  <th className="px-4 py-3 border-b border-gray-600">Submitted At</th>
                  <th className="px-4 py-3 border-b border-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {currentResults.map(r => (
                  <tr key={r.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3 font-semibold text-xl">{Math.round(r.score)}%</td>
                    <td className={`px-4 py-3 font-semibold ${r.violations > 0 ? 'text-red-400' : 'text-green-400'}`}>{r.violations}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{new Date(r.submittedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${r.isReleased ? 'bg-green-500 text-white' : 'bg-yellow-500 text-gray-900'}`}>
                          {r.isReleased ? 'Released' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
             <div className='text-center p-6 text-gray-400 border border-gray-700 rounded-lg'>
                No student quiz submissions have been recorded yet for the Introduction to React Quiz.
             </div>
          )}
        </div>
        
        {/* === RELEASE RESULTS BUTTON === */}
        {!resultsReleased && currentResults.length > 0 ? (
            <button 
                className="mt-4 px-6 py-3 bg-green-600 rounded-lg hover:bg-green-500 transition-colors font-bold shadow-md"
                onClick={handleReleaseResults}
            >
              Release All Results
            </button>
        ) : (
             currentResults.length > 0 && 
             <p className="mt-4 text-green-400 font-semibold">Results for this quiz have been released.</p>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;