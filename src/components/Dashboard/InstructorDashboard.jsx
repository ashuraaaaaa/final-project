import React, { useState, useEffect } from 'react';
import { clearCurrentUser, loadUsers } from '../../utils/storage.js'; 
import { loadQuizzes, deleteQuiz, saveQuizzes } from '../../utils/quizStorage.js'; 

const InstructorDashboard = ({ setScreen, currentUser, setModal }) => {
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [allQuizzes, setAllQuizzes] = useState([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [selectedQuiz, setSelectedQuiz] = useState(null); 
    const [viewingSubmissions, setViewingSubmissions] = useState([]);

    // Stores temporary scores for the rubric: { "q_1_criteria_0": 5, "q_1_criteria_1": 3 }
    const [rubricScores, setRubricScores] = useState({});

    useEffect(() => {
        setAllQuizzes(loadQuizzes());
        setTotalStudents(loadUsers().filter(u => u.role === "Student").length);
    }, []);

    const getQuizStats = (quizId) => {
        const submissions = JSON.parse(localStorage.getItem(`quiz_submissions_${quizId}`) || '[]');
        return {
            totalSubmissions: submissions.length,
            totalViolations: submissions.reduce((sum, sub) => sum + (sub.violations || 0), 0),
            isReleased: allQuizzes.find(q => q.id === quizId)?.isReleased || false
        };
    };

    const formatTimeTaken = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    const handleViewDetails = (quiz) => {
        const submissions = JSON.parse(localStorage.getItem(`quiz_submissions_${quiz.id}`) || '[]');
        setViewingSubmissions(submissions);
        setSelectedQuiz(quiz);
    };

    const handleReleaseResults = (quizId) => {
        const submissions = JSON.parse(localStorage.getItem(`quiz_submissions_${quizId}`) || '[]');
        if (submissions.length > 0) {
            const updatedSubmissions = submissions.map(sub => ({ ...sub, isReleased: true }));
            localStorage.setItem(`quiz_submissions_${quizId}`, JSON.stringify(updatedSubmissions));
        }
        const updatedQuizzes = allQuizzes.map(q => q.id === quizId ? { ...q, isReleased: true } : q);
        saveQuizzes(updatedQuizzes); 
        setAllQuizzes(updatedQuizzes); 
        setModal({ message: `Results for Quiz ID ${quizId} released.`, type: "success" });
    }

    const handleDeleteQuiz = (quizId) => {
        setModal({
            message: "Are you sure you want to delete this quiz?",
            type: "error",
            onConfirm: () => {
                deleteQuiz(quizId);
                localStorage.removeItem(`quiz_submissions_${quizId}`); 
                setAllQuizzes(loadQuizzes()); 
            }
        });
    };

    const handleLogout = () => {
        clearCurrentUser(); 
        setScreen("login");
    };

    // --- GRADING LOGIC ---
    const updateRubricScore = (qId, criteriaIndex, score, maxPoints) => {
        // 1. Clamp score between 0 and maxPoints
        const validScore = Math.min(Math.max(0, Number(score)), maxPoints);
        
        // 2. Update local rubric state
        const key = `${qId}_c_${criteriaIndex}`;
        const newRubricScores = { ...rubricScores, [key]: validScore };
        setRubricScores(newRubricScores);

        // 3. Recalculate TOTAL score for this specific question
        // Note: This requires summing up all criteria keys for this question
        const questionTotal = Object.keys(newRubricScores)
            .filter(k => k.startsWith(`${qId}_c_`))
            .reduce((sum, k) => sum + newRubricScores[k], 0);

        // 4. Update the Main Submission Object in real-time
        // We need to calculate the GRAND TOTAL for the whole quiz
        let grandTotal = 0;
        
        selectedQuiz.questions.forEach((q, idx) => {
            const currentQId = `q_${q.id || idx}`;
            if (q.type === 'Essay' && q.rubric) {
                // Sum rubric parts for this question
                let qSum = 0;
                q.rubric.forEach((_, rIdx) => {
                    qSum += (newRubricScores[`${currentQId}_c_${rIdx}`] || 0);
                });
                grandTotal += qSum;
            } else {
                // For non-essay, keep existing score if correct
                // (Simplified: assuming objective questions were auto-graded correctly previously)
                // In a robust app, we'd store per-question scores. 
                // Here, we add non-essay scores if they were correct.
                if (selectedSubmission.answers[currentQId] === q.answer) {
                    grandTotal += q.score;
                }
            }
        });

        // 5. Save to Storage
        const quizKey = `quiz_submissions_${selectedQuiz.id}`;
        const subs = JSON.parse(localStorage.getItem(quizKey) || "[]");
        const updatedSubs = subs.map(s => 
            s.studentId === selectedSubmission.studentId ? { ...s, score: grandTotal } : s
        );
        localStorage.setItem(quizKey, JSON.stringify(updatedSubs));
        
        // 6. Update UI
        setViewingSubmissions(updatedSubs);
        setSelectedSubmission({ ...selectedSubmission, score: grandTotal });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col w-full max-w-5xl mx-auto">
            <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
                <h1 className="text-3xl font-extrabold text-green-300">Instructor Dashboard</h1>
                <button className="px-4 py-2 bg-red-600 rounded-xl hover:bg-red-700 transition-colors font-bold shadow-md" onClick={handleLogout}>Logout</button>
            </header>

            {/* --- SUBMISSIONS LIST --- */}
            {selectedQuiz && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-6 rounded-xl w-full max-w-5xl border border-blue-500 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                            <h2 className="text-2xl font-bold text-blue-300">Submissions: {selectedQuiz.name}</h2>
                            <button onClick={() => setSelectedQuiz(null)} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white">Close</button>
                        </div>
                        {viewingSubmissions.length === 0 ? <p className="text-center text-gray-400 py-8">No students yet.</p> : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-700 text-gray-300">
                                        <th className="p-3">Student Name</th>
                                        <th className="p-3">Total Score</th>
                                        <th className="p-3">Time</th>
                                        <th className="p-3">Violations</th>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewingSubmissions.map((sub, idx) => (
                                        <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700">
                                            <td className="p-3 font-semibold">{sub.studentName}</td>
                                            <td className="p-3 text-green-400 font-bold text-lg">{sub.score} / {sub.totalScore}</td>
                                            <td className="p-3">{formatTimeTaken(sub.timeTaken)}</td>
                                            <td className={`p-3 font-bold ${sub.violations > 0 ? 'text-red-400' : 'text-gray-400'}`}>{sub.violations}</td>
                                            <td className="p-3 text-sm text-gray-400">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                                            <td className="p-3">
                                                <button onClick={() => { setSelectedSubmission(sub); setRubricScores({}); }} className="px-3 py-1 bg-blue-600 rounded text-xs font-bold hover:bg-blue-500 shadow">Grade / View</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <div className="mt-6 flex justify-end">
                             <button onClick={() => { handleReleaseResults(selectedQuiz.id); setSelectedQuiz(null); }} className={`px-6 py-2 rounded font-bold ${selectedQuiz.isReleased ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'}`} disabled={selectedQuiz.isReleased}>
                                {selectedQuiz.isReleased ? "Results Released" : "Release All Results"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- GRADING MODAL WITH TABLE --- */}
            {selectedSubmission && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-6 rounded-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto border border-green-500 shadow-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-green-300">Grading: {selectedSubmission.studentName}</h2>
                                <p className='text-gray-400 text-sm'>Enter scores in the table boxes below.</p>
                            </div>
                            <div className='text-right'>
                                <span className='block text-xs text-gray-400'>Current Total</span>
                                <span className='text-3xl font-bold text-yellow-400'>{selectedSubmission.score} <span className='text-lg text-gray-500'>/ {selectedSubmission.totalScore}</span></span>
                            </div>
                            <button onClick={() => setSelectedSubmission(null)} className="px-6 py-3 bg-gray-600 rounded font-bold hover:bg-gray-500">Done</button>
                        </div>

                        {/* --- THE GRADING TABLE --- */}
                        <div className="overflow-x-auto rounded-lg border border-gray-700">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-900 text-gray-300 text-sm uppercase tracking-wide">
                                        <th className="p-4 border-b border-gray-700 w-1/4">Question</th>
                                        <th className="p-4 border-b border-gray-700 w-1/3">Student Answer</th>
                                        <th className="p-4 border-b border-gray-700 w-1/3">Grading Criteria</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {selectedQuiz.questions.map((q, index) => {
                                        const qId = `q_${q.id || index}`;
                                        const studentAns = selectedSubmission.answers[qId];
                                        
                                        return (
                                            <tr key={qId} className="hover:bg-gray-750 transition-colors">
                                                {/* Question Text */}
                                                <td className="p-4 align-top">
                                                    <span className="font-bold text-white block mb-1">Q{index + 1}</span>
                                                    <span className="text-gray-300 text-sm">{q.text}</span>
                                                    <span className="block mt-2 text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded w-fit">{q.type}</span>
                                                </td>

                                                {/* Student Answer */}
                                                <td className="p-4 align-top">
                                                    <div className="bg-gray-900 p-3 rounded text-white whitespace-pre-wrap border border-gray-700 min-h-[50px]">
                                                        {studentAns || <span className='text-gray-500 italic'>(No Answer)</span>}
                                                    </div>
                                                </td>

                                                {/* Criteria & Score Inputs */}
                                                <td className="p-4 align-top">
                                                    {q.type === 'Essay' && q.rubric && q.rubric.length > 0 ? (
                                                        <table className="w-full text-sm">
                                                            <tbody>
                                                                {q.rubric.map((r, rIdx) => (
                                                                    <tr key={rIdx} className="border-b border-gray-700 last:border-0">
                                                                        <td className="py-2 text-gray-300 w-2/3">{r.criteria}</td>
                                                                        <td className="py-2 w-1/3 text-right">
                                                                            <div className="flex items-center justify-end gap-1">
                                                                                <input 
                                                                                    type="number" 
                                                                                    min="0" 
                                                                                    max={r.points} 
                                                                                    className="w-16 p-1 bg-gray-700 text-white border border-blue-500 rounded text-center font-bold"
                                                                                    // Default to 0 if not graded yet, this is strictly manual for now
                                                                                    value={rubricScores[`${qId}_c_${rIdx}`] || 0}
                                                                                    onChange={(e) => updateRubricScore(qId, rIdx, e.target.value, r.points)}
                                                                                />
                                                                                <span className="text-gray-500">/ {r.points}</span>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        // Fallback for non-essay or no rubric
                                                        <div className="text-sm text-green-300">
                                                            {q.type !== 'Essay' ? (
                                                                <>
                                                                    <span className='text-gray-500 block text-xs'>Correct Answer:</span>
                                                                    {q.answer}
                                                                    <div className="mt-2 text-right">
                                                                        <span className="font-bold text-white">
                                                                            {studentAns === q.answer ? q.score : 0} / {q.score}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            ) : <span className="text-gray-500 italic">No rubric defined.</span>}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-4 border-gray-700 text-green-400">Quiz Management</h2>
                <button className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors font-bold shadow-md flex items-center gap-2" onClick={() => setScreen("createQuiz")}><span className='text-2xl'>+</span> Create New Quiz</button>
                <h2 className="text-2xl font-semibold border-b pb-2 border-gray-700 text-green-400 mt-8">Active Quizzes & Monitoring</h2>
                <p className='text-sm text-gray-400'>Total Students Registered: {totalStudents}</p>
                <div className='overflow-x-auto'>
                    <table className="w-full min-w-[700px] table-auto border-collapse rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-gray-700 text-left">
                                <th className="px-4 py-3 border-b border-gray-600">ID</th>
                                <th className="px-4 py-3 border-b border-gray-600">Name</th>
                                <th className="px-4 py-3 border-b border-gray-600">Submissions</th>
                                <th className="px-4 py-3 border-b border-gray-600">Violations</th>
                                <th className="px-4 py-3 border-b border-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allQuizzes.map(quiz => {
                                const stats = getQuizStats(quiz.id);
                                return (
                                    <tr key={quiz.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                                        <td className="px-4 py-3 font-mono text-yellow-400">{quiz.id}</td>
                                        <td className="px-4 py-3 font-semibold">{quiz.name}</td>
                                        <td className="px-4 py-3">{stats.totalSubmissions} / {totalStudents}</td>
                                        <td className={`px-4 py-3 font-bold ${stats.totalViolations > 0 ? 'text-red-400' : 'text-green-400'}`}>{stats.totalViolations}</td>
                                        <td className="px-4 py-3 flex gap-2">
                                            <button onClick={() => handleViewDetails(quiz)} className="px-3 py-1 text-xs rounded font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors">View</button>
                                            <button onClick={() => handleReleaseResults(quiz.id)} className={`px-3 py-1 text-xs rounded font-bold ${stats.isReleased ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'}`} disabled={stats.isReleased || stats.totalSubmissions === 0}>{stats.isReleased ? 'Released' : 'Release'}</button>
                                            <button onClick={() => handleDeleteQuiz(quiz.id)} className="px-3 py-1 text-xs rounded font-bold bg-red-600 hover:bg-red-500 text-white transition-colors">Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InstructorDashboard;