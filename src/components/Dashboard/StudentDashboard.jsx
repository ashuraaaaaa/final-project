import React, { useState, useEffect } from 'react';
import { clearCurrentUser, loadUsers, saveUsers, saveCurrentUser, loadCurrentUser } from '../../utils/storage.js'; 
import { findQuizById, loadJoinedQuizzes, joinQuiz, unjoinQuiz } from '../../utils/quizStorage.js'; 
import { timeAgo, formatDate } from '../../utils/dateUtils'; 

const StudentDashboard = ({ setScreen, currentUser, setCurrentUser, setModal, setActiveQuizId }) => {
  const [joinedQuizzes, setJoinedQuizzes] = useState([]);
  const [quizIdEntry, setQuizIdEntry] = useState(''); 
  const [editMode, setEditMode] = useState(false);
  
  // Use local state for profile data so we don't trigger App re-renders constantly
  const [profileData, setProfileData] = useState(currentUser || {});

  const [activeModal, setActiveModal] = useState(null); 
  const [showInstructions, setShowInstructions] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);

  // --- 1. Load Data safely ---
  useEffect(() => {
    const freshUser = loadCurrentUser(); 
    const userToUse = freshUser || currentUser;

    if (userToUse && userToUse.id) {
        const joinedIds = loadJoinedQuizzes(userToUse.id);
        
        const validQuizzes = [];
        const validIds = [];
        let foundGhostData = false;

        joinedIds.forEach(id => {
            const quiz = findQuizById(id);
            if (quiz) {
                validQuizzes.push(quiz);
                validIds.push(id);
            } else {
                foundGhostData = true; 
            }
        });

        if (foundGhostData) {
            localStorage.setItem(`app_joined_quizzes_${userToUse.id}`, JSON.stringify(validIds));
        }

        const pending = [];
        const completed = [];

        validQuizzes.forEach(quiz => {
            let takenRecord = userToUse.takenQuizzes?.find(q => String(q.quizId) === String(quiz.id));

            if (!takenRecord) {
                const allSubmissions = JSON.parse(localStorage.getItem(`quiz_submissions_${quiz.id}`) || '[]');
                const directMatch = allSubmissions.find(sub => String(sub.studentId) === String(userToUse.id));
                
                if (directMatch) {
                    takenRecord = {
                        quizId: quiz.id,
                        quizTitle: quiz.name,
                        score: directMatch.score,
                        totalScore: directMatch.totalScore,
                        dateTaken: directMatch.submittedAt,
                        isReleased: directMatch.isReleased,
                        quizVersionTaken: directMatch.quizVersionTaken
                    };
                }
            }
            
            if (takenRecord) {
                const hasNewVersion = quiz.lastUpdated > (takenRecord.quizVersionTaken || 0);

                if (hasNewVersion) {
                    pending.push({ ...quiz, isRetake: true });
                } 
                else if (takenRecord.isReleased) {
                    completed.push({ ...quiz, ...takenRecord });
                } 
                else {
                    pending.push({ ...quiz, isWaiting: true });
                }
            } else {
                pending.push(quiz);
            }
        });

        setPendingQuizzes(pending.reverse());
        setCompletedQuizzes(completed.sort((a, b) => new Date(b.dateTaken) - new Date(a.dateTaken)));
        setJoinedQuizzes(validQuizzes);
        
        // Update local profile data form only
        setProfileData({ ...userToUse }); 
    }
  }, [activeModal]);

  // --- Handlers ---
  const handleLogout = () => {
    clearCurrentUser(); 
    window.location.href = "/"; 
  };

  const handleSaveProfile = () => {
    const users = loadUsers();
    const updatedUsers = users.map(u => u.id === currentUser.id ? profileData : u);
    saveUsers(updatedUsers);
    saveCurrentUser(profileData);
    
    setCurrentUser(profileData); 
    
    setEditMode(false);
    setActiveModal(null);
    setModal({ message: "Profile updated successfully!", type: "success" });
  };

  const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setProfileData({ ...profileData, profilePic: reader.result });
          reader.readAsDataURL(file);
      }
  };

  const handleRemoveQuiz = (quizId) => {
      unjoinQuiz(quizId, currentUser.id);
      setPendingQuizzes(prev => prev.filter(q => q.id !== quizId));
      setJoinedQuizzes(prev => prev.filter(q => q.id !== quizId));
      setModal({ message: "Quiz removed from your list.", type: "success" });
  };

  const handleStartQuiz = (quizId, isRetake = false) => {
    const userToUse = loadCurrentUser() || currentUser;
    const takenRecord = userToUse.takenQuizzes?.find(q => String(q.quizId) === String(quizId));
    
    const allSubmissions = JSON.parse(localStorage.getItem(`quiz_submissions_${quizId}`) || '[]');
    const directMatch = allSubmissions.find(sub => String(sub.studentId) === String(userToUse.id));
    
    const record = takenRecord || directMatch;
    const isReleased = record?.isReleased;

    if (record && !isRetake) {
        const liveQuiz = findQuizById(quizId);
        const hasUpdate = liveQuiz && liveQuiz.lastUpdated > (record.quizVersionTaken || 0);
        
        if (!hasUpdate && !isReleased) {
             setModal({ message: "This quiz is pending results from the instructor.", type: "info" });
             return; 
        }
    }

    if (isRetake) {
        const storageKey = `quiz_submissions_${quizId}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const filtered = existing.filter(sub => sub.studentId !== userToUse.id);
        localStorage.setItem(storageKey, JSON.stringify(filtered));
    }

    setActiveQuizId(quizId);
    setScreen("quiz");
  }

  const handleQuizEntry = () => {
    const quizToStart = findQuizById(quizIdEntry);
    if (!quizToStart) { setModal({ message: "Invalid Quiz ID.", type: "error" }); return; }
    
    const alreadyJoined = joinedQuizzes.find(q => String(q.id) === String(quizToStart.id));
    if (quizToStart.isReleased && !alreadyJoined) {
        setModal({ message: "Quiz closed for new participants.", type: "error" }); return;
    }

    if (!alreadyJoined) {
        joinQuiz(quizToStart.id, currentUser.id);
        setJoinedQuizzes(prev => [...prev, quizToStart]);
        setPendingQuizzes(prev => [quizToStart, ...prev]);
    }

    setQuizIdEntry('');
    
    const userToUse = loadCurrentUser() || currentUser;
    const allSubmissions = JSON.parse(localStorage.getItem(`quiz_submissions_${quizToStart.id}`) || '[]');
    const directMatch = allSubmissions.find(sub => String(sub.studentId) === String(userToUse.id));
    
    if (directMatch && !directMatch.isReleased) {
         setModal({ message: "You have taken this quiz. It is currently pending results.", type: "info" });
    } else if (directMatch && directMatch.isReleased) {
         setModal({ message: "You have completed this quiz. Check the Completed tab.", type: "info" });
    } else {
         handleStartQuiz(quizToStart.id);
    }
  };

  const getFilteredCompleted = () => {
      return completedQuizzes.filter(record => {
          const matchName = record.quizTitle?.toLowerCase().includes(searchTerm.toLowerCase()) || record.name?.toLowerCase().includes(searchTerm.toLowerCase());
          let matchMonth = true;
          if (monthFilter && record.dateTaken) matchMonth = record.dateTaken.startsWith(monthFilter);
          return matchName && matchMonth;
      });
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col w-full max-w-5xl mx-auto">
      
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-gray-700 gap-4">
        <div className='flex items-center gap-4 w-full md:w-auto'>
            <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden border-2 border-blue-500 cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveModal('profile')}>
                {currentUser?.profilePic ? (
                    <img src={currentUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">{currentUser?.fullName?.[0] || "S"}</div>
                )}
            </div>

            <div>
                <h1 className="text-3xl font-extrabold text-white">Welcome, <span className="text-blue-400">{currentUser?.fullName || currentUser?.username}</span>!</h1>
                <div className="flex gap-4 text-sm text-gray-400 mt-1">
                    <button onClick={() => setActiveModal('profile')} className="hover:text-white underline">Edit Profile</button>
                    <span>|</span>
                    <button onClick={() => setActiveModal('completed')} className="hover:text-green-400 text-green-500 font-semibold flex items-center gap-1">
                       ✅ Completed ({completedQuizzes.length})
                    </button>
                    <span>|</span>
                    <button onClick={() => setActiveModal('about')} className="hover:text-yellow-400 flex items-center gap-1">ℹ️ About</button>
                </div>
            </div>
        </div>
        <button className="px-5 py-2 bg-red-600 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md w-full md:w-auto" onClick={handleLogout}>Logout</button>
      </header>

      {/* --- MAIN DASHBOARD --- */}
      <div className="w-full max-w-3xl mx-auto space-y-8">
        
        {/* JOIN SECTION */}
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-blue-400 flex items-center gap-2">🚀 Join a Quiz</h2>
            <div className="flex gap-3">
                <input type="text" placeholder="Enter 6-digit Quiz ID" value={quizIdEntry} onChange={(e) => setQuizIdEntry(e.target.value)} className="flex-1 p-4 rounded-lg bg-gray-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                <button onClick={handleQuizEntry} className="px-8 py-4 bg-green-600 rounded-lg hover:bg-green-500 font-bold text-lg shadow-lg active:scale-95">Join</button>
            </div>
            <div className="mt-4">
                <button onClick={() => setShowInstructions(!showInstructions)} className="text-gray-400 text-sm flex items-center gap-1 hover:text-white transition-colors">
                    {showInstructions ? "▼ Hide Instructions" : "▶ How does this work?"}
                </button>
                {showInstructions && (
                    <div className="mt-3 p-4 bg-gray-700/50 rounded-lg border border-gray-600 text-sm text-gray-300 animate-fadeIn">
                        <p className="font-bold text-white mb-2">Instructions:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Enter the <strong>Quiz ID</strong> to add it to your list.</li>
                            <li>Click <strong>Start</strong> to begin.</li>
                            <li>If status is <strong>Pending</strong>, your result is not ready.</li>
                            <li>Graded quizzes move to the <strong>Completed</strong> tab.</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
        
        {/* PENDING QUIZZES LIST */}
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 min-h-[300px]">
            <h2 className="text-2xl font-bold border-b pb-4 mb-6 border-gray-700 text-blue-400 flex justify-between">
                <span>📝 Active Quizzes</span>
                <span className="text-sm bg-gray-700 px-3 py-1 rounded text-gray-300 font-normal self-center">Count: {pendingQuizzes.length}</span>
            </h2>
            
            <div className="flex flex-col gap-4">
            {pendingQuizzes.length === 0 && (
                <div className='text-center py-10 text-gray-500 flex flex-col items-center gap-2'>
                    <span className="text-4xl">🎉</span>
                    <span>No active quizzes. Check Completed tab!</span>
                </div>
            )}
            
            {pendingQuizzes.map(quiz => (
                <div key={quiz.id} className={`flex flex-col sm:flex-row justify-between items-center p-5 border-l-4 ${quiz.isWaiting ? 'border-yellow-500' : 'border-blue-500'} bg-gray-700/40 rounded-lg hover:bg-gray-700 transition-all group relative`}>
                    <div className='flex flex-col mb-3 sm:mb-0'>
                        <span className="font-bold text-xl text-white group-hover:text-blue-300 transition-colors">{quiz.name}</span>
                        <span className="text-sm font-medium text-gray-400">
                            {/* DYNAMIC SUBTITLE */}
                            {quiz.isWaiting 
                                ? <span className="text-yellow-400 font-bold">Status: Pending Result ⏳</span> 
                                : <span>{quiz.questions?.length || 0} Questions • {quiz.duration} mins</span>
                            }
                            {quiz.isRetake && <span className="text-purple-400 font-bold ml-2"> (Update Available)</span>}
                        </span>
                    </div>
                    
                    <div className='flex items-center gap-3'>
                        {/* BUTTON VISUAL LOGIC */}
                        {quiz.isWaiting ? (
                             <button disabled className="px-6 py-2 bg-yellow-600/20 text-yellow-500 border border-yellow-500 rounded-lg cursor-not-allowed font-bold">
                                Pending...
                             </button>
                        ) : quiz.isRetake ? (
                             <button className="px-6 py-2 bg-purple-600 rounded-lg font-bold hover:bg-purple-500 animate-pulse shadow-md" onClick={() => handleStartQuiz(quiz.id, true)}>
                                Retake
                             </button>
                        ) : (
                             <button className="px-6 py-2 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 shadow-md transition-transform hover:-translate-y-1" onClick={() => handleStartQuiz(quiz.id, false)}>
                                Start Quiz
                             </button>
                        )}
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveQuiz(quiz.id); }}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                            title="Remove from list"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
            ))}
            </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. COMPLETED MODAL */}
      {activeModal === 'completed' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-3xl border border-green-500 shadow-2xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                    <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">✅ Completed Quizzes</h2>
                    <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white text-3xl">&times;</button>
                </div>

                <div className="flex gap-3 mb-4">
                    <input type="text" placeholder="Search quiz name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-green-400 focus:outline-none"/>
                    <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-green-400 focus:outline-none"/>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {getFilteredCompleted().length > 0 ? getFilteredCompleted().map((record, index) => {
                         return (
                            <div key={index} className="flex flex-col md:flex-row justify-between items-center bg-gray-700/30 p-4 rounded-xl border border-gray-600 hover:bg-gray-700 transition-colors">
                                <div className="mb-3 md:mb-0">
                                    <div className="font-bold text-white text-lg">{record.quizTitle || record.name}</div>
                                    <div className="flex flex-wrap gap-3 mt-1 text-sm">
                                        <span className="text-green-300 bg-green-900/30 px-2 py-0.5 rounded flex items-center gap-1">
                                            🕒 Finished {timeAgo(record.dateTaken)}
                                        </span>
                                        <span className="text-gray-400">{formatDate(record.dateTaken)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-yellow-500">{record.score} <span className="text-sm text-gray-500">/ {record.totalScore}</span></div>
                                        <div className="text-xs text-gray-500 uppercase font-bold">Final Score</div>
                                    </div>
                                    
                                    <button onClick={() => { setActiveModal(null); handleStartQuiz(record.quizId || record.id, false); }} className="px-4 py-2 bg-blue-600/20 border border-blue-500 text-blue-300 rounded hover:bg-blue-600 hover:text-white transition-colors">
                                        Review
                                    </button>
                                </div>
                            </div>
                         );
                    }) : (
                        <div className="text-center py-20 text-gray-500">No completed quizzes found.</div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* 2. ABOUT MODAL */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md border border-gray-600 shadow-2xl text-center">
                <div className="text-6xl mb-4">🎓</div>
                <h2 className="text-3xl font-bold text-white mb-2">Quiz App</h2>
                <p className="text-gray-400 mb-6">Student Dashboard v2.0</p>
                <button onClick={() => setActiveModal(null)} className="px-6 py-2 bg-blue-600 rounded-lg font-bold w-full">Close</button>
            </div>
        </div>
      )}

      {/* 3. PROFILE MODAL (FIXED SECTION) */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md border border-blue-500 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-blue-400">Edit Profile</h2>
                    <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden border-4 border-blue-500 mb-3 relative group">
                        {profileData.profilePic ? <img src={profileData.profilePic} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">?</div>}
                        {editMode && <label className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"><span className="text-xs font-bold text-white">Change</span><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /></label>}
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                        <span className="text-gray-400 text-xs uppercase font-bold">Full Name</span>
                        {editMode ? <input className="w-full p-2 rounded bg-gray-700 border border-blue-500 text-white" value={profileData.fullName || ''} onChange={e => setProfileData({...profileData, fullName: e.target.value})} /> : <p className="text-lg font-semibold border-b border-gray-700 pb-1">{currentUser.fullName}</p>}
                    </div>

                    {/* Student Number */}
                    <div>
                        <span className="text-gray-400 text-xs uppercase font-bold">Student Number</span>
                        {editMode ? (
                            <input 
                                className="w-full p-2 rounded bg-gray-700 border border-blue-500 text-white" 
                                value={profileData.studentNumber || ''} 
                                onChange={e => setProfileData({...profileData, studentNumber: e.target.value})} 
                            />
                        ) : (
                            <p className="text-lg font-semibold border-b border-gray-700 pb-1">{currentUser.studentNumber || 'N/A'}</p>
                        )}
                    </div>

                    {/* Year & Section */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <span className="text-gray-400 text-xs uppercase font-bold">Year Level</span>
                            {editMode ? (
                                <select 
                                    className="w-full p-2 rounded bg-gray-700 border border-blue-500 text-white"
                                    value={profileData.year || ''}
                                    onChange={e => setProfileData({...profileData, year: e.target.value})}
                                >
                                    <option value="">Select</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            ) : (
                                <p className="text-lg font-semibold border-b border-gray-700 pb-1">{currentUser.year ? `${currentUser.year}${['st','nd','rd'][currentUser.year-1]||'th'} Year` : 'N/A'}</p>
                            )}
                        </div>
                        <div className="flex-1">
                            <span className="text-gray-400 text-xs uppercase font-bold">Section</span>
                            {editMode ? (
                                <input 
                                    className="w-full p-2 rounded bg-gray-700 border border-blue-500 text-white" 
                                    value={profileData.section || ''} 
                                    onChange={e => setProfileData({...profileData, section: e.target.value})} 
                                />
                            ) : (
                                <p className="text-lg font-semibold border-b border-gray-700 pb-1">{currentUser.section || 'N/A'}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-8 pt-4 border-t border-gray-700">
                    {editMode ? (
                        <>
                            <button onClick={() => { setEditMode(false); setProfileData(currentUser); }} className="flex-1 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 font-semibold">Cancel</button>
                            <button onClick={handleSaveProfile} className="flex-1 py-2 bg-green-600 rounded-lg hover:bg-green-500 font-bold">Save Changes</button>
                        </>
                    ) : (
                        <button onClick={() => setEditMode(true)} className="w-full py-2 bg-blue-600 rounded-lg hover:bg-blue-500 font-bold">Edit Information</button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;