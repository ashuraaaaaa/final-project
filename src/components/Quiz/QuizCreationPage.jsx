import React, { useState } from 'react';
import { addQuiz, generateQuizId } from '../../utils/quizStorage.js'; 

const questionTypes = ["Short Answer", "Multiple Choice", "True or False", "Essay"];

const QuizCreationPage = ({ setScreen, setModal }) => {
    const [quizName, setQuizName] = useState('');
    const [duration, setDuration] = useState(15); // in minutes
    // State for tabsOpened/violationThreshold is permanently REMOVED.
    const [questions, setQuestions] = useState([]);

    const handleAddQuestion = () => {
        setQuestions([...questions, { 
            id: Date.now() + questions.length,
            text: '', 
            type: 'Multiple Choice', 
            options: ['', ''], 
            answer: '', 
            score: 1 
        }]);
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;

        if (field === 'type') {
            if (value === 'True or False') {
                newQuestions[index].options = ['True', 'False'];
                newQuestions[index].answer = '';
            } else if (value === 'Multiple Choice') {
                newQuestions[index].options = ['', ''];
                newQuestions[index].answer = '';
            } else {
                newQuestions[index].options = [];
                newQuestions[index].answer = '';
            }
        }
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    const handleRemoveOption = (qIndex, oIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
        setQuestions(newQuestions);
    };

    const handleAddOption = (qIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options.push('');
        setQuestions(newQuestions);
    };

    const handleSaveQuiz = () => {
        if (!quizName || questions.length === 0) {
            setModal({ message: "Please name the quiz and add at least one question.", type: "error" });
            return;
        }

        const newQuiz = {
            id: generateQuizId(),
            name: quizName,
            duration: duration,
            violationThreshold: 3, // Hardcoded for silent monitoring
            questions: questions,
            isPublished: true, 
        };
        
        addQuiz(newQuiz);
        
        setModal({ message: `Quiz "${quizName}" created successfully! Share this Quiz ID with students: ${newQuiz.id}`, type: "success" });
        setScreen("instructor");
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center w-full">
            <div className="w-full max-w-3xl bg-gray-800 p-8 rounded-xl shadow-2xl space-y-8">
                <header className="flex justify-between items-center border-b pb-4 border-gray-700">
                    <h1 className="text-3xl font-bold text-blue-400">Create New Quiz</h1>
                    <button
                        className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors font-bold shadow-md"
                        onClick={() => setScreen("instructor")}
                    >
                        ← Back
                    </button>
                </header>

                {/* --- Quiz Metadata (CLEANED) --- */}
                <div className="bg-gray-700 p-5 rounded-lg space-y-4">
                    <h2 className="text-xl font-semibold text-green-400">Quiz Settings</h2>
                    <input
                        type="text"
                        placeholder="Quiz Name (e.g., DCIT 26 Final Exam)"
                        value={quizName}
                        onChange={(e) => setQuizName(e.target.value)}
                        className="w-full p-3 rounded bg-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <div className="flex gap-4">
                        <label className="flex-1">
                            <span className="text-sm text-gray-400 block mb-1">Duration (minutes)</span>
                            <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min="1" className="w-full p-3 rounded bg-gray-600" />
                        </label>
                        
                        {/* The status indicator is kept, but the layout is adjusted for a clean, two-column form */}
                        <div className="flex-1"> 
                           <span className="text-sm text-gray-400 block mb-1">Monitoring Status</span>
                           <div className="w-full p-3 rounded bg-gray-600 text-sm text-gray-300">
                              Enabled (Silent Monitoring)
                           </div>
                        </div>
                    </div>
                </div>

                {/* --- Questions List --- */}
                <h2 className="text-2xl font-semibold text-yellow-400 border-b pb-2 border-gray-700">Questions ({questions.length})</h2>
                {questions.map((q, qIndex) => (
                    <div key={q.id} className="bg-gray-700 p-5 rounded-lg border border-yellow-500 space-y-3 shadow-md">
                        <p className="font-bold text-lg">Question {qIndex + 1}</p>
                        
                        <input
                            type="text"
                            placeholder="Question Text"
                            value={q.text}
                            onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                            className="w-full p-3 rounded bg-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                        />
                        
                        <div className="flex gap-4">
                             <label className="flex-1">
                                <span className="text-sm text-gray-400 block mb-1">Type</span>
                                <select 
                                    value={q.type} 
                                    onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                                    className="w-full p-3 rounded bg-gray-600 text-white"
                                >
                                    {questionTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                             </label>
                             <label className="flex-1">
                                <span className="text-sm text-gray-400 block mb-1">Score Value</span>
                                <input type="number" value={q.score} onChange={(e) => handleQuestionChange(qIndex, 'score', Number(e.target.value))} min="1" className="w-full p-3 rounded bg-gray-600" />
                             </label>
                        </div>

                        {/* --- Options and Answer Input --- */}
                        {(q.type === 'Multiple Choice' || q.type === 'True or False') && (
                            <div className="space-y-2 pt-3">
                                <span className="text-sm font-semibold text-gray-300 block">Options & Correct Answer</span>
                                {q.options.map((option, oIndex) => (
                                    <div key={oIndex} className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            placeholder={`Option ${oIndex + 1}`}
                                            value={option}
                                            disabled={q.type === 'True or False'}
                                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                            className="flex-1 p-2 rounded bg-gray-600 text-white"
                                        />
                                        <label className='flex items-center gap-1 text-sm'>
                                            <input
                                                type="radio"
                                                name={`answer-${qIndex}`}
                                                checked={q.answer === option}
                                                onChange={() => handleQuestionChange(qIndex, 'answer', option)}
                                                className='form-radio text-blue-500'
                                            />
                                            Answer
                                        </label>
                                        {q.type === 'Multiple Choice' && q.options.length > 2 && (
                                            <button 
                                                onClick={() => handleRemoveOption(qIndex, oIndex)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {q.type === 'Multiple Choice' && (
                                    <button 
                                        onClick={() => handleAddOption(qIndex)}
                                        className="mt-2 px-3 py-1 bg-blue-500 rounded text-sm hover:bg-blue-400"
                                    >
                                        + Add Option
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {/* --- Short Answer/Essay Answer Key --- */}
                        {(q.type === 'Short Answer' || q.type === 'Essay') && (
                            <div className="pt-3">
                                <span className="text-sm text-gray-400 block mb-1">Key Answer / Grading Notes (for instructor review)</span>
                                <textarea 
                                    rows={q.type === 'Essay' ? 4 : 1}
                                    placeholder={q.type === 'Essay' ? "Detailed grading rubric..." : "Exact key phrase..."}
                                    value={q.answer}
                                    onChange={(e) => handleQuestionChange(qIndex, 'answer', e.target.value)}
                                    className="w-full p-3 rounded bg-gray-600 text-white"
                                />
                            </div>
                        )}

                        <button 
                            onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                            className="mt-3 px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-500"
                        >
                            Remove Question
                        </button>
                    </div>
                ))}
                
                <button
                    onClick={handleAddQuestion}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors font-bold"
                >
                    + Add Question
                </button>

                {/* --- Save Button --- */}
                <button
                    onClick={handleSaveQuiz}
                    className="w-full px-4 py-3 bg-green-600 rounded-lg hover:bg-green-500 font-bold transition-all shadow-xl hover:scale-[1.01]"
                >
                    Save and Publish Quiz
                </button>
            </div>
        </div>
    );
};

export default QuizCreationPage;