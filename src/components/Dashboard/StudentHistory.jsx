import React, { useState, useEffect } from 'react';
import { timeAgo, formatDate } from '../../utils/dateUtils';
import './StudentHistory.css'; // Import the new CSS

const StudentHistory = ({ currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);

  useEffect(() => {
    if (!currentUser || !currentUser.takenQuizzes) {
      setFilteredQuizzes([]);
      return;
    }

    let sorted = [...currentUser.takenQuizzes].sort((a, b) => {
      return new Date(b.dateTaken) - new Date(a.dateTaken);
    });

    const result = sorted.filter(quiz => {
      const matchName = quiz.quizTitle.toLowerCase().includes(searchTerm.toLowerCase());
      let matchMonth = true;
      if (monthFilter) {
        matchMonth = quiz.dateTaken.startsWith(monthFilter);
      }
      return matchName && matchMonth;
    });

    setFilteredQuizzes(result);
  }, [currentUser, searchTerm, monthFilter]);

  return (
    <div className="history-container">
      <h3 className="history-title">
        <span className="history-icon-large">📜</span> Quiz History
      </h3>

      <div className="filter-wrapper">
        <input 
          type="text" 
          placeholder="Search by Quiz Name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="filter-search"
        />

        <input 
          type="month" 
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="filter-month"
        />
        
        {(searchTerm || monthFilter) && (
          <button 
            onClick={() => { setSearchTerm(''); setMonthFilter(''); }}
            className="filter-clear-btn"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="history-list">
        {filteredQuizzes.length > 0 ? (
          filteredQuizzes.map((quiz, index) => (
            <div key={index} className="history-item">
              
              <div className="history-item-left">
                <div className="status-icon-container">
                  <svg className="status-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                
                <div>
                  <h4 className="quiz-info-title">{quiz.quizTitle}</h4>
                  <div className="quiz-info-meta">
                    <span className="time-ago-badge">
                      🕒 {timeAgo(quiz.dateTaken)}
                    </span>
                    <span>📅 {formatDate(quiz.dateTaken)}</span>
                  </div>
                </div>
              </div>

              <div className="score-container">
                <span className="score-value">{quiz.score}</span>
                <span className="score-label">Points</span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-history-msg">
            No history found. Try changing your filters or take a quiz!
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHistory;