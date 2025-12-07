// src/components/Quiz/QuizPage.js
import React, { useState } from 'react';

const QuizPage = ({ setScreen, setModal }) => {
  const questions = [
    { id: 1, question: "What is 2 + 2?", options: ["2", "3", "4"], answer: "4" },
    { id: 2, question: "Capital of France?", options: ["Paris", "Rome", "Berlin"], answer: "Paris" },
    { id: 3, question: "Which hook manages state in React?", options: ["useEffect", "useState", "useContext"], answer: "useState" },
  ];

  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  const handleSelect = (qId, option) => setAnswers({ ...answers, [qId]: option });
  
  const handleSubmit = () => {
    let finalScore = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.answer) {
        finalScore++;
      }
    });

    setScore(finalScore);
    setIsSubmitted(true);
    setModal({ 
        message: `Quiz submitted successfully! You scored ${finalScore} out of ${questions.length}.`, 
        type: "success" 
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center w-full">
      <header className="w-full max-w-xl flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-yellow-300">Sample Quiz</h1>
        <button
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-bold shadow-md"
          onClick={handleBack}
        >
          {isSubmitted ? 'Back to Dashboard' : 'End Quiz'}
        </button>
      </header>

      <div className="w-full max-w-xl bg-gray-800 p-8 rounded-xl shadow-2xl space-y-8">
        <div className="flex justify-between text-lg font-medium border-b pb-4 border-gray-700">
          <span className='text-gray-400'>Time Remaining: 15:00</span>
          <span className='text-gray-400'>Violations: 0</span>
        </div>

        {questions.map(q => {
          const isCorrect = isSubmitted && answers[q.id] === q.answer;
          const isIncorrect = isSubmitted && answers[q.id] && answers[q.id] !== q.answer;

          return (
            <div key={q.id} className="p-5 border border-gray-700 rounded-lg space-y-3 bg-gray-700 shadow-inner">
              <p className="font-semibold text-xl">{q.id}. {q.question}</p>
              
              <div className="flex flex-col gap-2">
                {q.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => !isSubmitted && handleSelect(q.id, opt)}
                    disabled={isSubmitted}
                    className={`px-4 py-3 text-left rounded-lg transition-all duration-150 ${
                      answers[q.id] === opt 
                        ? (isSubmitted ? (isCorrect ? "bg-green-600" : "bg-red-600") : "bg-blue-600") 
                        : "bg-gray-600 hover:bg-gray-500"
                    } ${isSubmitted ? 'cursor-default' : 'hover:scale-[1.01]'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {isSubmitted && isIncorrect && (
                  <p className="text-sm text-green-400 mt-2">Correct Answer: {q.answer}</p>
              )}
            </div>
          );
        })}

        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            className="w-full px-4 py-3 bg-yellow-600 rounded-lg hover:bg-yellow-500 font-bold transition-all shadow-xl hover:scale-[1.01]"
          >
            Submit Quiz
          </button>
        ) : (
             <div className="text-center p-4 bg-gray-700 rounded-lg shadow-inner">
                <p className='text-2xl font-bold'>Final Score: <span className='text-yellow-400'>{score} / {questions.length}</span></p>
                <p className='text-sm text-gray-400 mt-2'>Your results have been recorded.</p>
             </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;