// src/components/Quiz/QuizPage.js
import React, { useState, useEffect, useRef } from 'react';
import { findQuizById } from '../../utils/quizStorage.js'; // Ensure correct path/extension

const QuizPage = ({ setScreen, setModal, activeQuizId }) => {
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [violations, setViolations] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(0); 

  const timerRef = useRef(null);
  const isViolatingRef = useRef(false);

  // --- Load dynamic quiz data ---
  useEffect(() => {
    const data = findQuizById(activeQuizId);
    if (data) {
        setQuizData(data);
        setTimeLeft(data.duration * 60); // Set time in seconds
    } else {
        setModal({ message: "Error: Quiz data not found. Please create a quiz first.", type: "error" });
        setScreen("student");
    }
  }, [activeQuizId, setScreen, setModal]);
  
  const MAX_VIOLATIONS = quizData?.violationThreshold || 3; // Use dynamic threshold

  // [PROJECT UPDATE] Effect for Timer and Tab/Focus Detection
  useEffect(() => {
    if (!quizData || isSubmitted) {
      clearInterval(timerRef.current);
      return;
    }

    // 1. Timer setup
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          handleSubmit(true); // Auto-submit on time up
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // 2. Tab/Focus Change Detection (Logic required by project)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isViolatingRef.current) return;
        isViolatingRef.current = true;
        
        setViolations(prevV => {
            const newV = prevV + 1;
            
            setModal({ 
                message: `Warning! Tab change detected. This is violation ${newV} of ${MAX_VIOLATIONS}.`, 
                type: "error" 
            });

            if (newV >= MAX_VIOLATIONS) {
                handleSubmit(true); 
            }
            return newV;
        });

      } else {
        isViolatingRef.current = false;
        setModal(null); 
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSubmitted, setModal, quizData, MAX_VIOLATIONS]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSelect = (qId, option) => setAnswers({ ...answers, [qId]: option });
  
  const handleSubmit = (isAuto = false) => {
    let finalScore = 0;
    const totalScore = quizData.questions.reduce((sum, q) => sum + q.score, 0);

    quizData.questions.forEach(q => {
      // Basic scoring for Multiple Choice/True or False
      if (q.type !== 'Essay' && q.type !== 'Short Answer' && q.answer === answers[`q_${q.id || q.index}`]) {
        finalScore += q.score;
      }
    });

    // Store submission status specific to this quiz ID
    localStorage.setItem(`quiz_submission_${activeQuizId}`, JSON.stringify({
        isSubmitted: true,
        score: finalScore,
        totalScore: totalScore,
        violations: isAuto ? violations + 1 : violations,
        isReleased: false,
        submittedAt: new Date().toISOString()
    }));

    setIsSubmitted(true);
    
    const submitMessage = isAuto 
        ? "Quiz auto-submitted due to excessive violations or time expiration." 
        : "Quiz submitted successfully!";

    // [PROJECT REQUIREMENT] Must NOT show score immediately 
    setModal({ 
        message: `${submitMessage} Your answers have been submitted. Please wait for the instructor to release the results.`, 
        type: "info" 
    });
  };

  const handleBack = () => {
    if (!isSubmitted) { // Check if the quiz has NOT been submitted
        setModal({ 
            message: "Warning: Leaving now will discard your answers. Proceed anyway?", 
            type: "error",
            onConfirm: () => setScreen("student"),
            onCancel: () => setModal(null)
        });
    } else {
        setScreen("student");
    }
  }

  if (!quizData) return <div className='text-xl text-yellow-500'>Loading Quiz...</div>; 

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center w-full">
      <header className="w-full max-w-xl flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-yellow-300">{quizData.name}</h1>
        <button
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-bold shadow-md"
          onClick={handleBack}
          disabled={isViolatingRef.current}
        >
          {isSubmitted ? 'Back to Dashboard' : 'End Quiz'}
        </button>
      </header>

      <div className="w-full max-w-xl bg-gray-800 p-8 rounded-xl shadow-2xl space-y-8">
        <div className="flex justify-between text-lg font-medium border-b pb-4 border-gray-700">
          <span className='text-gray-400'>Time Remaining: {formatTime(timeLeft)}</span>
          <span className={`font-bold ${violations >= MAX_VIOLATIONS ? 'text-red-500' : 'text-yellow-400'}`}>Violations: {violations}</span>
        </div>

        {quizData.questions.map((q, index) => {
          const qId = `q_${q.id || index}`; // Ensure a unique ID for state tracking

          return (
            <div key={qId} className="p-5 border border-gray-700 rounded-lg space-y-3 bg-gray-700 shadow-inner">
              <p className="font-semibold text-xl">{index + 1}. {q.text} <span className='text-sm text-gray-400'>({q.type})</span></p>
              
              <div className="flex flex-col gap-2">
                
                {(q.type === 'Multiple Choice' || q.type === 'True or False') && q.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => !isSubmitted && handleSelect(qId, opt)}
                    disabled={isSubmitted || isViolatingRef.current}
                    className={`px-4 py-3 text-left rounded-lg transition-all duration-150 ${
                      answers[qId] === opt 
                        ? (isSubmitted ? "bg-blue-800" : "bg-blue-600") 
                        : "bg-gray-600 hover:bg-gray-500"
                    } ${isSubmitted ? 'cursor-default opacity-70' : 'hover:scale-[1.01]'}`}
                  >
                    {opt}
                  </button>
                ))}

                {(q.type === 'Short Answer' || q.type === 'Essay') && (
                    <textarea
                        rows={q.type === 'Essay' ? 4 : 2}
                        placeholder={`Enter your ${q.type.toLowerCase()} answer here...`}
                        value={answers[qId] || ''}
                        onChange={(e) => handleSelect(qId, e.target.value)}
                        disabled={isSubmitted || isViolatingRef.current}
                        className="w-full p-3 rounded bg-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                    />
                )}
              </div>
            </div>
          );
        })}

        {!isSubmitted ? (
          <button
            onClick={() => handleSubmit(false)}
            className="w-full px-4 py-3 bg-yellow-600 rounded-lg hover:bg-yellow-500 font-bold transition-all shadow-xl hover:scale-[1.01]"
            disabled={isViolatingRef.current}
          >
            Submit Quiz
          </button>
        ) : (
             <div className="text-center p-4 bg-gray-700 rounded-lg shadow-inner">
                <p className='text-2xl font-bold'>Your Answers Have Been Submitted</p>
                <p className='text-sm text-yellow-400 mt-2'>Please wait for the instructor to release the results.</p>
                <p className='text-sm text-gray-400 mt-2'>Violations Logged: {violations}</p>
             </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;