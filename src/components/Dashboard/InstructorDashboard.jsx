import React, { useState, useEffect } from 'react';
import { clearCurrentUser, loadUsers, saveUsers, saveCurrentUser } from '../../utils/storage.js'; 
import { loadQuizzes, deleteQuiz, saveQuizzes } from '../../utils/quizStorage.js'; 

const InstructorDashboard = ({ setScreen, currentUser, setModal }) => {
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [allQuizzes, setAllQuizzes] = useState([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [selectedQuiz, setSelectedQuiz] = useState(null); 
    const [viewingSubmissions, setViewingSubmissions] = useState([]);

    // Stores temporary scores for the rubric: { "q_1_criteria_0": 5, "q_1_criteria_1": 3 }
    const [rubricScores, setRubricScores] = useState({});

    // --- PROFILE STATE ---
    const [showProfile, setShowProfile] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({ ...currentUser });

    useEffect(() => {
        setAllQuizzes(loadQuizzes());
        setTotalStudents(loadUsers().filter(u => u.role === "Student").length);
        setProfileData({ ...currentUser });
        
        // Clear edit session when entering dashboard to ensure fresh state
        localStorage.removeItem('editQuizId');
    }, [currentUser]);

    // --- PROFILE HANDLERS ---
    const handleSaveProfile = () => {
        const users = loadUsers();
        // Update the instructor in the main database
        const updatedUsers = users.map(u => u.id === currentUser.id ? profileData : u);
        saveUsers(updatedUsers);
        
        // Update the current session
        saveCurrentUser(profileData);
        
        setEditMode(false);
        setModal({ message: "Instructor profile updated successfully!", type: "success" });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileData({ ...profileData, profilePic: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

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

    // --- UPDATED DELETE HANDLER (Soft Delete) ---
    const handleDeleteQuiz = (quizId) => {
        setModal({
            message: "Are you sure you want to delete this quiz? It will be removed from your dashboard, but students will still have access to their results.",
            type: "error",
            onConfirm: () => {
                // 1. Soft Delete: Update 'isDeleted' flag instead of removing
                const updatedQuizzes = allQuizzes.map(q => 
                    q.id === quizId ? { ...q, isDeleted: true } : q
                );
                
                saveQuizzes(updatedQuizzes);
                setAllQuizzes(updatedQuizzes); 
                
                // 2. IMPORTANT: We do NOT remove `quiz_submissions_${quizId}`
                // This ensures student history is preserved.
            }
        });
    };

    const handleEditQuiz = (quizId) => {
        localStorage.setItem('editQuizId', quizId); 
        setScreen("createQuiz");
    };

    const handleLogout = () => {
        clearCurrentUser(); 
        setScreen("login");
    };

    // --- GRADING LOGIC ---
    const updateRubricScore = (qId, criteriaIndex, score, maxPoints) => {
        const validScore = Math.min(Math.max(0, Number(score)), maxPoints);
        
        const key = `${qId}_c_${criteriaIndex}`;
        const newRubricScores = { ...rubricScores, [key]: validScore };
        setRubricScores(newRubricScores);

        // Recalculate Grand Total
        let grandTotal = 0;
        selectedQuiz.questions.forEach((q, idx) => {
            const currentQId = `q_${q.id || idx}`;
            if (q.type === 'Essay' && q.rubric) {
                let qSum = 0;
                q.rubric.forEach((_, rIdx) => {
                    qSum += (newRubricScores[`${currentQId}_c_${rIdx}`] || 0);
                });
                grandTotal += qSum;
            } else {
                const studentAns = (selectedSubmission.answers[currentQId] || "").trim();
                
                if (q.type === 'Identification') {
                    // Check against "or" possibilities
                    const possibleAnswers = q.answer.split(' or ').map(a => a.trim().toLowerCase());
                    if (possibleAnswers.includes(studentAns.toLowerCase())) {
                        grandTotal += q.score;
                    }
                } else if (studentAns === q.answer) {
                    grandTotal += q.score;
                }
            }
        });

        const quizKey = `quiz_submissions_${selectedQuiz.id}`;
        const subs = JSON.parse(localStorage.getItem(quizKey) || "[]");
        const updatedSubs = subs.map(s => 
            s.studentId === selectedSubmission.studentId ? { ...s, score: grandTotal } : s
        );
        localStorage.setItem(quizKey, JSON.stringify(updatedSubs));
        
        setViewingSubmissions(updatedSubs);
        setSelectedSubmission({ ...selectedSubmission, score: grandTotal });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col w-full max-w-5xl mx-auto">
            <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
                <div className='flex items-center gap-4'>
                    {/* --- INSTRUCTOR PROFILE PIC --- */}
                    <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden border-2 border-green-500 cursor-pointer" onClick={() => setShowProfile(true)}>
                        {profileData.profilePic ? (
                            <img src={profileData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
                                {profileData.fullName?.[0] || "I"}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-green-300">Instructor Dashboard</h1>
                        <button onClick={() => setShowProfile(true)} className="text-xs text-gray-400 hover:text-white underline">Edit Profile</button>
                    </div>
                </div>
                <button className="px-4 py-2 bg-red-600 rounded-xl hover:bg-red-700 transition-colors font-bold shadow-md" onClick={handleLogout}>Logout</button>
            </header>

            {/* --- INSTRUCTOR PROFILE MODAL --- */}
            {showProfile && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-green-500 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-4 text-green-400">Instructor Profile</h2>
                        
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden border-4 border-green-500 mb-3">
                                {profileData.profilePic ? (
                                    <img src={profileData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-500">?</div>
                                )}
                            </div>
                            {editMode && (
                                <label className="cursor-pointer bg-green-600 px-3 py-1 rounded text-xs font-bold hover:bg-green-500">
                                    Change Photo
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <span className="text-gray-400 text-sm">Full Name</span>
                                {editMode ? 
                                    <input className="w-full p-2 rounded bg-gray-700 border border-green-500" value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} /> 
                                    : <p className="text-lg font-bold">{profileData.fullName}</p>
                                }
                            </div>
                            <div>
                                <span className="text-gray-400 text-sm">Username</span>
                                {editMode ? 
                                    <input className="w-full p-2 rounded bg-gray-700 border border-green-500" value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})} /> 
                                    : <p className="text-lg">{profileData.username}</p>
                                }
                            </div>
                            <div>
                                <span className="text-gray-400 text-sm">Contact Info</span>
                                {editMode ? 
                                    <input className="w-full p-2 rounded bg-gray-700 border border-green-500" value={profileData.contact} onChange={e => setProfileData({...profileData, contact: e.target.value})} /> 
                                    : <p className="text-lg">{profileData.contact || "N/A"}</p>
                                }
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 border-t border-gray-700 pt-4">
                            {editMode ? (
                                <>
                                    <button onClick={() => { setEditMode(false); setProfileData(currentUser); }} className="px-4 py-2 bg-gray-600 rounded">Cancel</button>
                                    <button onClick={handleSaveProfile} className="px-4 py-2 bg-green-600 rounded hover:bg-green-500">Save Changes</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setShowProfile(false)} className="px-4 py-2 bg-gray-600 rounded">Close</button>
                                    <button onClick={() => setEditMode(true)} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">Edit Profile</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                                                        <div className="text-sm text-green-300">
                                                            {q.type !== 'Essay' ? (
                                                                <>
                                                                    <span className='text-gray-500 block text-xs'>Correct Answer:</span>
                                                                    {q.answer}
                                                                    <div className="mt-2 text-right">
                                                                        <span className="font-bold text-white">
                                                                            {/* Calculate display score based on type logic */}
                                                                            {(() => {
                                                                                const ans = (studentAns || "").trim();
                                                                                let isCorrect = false;
                                                                                if (q.type === 'Identification') {
                                                                                    isCorrect = q.answer.split(' or ').map(a => a.trim().toLowerCase()).includes(ans.toLowerCase());
                                                                                } else {
                                                                                    isCorrect = ans === q.answer;
                                                                                }
                                                                                return isCorrect ? q.score : 0;
                                                                            })()} / {q.score}
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
                                <th className="px-4 py-3 border-b border-white-600">ID</th>
                                <th className="px-4 py-3 border-b border-white-600">Name</th>
                                <th className="px-4 py-3 border-b border-white-600">Submissions</th>
                                <th className="px-4 py-3 border-b border-white-600">Violations</th>
                                <th className="px-4 py-3 border-b border-white-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* FILTER: Show only quizzes NOT marked as deleted */}
                            {allQuizzes.filter(q => !q.isDeleted).map(quiz => {
                                const stats = getQuizStats(quiz.id);
                                return (
                                    <tr key={quiz.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                                        <td className="px-4 py-3 font-mono text-yellow-400">{quiz.id}</td>
                                        <td className="px-4 py-3 font-semibold">{quiz.name}</td>
                                        <td className="px-4 py-3">{stats.totalSubmissions} / {totalStudents}</td>
                                        <td className={`px-4 py-3 font-bold ${stats.totalViolations > 0 ? 'text-red-400' : 'text-green-400'}`}>{stats.totalViolations}</td>
                                        <td className="px-4 py-3 flex gap-2">
                                            <button onClick={() => handleViewDetails(quiz)} className="px-3 py-1 text-xs rounded font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors">View</button>
                                            
                                            <button onClick={() => handleEditQuiz(quiz.id)} className="px-3 py-1 text-xs rounded font-bold bg-yellow-600 hover:bg-yellow-500 text-white transition-colors">Edit</button>
                                            
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