import React, { useState, useEffect, useRef } from 'react';
import { findQuizById } from '../../utils/quizStorage.js';
import { loadCurrentUser } from '../../utils/storage.js';

const QuizPage = ({ setScreen, setModal, activeQuizId }) => {
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [violations, setViolations] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(0); 
  const [timeElapsed, setTimeElapsed] = useState(0); 
  
  // NEW: State to determine if the student is reviewing a released quiz
  const [isReviewMode, setIsReviewMode] = useState(false);

  const timerRef = useRef(null);
  const isViolatingRef = useRef(false);

  // --- 1. Initialization Logic ---
  useEffect(() => {
    const data = findQuizById(activeQuizId);
    const currentUser = loadCurrentUser();
    const storageKey = `quiz_submissions_${activeQuizId}`;
    const existingSubmissions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Find this specific student's submission
    const mySub = existingSubmissions.find(sub => sub.studentId === currentUser?.id);

    if (data) {
        setQuizData(data);
        
        if (mySub) {
            // Student has already taken the quiz
            setAnswers(mySub.answers || {});
            setViolations(mySub.violations || 0);
            setIsSubmitted(true);
            
            // If the professor clicked "Release", enable Review Mode
            if (mySub.isReleased) {
                setIsReviewMode(true);
            }
        } else {
            // New attempt: Initialize timer
            setTimeLeft(data.duration * 60); 
        }
    } else {
        setModal({ message: "Error: Quiz not found.", type: "error" });
        setScreen("student");
    }
  }, [activeQuizId, setScreen, setModal]);
  
  // --- 2. Security & Timer (Only runs during active quiz) ---
  useEffect(() => {
    if (!quizData || isSubmitted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          handleSubmit(true); 
          return 0;
        }
        return prevTime - 1;
      });
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.hidden && !isViolatingRef.current) {
        isViolatingRef.current = true;
        setViolations(prevV => prevV + 1);
      } else {
        isViolatingRef.current = false;
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSubmitted, quizData]);

  const handleSelect = (qId, option) => {
    if (isSubmitted) return;
    setAnswers({ ...answers, [qId]: option });
  };

  const handleSubmit = (isAuto = false) => {
    if (isSubmitted) return; 

    let finalScore = 0;
    const totalScore = quizData.questions.reduce((sum, q) => sum + q.score, 0);

    quizData.questions.forEach(q => {
      const qKey = `q_${q.id || q.index}`;
      if (q.type !== 'Essay' && q.type !== 'Short Answer' && q.answer === answers[qKey]) {
        finalScore += q.score;
      }
    });

    const currentUser = loadCurrentUser(); 
    const newSubmission = {
      studentId: currentUser?.id,
      studentName: currentUser?.fullName || currentUser?.username,
      answers: answers, // IMPORTANT: We save answers here so they can be reviewed later
      score: finalScore,
      totalScore: totalScore,
      violations: violations,
      timeTaken: timeElapsed,
      isReleased: false,
      submittedAt: new Date().toISOString()
    };

    const storageKey = `quiz_submissions_${activeQuizId}`; 
    const existingSubmissions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const otherSubmissions = existingSubmissions.filter(sub => sub.studentId !== currentUser.id);
    otherSubmissions.push(newSubmission);
    localStorage.setItem(storageKey, JSON.stringify(otherSubmissions));

    setIsSubmitted(true);
    setModal({ 
        message: isAuto ? "Time expired. Quiz auto-submitted." : "Quiz submitted! Results will be visible once released by your professor.", 
        type: "info" 
    });
  };

  if (!quizData) return <div className='text-xl text-yellow-500'>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center w-full">
      <header className="w-full max-w-xl flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-yellow-300">
            {quizData.name} {isReviewMode && <span className="text-sm bg-blue-600 px-2 py-1 rounded ml-2">REVIEW MODE</span>}
        </h1>
        <button className="px-4 py-2 bg-gray-700 rounded-lg font-bold" onClick={() => setScreen("student")}>
          Back
        </button>
      </header>

      <div className="w-full max-w-xl bg-gray-800 p-8 rounded-xl shadow-2xl space-y-8">
        {!isSubmitted && (
            <div className="flex justify-between border-b pb-4 border-gray-700">
                <span className='text-gray-400'>Time: {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</span>
                <span className="text-red-500 font-bold">Violations: {violations}/3</span>
            </div>
        )}

        {quizData.questions.map((q, index) => {
          const qId = `q_${q.id || index}`; 
          const studentAns = answers[qId];
          const isCorrect = studentAns === q.answer;

          return (
            <div key={qId} className={`p-5 border rounded-lg space-y-3 bg-gray-700 transition-all ${isReviewMode ? (isCorrect ? 'border-green-500 bg-green-900/10' : 'border-red-500 bg-red-900/10') : 'border-gray-700'}`}>
              <p className="font-semibold text-xl">{index + 1}. {q.text}</p>
              
              <div className="flex flex-col gap-2">
                {(q.type === 'Multiple Choice' || q.type === 'True or False') && q.options.map(opt => {
                  let btnStyle = "bg-gray-600";
                  
                  if (studentAns === opt) {
                      // Style for the answer the student picked
                      btnStyle = isReviewMode ? (isCorrect ? "bg-green-600" : "bg-red-600") : "bg-blue-600";
                  }
                  // Force highlight the correct answer in Review Mode
                  if (isReviewMode && opt === q.answer) {
                      btnStyle = "bg-green-600 ring-2 ring-white shadow-lg";
                  }

                  return (
                    <button
                      key={opt}
                      disabled={isSubmitted}
                      onClick={() => handleSelect(qId, opt)}
                      className={`px-4 py-3 text-left rounded-lg font-medium ${btnStyle} ${isSubmitted ? 'cursor-default' : 'hover:bg-gray-500'}`}
                    >
                      {opt}
                      {isReviewMode && opt === q.answer && " ✓ (Correct)"}
                      {isReviewMode && opt === studentAns && !isCorrect && " ✗ (Your Answer)"}
                    </button>
                  );
                })}

                {(q.type === 'Short Answer' || q.type === 'Essay') && (
                    <div className="space-y-3">
                        <textarea
                            disabled={isSubmitted}
                            value={studentAns || ''}
                            onChange={(e) => handleSelect(qId, e.target.value)}
                            className={`w-full p-3 rounded bg-gray-600 border ${isReviewMode ? (isCorrect ? 'border-green-500' : 'border-red-500') : ''}`}
                            placeholder="Your answer..."
                        />
                        {isReviewMode && (
                            <div className="p-3 bg-gray-900 rounded border-l-4 border-blue-500">
                                <span className="text-blue-400 font-bold text-xs">EXPECTED ANSWER / KEY PHRASE:</span>
                                <p className="text-sm text-gray-300 mt-1">{q.answer}</p>
                            </div>
                        )}
                    </div>
                )}
              </div>
            </div>
          );
        })}

        {!isSubmitted ? (
          <button onClick={() => handleSubmit(false)} className="w-full py-4 bg-yellow-600 rounded-lg font-bold hover:bg-yellow-500">
            Submit Quiz
          </button>
        ) : (
          <div className="text-center p-4 bg-gray-900 rounded-lg border border-gray-700">
             <p className='text-xl font-bold text-yellow-400'>
                {isReviewMode ? "Reviewing Results" : "Quiz Submitted"}
             </p>
             <p className='text-gray-400 text-sm mt-1'>
                {isReviewMode ? "You are viewing the correct answers." : "Your responses are locked. Results pending."}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;