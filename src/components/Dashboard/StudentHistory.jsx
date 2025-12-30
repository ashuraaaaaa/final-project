import React, { useState, useEffect } from 'react';
import { timeAgo, formatDate } from '../../utils/dateUtils'; // Import the helper we made earlier

const StudentHistory = ({ currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);

  useEffect(() => {
    if (!currentUser || !currentUser.takenQuizzes) {
      setFilteredQuizzes([]);
      return;
    }

    // 1. Sort by Newest First
    let sorted = [...currentUser.takenQuizzes].sort((a, b) => {
      return new Date(b.dateTaken) - new Date(a.dateTaken);
    });

    // 2. Apply Filters
    const result = sorted.filter(quiz => {
      const matchName = quiz.quizTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchMonth = true;
      if (monthFilter) {
        // monthFilter comes as "2025-12". We check if the quiz date starts with this.
        matchMonth = quiz.dateTaken.startsWith(monthFilter);
      }

      return matchName && matchMonth;
    });

    setFilteredQuizzes(result);
  }, [currentUser, searchTerm, monthFilter]);

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mt-6">
      <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
        <span className="text-2xl">📜</span> Quiz History
      </h3>

      {/* --- FILTERS SECTION --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search Input */}
        <input 
          type="text" 
          placeholder="Search by Quiz Name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 text-white focus:border-yellow-400 focus:outline-none"
        />

        {/* Month Filter */}
        <input 
          type="month" 
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="p-2 rounded bg-gray-700 border border-gray-600 text-white focus:border-yellow-400 focus:outline-none"
        />
        
        {/* Reset Button */}
        {(searchTerm || monthFilter) && (
          <button 
            onClick={() => { setSearchTerm(''); setMonthFilter(''); }}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* --- LIST SECTION --- */}
      <div className="space-y-4">
        {filteredQuizzes.length > 0 ? (
          filteredQuizzes.map((quiz, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-700/50 p-4 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors">
              
              <div className="flex items-center gap-4">
                {/* Status Icon */}
                <div className="bg-green-900/50 p-2 rounded-full border border-green-500/30">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                
                <div>
                  <h4 className="font-bold text-white text-lg">{quiz.quizTitle}</h4>
                  <div className="flex gap-3 text-sm text-gray-400 mt-1">
                    {/* Time Ago Display */}
                    <span className="text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded text-xs flex items-center">
                      🕒 {timeAgo(quiz.dateTaken)}
                    </span>
                    
                    {/* Exact Date */}
                    <span>📅 {formatDate(quiz.dateTaken)}</span>
                  </div>
                </div>
              </div>

              {/* Score Display */}
              <div className="text-right">
                <span className="block text-2xl font-bold text-yellow-400">{quiz.score}</span>
                <span className="text-xs text-gray-500 uppercase">Points</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No history found. Try changing your filters or take a quiz!
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHistory;