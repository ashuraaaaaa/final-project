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
        
        // If a submission exists, load it state (Review Mode or Just Submitted)
        if (mySub) {
            setAnswers(mySub.answers || {});
            setViolations(mySub.violations || 0);
            setIsSubmitted(true);
            
            // If the instructor has released results, enable Review Mode logic
            if (mySub.isReleased) {
                setIsReviewMode(true);
            }
        } else {
            // No submission found (New attempt or Retake), start timer
            setTimeLeft(data.duration * 60); 
        }
    } else {
        setModal({ message: "Error: Quiz not found.", type: "error" });
        setScreen("student");
    }
  }, [activeQuizId, setScreen, setModal]);
  
  // --- 2. VIOLATION LOGIC ---
  useEffect(() => {
    if (isSubmitted) return;

    // Trigger Warning at 2 violations
    if (violations === 2) {
        setModal({
            message: "⚠️ WARNING: You have switched tabs 2 times! This is your final warning. If you switch again, your quiz will be automatically submitted.",
            type: "warning"
        });
    }

    // Trigger Fail/Auto-submit at 3 violations
    if (violations >= 3) {
        handleSubmit(true, true); // isAuto=true, isViolationLimit=true
    }
  }, [violations, isSubmitted]);

  // --- 3. Timer & Silent Detection ---
  useEffect(() => {
    if (!quizData || isSubmitted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          handleSubmit(true, false); // Time up
          return 0;
        }
        return prevTime - 1;
      });
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    const handleVisibilityChange = () => {
      // Only count violation if the document is hidden and we aren't already flagging it
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

  const handleSelect = (qId, option) => {
    if (isSubmitted) return;
    setAnswers({ ...answers, [qId]: option });
  };

  const handleSubmit = (isAuto = false, isViolationLimit = false) => {
    if (isSubmitted) return; 

    let finalScore = 0;
    const totalScore = quizData.questions.reduce((sum, q) => sum + q.score, 0);

    // Auto-Grading Logic
    quizData.questions.forEach(q => {
      const qKey = `q_${q.id || q.index}`;
      const studentAnswer = (answers[qKey] || "").trim();

      // Logic for Identification: Check against multiple answers separated by " or "
      if (q.type === 'Identification') {
          const possibleAnswers = q.answer.split(' or ').map(a => a.trim().toLowerCase());
          if (possibleAnswers.includes(studentAnswer.toLowerCase())) {
              finalScore += q.score;
          }
      } 
      // Logic for Multiple Choice / True False
      else if (q.type !== 'Essay' && q.answer === answers[qKey]) {
        finalScore += q.score;
      }
    });

    const currentUser = loadCurrentUser(); 
    const newSubmission = {
      studentId: currentUser?.id,
      studentName: currentUser?.fullName || currentUser?.username,
      answers: answers, 
      score: finalScore,
      totalScore: totalScore,
      // Ensure we record at least 3 violations if triggered by violation limit
      violations: isViolationLimit ? 3 : violations,
      timeTaken: timeElapsed,
      isReleased: false,
      // Save version so we know if they need to retake later
      quizVersionTaken: quizData.lastUpdated || 0,
      submittedAt: new Date().toISOString()
    };

    const storageKey = `quiz_submissions_${activeQuizId}`; 
    const existingSubmissions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    // Filter out previous attempts by this user to avoid duplicates on retake
    const otherSubmissions = existingSubmissions.filter(sub => sub.studentId !== currentUser.id);
    otherSubmissions.push(newSubmission);
    localStorage.setItem(storageKey, JSON.stringify(otherSubmissions));

    setIsSubmitted(true);
    
    // Determine Modal Message
    let msg = "Quiz submitted! Results will be visible once released by your professor.";
    let type = "info";
    let onConfirm = null;

    if (isAuto) {
        if (isViolationLimit) {
            msg = "⛔ QUIZ TERMINATED: You exceeded the violation limit (3 tab switches). Your answers have been auto-submitted.";
            type = "error";
            onConfirm = () => setScreen("student"); 
        } else {
            msg = "Time expired. Quiz auto-submitted.";
            type = "warning";
        }
    }

    setModal({ message: msg, type: type, onConfirm: onConfirm });
  };

  if (!quizData) return <div className='text-xl text-yellow-500'>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center w-full">
      <header className="w-full max-w-xl flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-yellow-300">
            {quizData.name} {isReviewMode && <span className="text-sm bg-blue-600 px-2 py-1 rounded ml-2">REVIEW MODE</span>}
        </h1>
        <button
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-bold shadow-md"
          onClick={() => {
              if (isSubmitted) {
                  setScreen("student");
              } else {
                  setModal({
                      message: "Are you sure you want to leave? Your progress will be lost.",
                      type: "warning",
                      onConfirm: () => setScreen("student")
                  });
              }
          }}
          // Disable button only if user is actively taking quiz and currently tab-switching (rare edge case visual)
          disabled={!isSubmitted && isViolatingRef.current}
        >
          {isSubmitted ? 'Back to Dashboard' : 'End Quiz'}
        </button>
      </header>

      <div className="w-full max-w-xl bg-gray-800 p-8 rounded-xl shadow-2xl space-y-8">
        {!isSubmitted && (
            <div className="flex justify-between border-b pb-4 border-gray-700">
                <span className='text-gray-400'>Time: {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</span>
                <span className={`font-bold ${violations > 0 ? 'text-red-500' : 'text-yellow-400'}`}>Violations: {violations}/3</span>
            </div>
        )}

        {quizData.questions.map((q, index) => {
          const qId = `q_${q.id || index}`; 
          const studentAns = answers[qId];
          
          // Determine if answer is correct (for Review Mode highlighting)
          let isCorrect = false;
          if (isReviewMode) {
              const ans = (studentAns || "").trim();
              if (q.type === 'Identification') {
                  // Check against all "or" options
                  isCorrect = q.answer.split(' or ').map(a => a.trim().toLowerCase()).includes(ans.toLowerCase());
              } else {
                  isCorrect = ans === q.answer;
              }
          }

          return (
            <div key={qId} className={`p-5 border rounded-lg space-y-3 bg-gray-700 transition-all ${isReviewMode ? (isCorrect ? 'border-green-500 bg-green-900/10' : 'border-red-500 bg-red-900/10') : 'border-gray-700'}`}>
              <p className="font-semibold text-xl">{index + 1}. {q.text}</p>
              
              {/* RUBRIC / INSTRUCTION DISPLAY */}
              {/* Show rubric table for Essays */}
              {(q.type === 'Essay' && q.rubric && q.rubric.length > 0) ? (
                  <div className="mb-4 bg-gray-800 rounded border border-blue-500 overflow-hidden">
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
              ) : null}

              {/* Show simple instructions for Identification/Essay if no rubric */}
              {(q.type === 'Identification' || (q.type === 'Essay' && (!q.rubric || q.rubric.length === 0))) && q.answer && !isReviewMode && (
                  // Only show hints in review mode or if it's strictly instruction, usually answer key is hidden during quiz
                  // Note: For Identification, 'q.answer' is the key, so don't show it during quiz!
                  // Only show if it's specifically an Essay instruction text stored in 'answer' field (legacy check)
                  q.type === 'Essay' ? (
                    <div className="mb-4 bg-gray-800 p-3 rounded text-sm text-gray-300 border-l-4 border-blue-500">
                        <span className="font-bold text-blue-400">Instructions:</span> {q.answer}
                    </div>
                  ) : null
              )}

              <div className="flex flex-col gap-2">
                {/* Options for MC / True False */}
                {(q.type === 'Multiple Choice' || q.type === 'True or False') && q.options.map(opt => {
                  let btnStyle = "bg-gray-600";
                  if (studentAns === opt) btnStyle = isReviewMode ? (isCorrect ? "bg-green-600" : "bg-red-600") : "bg-blue-600";
                  if (isReviewMode && opt === q.answer) btnStyle = "bg-green-600 ring-2 ring-white shadow-lg";

                  return (
                    <button
                      key={opt}
                      disabled={isSubmitted || (isViolatingRef.current && !isSubmitted)}
                      onClick={() => handleSelect(qId, opt)}
                      className={`px-4 py-3 text-left rounded-lg font-medium ${btnStyle} ${isSubmitted ? 'cursor-default' : 'hover:bg-gray-500'}`}
                    >
                      {opt}
                      {isReviewMode && opt === q.answer && " ✓"}
                      {isReviewMode && opt === studentAns && !isCorrect && " ✗"}
                    </button>
                  );
                })}

                {/* Text Input for Identification / Essay */}
                {(q.type === 'Identification' || q.type === 'Essay') && (
                    <textarea
                        disabled={isSubmitted || isViolatingRef.current}
                        value={studentAns || ''}
                        onChange={(e) => handleSelect(qId, e.target.value)}
                        className={`w-full p-3 rounded bg-gray-600 border ${isReviewMode ? (isCorrect ? 'border-green-500' : 'border-red-500') : ''}`}
                        placeholder="Your answer..."
                        rows={q.type === 'Essay' ? 5 : 2}
                    />
                )}

                {/* Show Correct Answer in Review Mode */}
                {isReviewMode && q.type !== 'Essay' && !isCorrect && (
                    <div className="mt-2 p-2 bg-gray-800 rounded border border-yellow-600 text-yellow-200 text-sm">
                        <span className="font-bold">Correct Answer:</span> {q.answer}
                    </div>
                )}
              </div>
            </div>
          );
        })}

        {!isSubmitted ? (
          <button onClick={() => handleSubmit(false, false)} className="w-full py-4 bg-yellow-600 rounded-lg font-bold hover:bg-yellow-500" disabled={isViolatingRef.current}>
            Submit Quiz
          </button>
        ) : (
          <div className="text-center p-4 bg-gray-900 rounded-lg border border-gray-700">
             <p className='text-xl font-bold text-yellow-400'>{isReviewMode ? "Reviewing Results" : "Quiz Submitted"}</p>
             <p className='text-gray-400 text-sm mt-1'>{isReviewMode ? "You are viewing the correct answers." : "Your responses are locked. Results pending."}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;