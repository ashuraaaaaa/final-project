import React, { useState, useEffect } from 'react';
import { addQuiz, generateQuizId, loadQuizzes, saveQuizzes } from '../../utils/quizStorage.js'; 

const questionTypes = ["Identification", "Multiple Choice", "True or False", "Essay"];

const QuizCreationPage = ({ setScreen, setModal }) => {
    const [quizName, setQuizName] = useState('');
    const [duration, setDuration] = useState(15); 
    const [questions, setQuestions] = useState([]);
    
    // Edit & Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [editQuizId, setEditQuizId] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false); 

    // --- CHECK FOR EDIT MODE ON LOAD ---
    useEffect(() => {
        const editId = localStorage.getItem('editQuizId');
        if (editId) {
            const all = loadQuizzes();
            const quizToEdit = all.find(q => q.id.toString() === editId.toString());
            if (quizToEdit) {
                setIsEditing(true);
                setEditQuizId(quizToEdit.id);
                setQuizName(quizToEdit.name);
                setDuration(quizToEdit.duration);
                setQuestions(quizToEdit.questions || []);
            }
        }
    }, []);

    const handleAddQuestion = () => {
        setQuestions([...questions, { 
            id: Date.now() + questions.length,
            text: '', 
            type: 'Multiple Choice', 
            options: ['', ''], 
            answer: '', 
            score: 1,
            rubric: [] 
        }]);
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;

        if (field === 'type') {
            // Logic for switching types
            if (value === 'True or False') {
                newQuestions[index].options = ['True', 'False'];
            } else if (value === 'Multiple Choice') {
                newQuestions[index].options = ['', ''];
            } else {
                newQuestions[index].options = [];
            }

            newQuestions[index].answer = ''; 
            
            if (value === 'Essay') {
                newQuestions[index].rubric = [{ criteria: 'Content', points: 5 }];
                newQuestions[index].score = 5;
            } else {
                newQuestions[index].rubric = [];
                // Default score for Identification/Objective is 1, but user can edit it
                newQuestions[index].score = 1;
            }
        }
        setQuestions(newQuestions);
    };

    // --- RUBRIC HANDLERS ---
    const handleAddRubricRow = (qIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].rubric.push({ criteria: '', points: 5 });
        const total = newQuestions[qIndex].rubric.reduce((sum, r) => sum + Number(r.points), 0);
        newQuestions[qIndex].score = total;
        setQuestions(newQuestions);
    };

    const handleRubricChange = (qIndex, rIndex, field, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].rubric[rIndex][field] = field === 'points' ? Number(value) : value;
        const total = newQuestions[qIndex].rubric.reduce((sum, r) => sum + Number(r.points), 0);
        newQuestions[qIndex].score = total;
        setQuestions(newQuestions);
    };

    const handleRemoveRubricRow = (qIndex, rIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].rubric = newQuestions[qIndex].rubric.filter((_, i) => i !== rIndex);
        const total = newQuestions[qIndex].rubric.reduce((sum, r) => sum + Number(r.points), 0);
        newQuestions[qIndex].score = total;
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

    // --- SAVE LOGIC ---
    const handleSaveClick = () => {
        if (!quizName || questions.length === 0) {
            setModal({ message: "Please name the quiz and add at least one question.", type: "error" });
            return;
        }
        setShowConfirm(true); // Trigger Modal
    };

    const executeSave = () => {
        const timestamp = Date.now(); // Versioning timestamp

        if (isEditing) {
            // Update Existing
            const all = loadQuizzes();
            const updatedQuizzes = all.map(q => {
                if (q.id === editQuizId) {
                    return { 
                        ...q, 
                        name: quizName, 
                        duration: duration, 
                        questions: questions,
                        lastUpdated: timestamp // Update version
                    };
                }
                return q;
            });
            saveQuizzes(updatedQuizzes);
            localStorage.removeItem('editQuizId'); 
            setModal({ message: "Quiz updated successfully! Students can now retake the new version.", type: "success" });
        } else {
            // Create New
            const newQuiz = {
                id: generateQuizId(),
                name: quizName,
                duration: duration,
                violationThreshold: 3, 
                questions: questions,
                isPublished: true,
                lastUpdated: timestamp
            };
            addQuiz(newQuiz);
            setModal({ message: `Quiz "${quizName}" created! Share ID: ${newQuiz.id}`, type: "success" });
        }
        
        setShowConfirm(false);
        setScreen("instructor");
    };

    const handleCancel = () => {
        localStorage.removeItem('editQuizId');
        setScreen("instructor");
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center w-full">
            <div className="w-full max-w-3xl bg-gray-800 p-8 rounded-xl shadow-2xl space-y-8">
                <header className="flex justify-between items-center border-b pb-4 border-gray-700">
                    <h1 className="text-3xl font-bold text-blue-400">{isEditing ? "Edit Quiz" : "Create New Quiz"}</h1>
                    <button className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 font-bold" onClick={handleCancel}>← Back</button>
                </header>

                <div className="bg-gray-700 p-5 rounded-lg space-y-4">
                    <h2 className="text-xl font-semibold text-green-400">Quiz Settings</h2>
                    <input type="text" placeholder="Quiz Name" value={quizName} onChange={(e) => setQuizName(e.target.value)} className="w-full p-3 rounded bg-gray-600 text-white" />
                    <div className="flex gap-4">
                        <label className="flex-1"><span className="text-sm text-gray-400">Duration (mins)</span><input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full p-3 rounded bg-gray-600" /></label>
                        <div className="flex-1"><span className="text-sm text-gray-400">Monitoring</span><div className="w-full p-3 rounded bg-gray-600 text-gray-300">Enabled (Silent)</div></div>
                    </div>
                </div>

                <h2 className="text-2xl font-semibold text-yellow-400 border-b pb-2 border-gray-700">Questions ({questions.length})</h2>
                {questions.map((q, qIndex) => (
                    <div key={q.id} className="bg-gray-700 p-5 rounded-lg border border-yellow-500 space-y-3 shadow-md">
                        <p className="font-bold text-lg">Question {qIndex + 1}</p>
                        <input type="text" placeholder="Question Text" value={q.text} onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)} className="w-full p-3 rounded bg-gray-600 text-white mb-3" />
                        
                        <div className="flex gap-4 mb-4">
                             <label className="flex-1"><span className="text-sm text-gray-400">Type</span>
                                <select value={q.type} onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)} className="w-full p-3 rounded bg-gray-600 text-white">
                                    {questionTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                             </label>
                             <label className="flex-1"><span className="text-sm text-gray-400">Total Score (Editable)</span>
                                <input 
                                    type="number" 
                                    value={q.score} 
                                    onChange={(e) => handleQuestionChange(qIndex, 'score', Number(e.target.value))} 
                                    className="w-full p-3 rounded bg-gray-600" 
                                    // Score is only locked for Essay because Rubric determines it. Editable for others.
                                    readOnly={q.type === 'Essay'} 
                                />
                             </label>
                        </div>

                        {/* === RUBRIC TABLE (ONLY FOR ESSAY) === */}
                        {q.type === 'Essay' && (
                            <div className="p-4 bg-gray-800 rounded border border-blue-500">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-blue-300 font-bold">Grading Rubric Criteria</h3>
                                    <span className="text-xs text-gray-400">Define criteria and points below</span>
                                </div>
                                <table className="w-full text-left text-sm text-gray-300 mb-3 border-collapse">
                                    <thead><tr className="border-b border-gray-600"><th className="pb-2 pl-1">Criteria Description</th><th className="pb-2 w-24 text-center">Points</th><th className="pb-2 w-10"></th></tr></thead>
                                    <tbody>
                                        {q.rubric && q.rubric.map((r, rIndex) => (
                                            <tr key={rIndex} className="border-b border-gray-700">
                                                <td className="py-2 pr-2"><input type="text" placeholder="e.g. Grammar..." value={r.criteria} onChange={(e) => handleRubricChange(qIndex, rIndex, 'criteria', e.target.value)} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none" /></td>
                                                <td className="py-2 pr-2"><input type="number" min="1" value={r.points} onChange={(e) => handleRubricChange(qIndex, rIndex, 'points', e.target.value)} className="w-full p-2 rounded bg-gray-700 text-white text-center border border-gray-600 focus:border-blue-500 outline-none" /></td>
                                                <td className="py-2 text-center"><button onClick={() => handleRemoveRubricRow(qIndex, rIndex)} className="text-red-400 font-bold hover:text-red-200 text-lg">&times;</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button onClick={() => handleAddRubricRow(qIndex)} className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-blue-300 border border-dashed border-blue-500">+ Add Criteria Row</button>
                            </div>
                        )}

                        {/* === IDENTIFICATION (Formerly Short Answer) === */}
                        {q.type === 'Identification' && (
                            <div className="pt-3">
                                <span className="text-sm text-gray-400 block mb-1">Correct Answers (Accepts Multiple)</span>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 'Gray or Grey' (Use 'or' to separate accepted answers)" 
                                    value={q.answer} 
                                    onChange={(e) => handleQuestionChange(qIndex, 'answer', e.target.value)} 
                                    className="w-full p-3 rounded bg-gray-600 text-white" 
                                />
                            </div>
                        )}

                        {/* === OPTIONS (MC / True False) === */}
                        {(q.type === 'Multiple Choice' || q.type === 'True or False') && (
                            <div className="space-y-2 pt-3">
                                <span className="text-sm font-semibold text-gray-300 block">Options & Correct Answer</span>
                                {q.options.map((option, oIndex) => (
                                    <div key={oIndex} className="flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            placeholder={`Option ${oIndex + 1}`} 
                                            value={option} 
                                            // Lock inputs for True/False
                                            disabled={q.type === 'True or False'} 
                                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} 
                                            className="flex-1 p-2 rounded bg-gray-600 text-white disabled:opacity-70 disabled:cursor-not-allowed" 
                                        />
                                        <label className='flex items-center gap-1 text-sm'>
                                            <input type="radio" name={`answer-${qIndex}`} checked={q.answer === option} onChange={() => handleQuestionChange(qIndex, 'answer', option)} className='form-radio text-blue-500' /> Answer
                                        </label>
                                        {/* Only show remove/add for MC */}
                                        {q.type === 'Multiple Choice' && q.options.length > 2 && <button onClick={() => handleRemoveOption(qIndex, oIndex)} className="text-red-400">&times;</button>}
                                    </div>
                                ))}
                                {q.type === 'Multiple Choice' && <button onClick={() => handleAddOption(qIndex)} className="mt-2 px-3 py-1 bg-blue-500 rounded text-sm">+ Add Option</button>}
                            </div>
                        )}

                        <button onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))} className="mt-4 px-3 py-1 bg-red-600 rounded text-sm w-full hover:bg-red-500">Remove Question</button>
                    </div>
                ))}
                
                <button onClick={handleAddQuestion} className="w-full px-4 py-3 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg hover:bg-gray-700 font-bold">+ Add Question</button>
                <button onClick={handleSaveClick} className="w-full px-4 py-3 bg-green-600 rounded-lg hover:bg-green-500 font-bold shadow-xl">{isEditing ? "Update Quiz" : "Save and Publish Quiz"}</button>
            </div>

            {/* --- CONFIRMATION MODAL --- */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-6 rounded-xl w-full max-w-sm border border-green-500 shadow-2xl text-center">
                        <h3 className="text-xl font-bold text-white mb-2">Confirm {isEditing ? "Update" : "Publish"}?</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to {isEditing ? "update" : "publish"} this quiz? Students will see the changes immediately.</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setShowConfirm(false)} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white">Cancel</button>
                            <button onClick={executeSave} className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 text-white font-bold">Yes, {isEditing ? "Update" : "Publish"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizCreationPage;