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
  // NEW: check if instructor released score
const [isScoreReleased, setIsScoreReleased] = useState(false);


  const timerRef = useRef(null);
  const isViolatingRef = useRef(false);

  // --- SECURITY: PREVENT RE-TAKE ON RELOAD ---
  useEffect(() => {
    const currentUser = loadCurrentUser();
    const storageKey = `quiz_submissions_${activeQuizId}`;
    const existingSubmissions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const hasTaken = existingSubmissions.some(sub => sub.studentId === currentUser?.id);

    if (hasTaken) {
        setModal({ 
            message: "Access Denied: You have already attempted this quiz. Retakes are not allowed.", 
            type: "error",
            onConfirm: () => setScreen("student") 
        });
        setScreen("student"); 
    }
  }, [activeQuizId, setScreen, setModal]);

  // --- Load Quiz Data ---
  useEffect(() => {
    const data = findQuizById(activeQuizId);
    if (data) {
        setQuizData(data);
        setTimeLeft(data.duration * 60); 
    } else {
        setModal({ message: "Error: Quiz not found.", type: "error" });
        setScreen("student");
    }
  }, [activeQuizId, setScreen, setModal]);
  
  // --- VIOLATION LOGIC ---
  useEffect(() => {
    if (isSubmitted) return;

    if (violations === 2) {
        setModal({
            message: "⚠️ WARNING: You have switched tabs 2 times! This is your final warning. If you switch again, your quiz will be automatically submitted.",
            type: "warning"
        });
    }

    if (violations >= 3) {
        handleSubmit(true); 
    }
  }, [violations, isSubmitted]);

  // --- Timer & Silent Detection ---
  useEffect(() => {
    if (!quizData || isSubmitted) {
      clearInterval(timerRef.current);
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
      if (document.hidden) {
        if (isViolatingRef.current) return;
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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSelect = (qId, option) => setAnswers({ ...answers, [qId]: option });
  
  const handleSubmit = (isAuto = false) => {
    if (isSubmitted) return; 

    let finalScore = 0;
    const totalScore = quizData.questions.reduce((sum, q) => sum + q.score, 0);

    // Auto-grade only Objective type questions
    quizData.questions.forEach(q => {
      if (q.type !== 'Essay' && q.type !== 'Short Answer' && q.answer === answers[`q_${q.id || q.index}`]) {
        finalScore += q.score;
      }
    });

    const currentUser = loadCurrentUser(); 

    const newSubmission = {
      studentId: currentUser?.id,
      studentName: currentUser?.fullName || currentUser?.username,
      answers: answers, 
      score: finalScore, // Essays default to 0
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
    
    let submitMessage = "Quiz submitted successfully!";
    let modalType = "info";
    let onConfirmAction = null;

    if (isAuto) {
        if (violations >= 3) {
            submitMessage = "Quiz TERMINATED due to security violations (3 tabs opened).";
            modalType = "error";
            onConfirmAction = () => setScreen("student"); 
        } else {
            submitMessage = "Time expired. Quiz auto-submitted.";
            modalType = "warning";
        }
    }

    setModal({ 
        message: `${submitMessage} Your answers have been recorded.`, 
        type: modalType,
        onConfirm: onConfirmAction 
    });
  };

  const handleBack = () => {
    if (!isSubmitted) { 
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
          disabled={!isSubmitted && isViolatingRef.current}
        >
          {isSubmitted ? 'Back to Dashboard' : 'End Quiz'}
        </button>
      </header>

      <div className="w-full max-w-xl bg-gray-800 p-8 rounded-xl shadow-2xl space-y-8">
        <div className="flex justify-between text-lg font-medium border-b pb-4 border-gray-700">
          <span className='text-gray-400'>Time Remaining: {formatTime(timeLeft)}</span>
          <span className={`font-bold ${violations > 0 ? 'text-red-500' : 'text-yellow-400'}`}>
             Violations: {violations} / 3
          </span>
        </div>

        {quizData.questions.map((q, index) => {
          const qId = `q_${q.id || index}`; 

          return (
            <div key={qId} className="p-5 border border-gray-700 rounded-lg space-y-3 bg-gray-700 shadow-inner">
              <p className="font-semibold text-xl">{index + 1}. {q.text} <span className='text-sm text-gray-400'>({q.type} - {q.score}pts)</span></p>
              
              {/* --- UPDATED: Rubric Display (Table or Text) --- */}
              {(q.type === 'Essay' || q.type === 'Short Answer') && (
                  <div className="mb-4">
                      {q.rubric && q.rubric.length > 0 ? (
                          // RENDER TABLE RUBRIC
                          <div className="bg-gray-800 rounded border border-blue-500 overflow-hidden">
                              <div className="bg-blue-900/30 p-2 border-b border-blue-500/50">
                                  <span className="font-bold text-blue-300 text-sm uppercase">Grading Rubric</span>
                              </div>
                              <table className="w-full text-sm text-left text-gray-300">
                                  <thead>
                                      <tr className="bg-gray-900 border-b border-gray-700 text-xs uppercase">
                                          <th className="p-2 w-3/4">Criteria</th>
                                          <th className="p-2 w-1/4 text-right">Max Points</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-700">
                                      {q.rubric.map((r, i) => (
                                          <tr key={i} className="hover:bg-gray-700/50">
                                              <td className="p-2">{r.criteria}</td>
                                              <td className="p-2 text-right font-mono text-blue-200">{r.points}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      ) : q.answer ? (
                          // FALLBACK TO TEXT RUBRIC
                          <div className="bg-gray-800 p-3 rounded text-sm text-gray-300 border-l-4 border-blue-500">
                              <span className="font-bold text-blue-400">Instructions:</span> {q.answer}
                          </div>
                      ) : null}
                  </div>
              )}

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
                        rows={q.type === 'Essay' ? 5 : 2}
                        placeholder={`Type your answer here...`}
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
                <p className='text-2xl font-bold'>Quiz Submitted</p>
                <p className='text-sm text-yellow-400 mt-2'>Retakes are not allowed.</p>
             </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;