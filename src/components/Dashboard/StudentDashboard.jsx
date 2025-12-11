import React, { useState, useEffect } from 'react';
import { clearCurrentUser } from '../../utils/storage.js'; // FIX: Corrected utility import
import { loadQuizzes } from '../../utils/quizStorage.js'; // FIX: Corrected utility import

const StudentDashboard = ({ setScreen, currentUser, setModal, setActiveQuizId }) => {
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  
  // Load quizzes when component mounts
  useEffect(() => {
    const quizzes = loadQuizzes();
    setAvailableQuizzes(quizzes);
  }, []);

  const handleLogout = () => {
    clearCurrentUser(); 
    setScreen("choose");
  };

  // Function to handle quiz start/retake checks
  const handleStartQuiz = (quizId, quizName, totalScore) => {
    // NOTE: Submission status key is tied to the specific quiz ID
    const submissionStatus = JSON.parse(localStorage.getItem(`quiz_submission_${quizId}`) || 'null');
    
    if (submissionStatus && submissionStatus.isSubmitted) {
        // Prevent retake and show warning
        const message = submissionStatus.isReleased 
            ? `You have already taken this quiz (${quizName}). Your final score is ${submissionStatus.score}/${submissionStatus.totalScore}.` 
            : `You have already taken this quiz (${quizName}). Please wait for the instructor to release your score.`; 
            
        setModal({ 
            message: message, 
            type: "info" 
        });
        return;
    }
    
    // If not submitted, set the active ID and go to quiz screen
    setActiveQuizId(quizId);
    setScreen("quiz");
  }

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

          {availableQuizzes.length === 0 && (
             <div className='text-center p-6 text-gray-400 border border-gray-700 rounded-lg'>
                The instructor has not created any quizzes yet.
             </div>
          )}

          {availableQuizzes.map(quiz => {
              const submissionStatus = JSON.parse(localStorage.getItem(`quiz_submission_${quiz.id}`) || 'null');
              
              const isSubmitted = submissionStatus?.isSubmitted;
              const isReleased = submissionStatus?.isReleased;
              const totalScore = quiz.questions.reduce((sum, q) => sum + q.score, 0);

              const statusColor = isSubmitted ? (isReleased ? 'green' : 'yellow') : 'blue';
              
              const resultText = () => {
                  if (!isSubmitted) return `${quiz.questions.length} Questions | ${quiz.duration} minutes`;
                  if (isReleased) return `Score: ${submissionStatus.score}/${submissionStatus.totalScore} | Released`;
                  return 'Status: Results Pending Instructor Release';
              }
              
              return (
                  <div
                    key={quiz.id}
                    className={`flex justify-between items-center p-4 border-l-4 border-${statusColor}-500 bg-gray-700 rounded-lg ${isSubmitted ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:bg-gray-600'} transition-colors shadow-lg`}
                    onClick={() => handleStartQuiz(quiz.id, quiz.name, totalScore)}
                  >
                    <div className='flex flex-col'>
                        <span className="font-bold text-lg">{quiz.name}</span>
                        <span className={`text-sm text-${statusColor}-400`}>{resultText()}</span>
                    </div>
                    <button 
                        className={`px-5 py-2 rounded-lg font-bold transition-colors shadow-md ${isSubmitted ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
                        disabled={isSubmitted}
                    >
                      {isSubmitted ? (isReleased ? 'View Score' : 'Submitted') : 'Start'}
                    </button>
                  </div>
              );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;