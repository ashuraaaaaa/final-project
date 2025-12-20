import React, { useState, useEffect } from 'react';
import { clearCurrentUser, loadUsers, saveUsers, saveCurrentUser } from '../../utils/storage.js'; 
import { findQuizById, loadJoinedQuizzes, joinQuiz } from '../../utils/quizStorage.js'; 

const StudentDashboard = ({ setScreen, currentUser, setCurrentUser, setModal, setActiveQuizId }) => {
  const [joinedQuizzes, setJoinedQuizzes] = useState([]);
  const [quizIdEntry, setQuizIdEntry] = useState(''); 
  const [showProfile, setShowProfile] = useState(false); 
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({ ...currentUser });

  useEffect(() => {
    if (currentUser && currentUser.id) {
        // Load quizzes ONLY for this specific user ID
        const joinedIds = loadJoinedQuizzes(currentUser.id);
        const quizzes = joinedIds.map(id => findQuizById(id)).filter(quiz => quiz !== undefined);
        setJoinedQuizzes(quizzes);
        setProfileData({ ...currentUser }); 
    }
  }, [currentUser]);

  const handleLogout = () => {
    clearCurrentUser(); 
    setScreen("login");
  };

  const handleSaveProfile = () => {
    const users = loadUsers();
    const updatedUsers = users.map(u => u.id === currentUser.id ? profileData : u);
    saveUsers(updatedUsers);
    
    saveCurrentUser(profileData);
    setCurrentUser(profileData); 
    
    setEditMode(false);
    setModal({ message: "Profile updated successfully!", type: "success" });
  };

  // Helper to find THIS student's specific submission for a quiz
  const getMySubmission = (quizId) => {
      const allSubmissions = JSON.parse(localStorage.getItem(`quiz_submissions_${quizId}`) || '[]');
      return allSubmissions.find(sub => sub.studentId === currentUser.id);
  };

  const handleStartQuiz = (quizId) => {
    const mySubmission = getMySubmission(quizId);
    
    // If the student already submitted
    if (mySubmission) {
        // If results are released, allow them to enter "Review Mode"
        if (mySubmission.isReleased) {
            setActiveQuizId(quizId);
            setScreen("quiz"); // The QuizPage will detect isReleased and show answers
            return;
        }
        
        // If results are NOT released, prevent entry
        setModal({ 
            message: "You have already taken this quiz. Results are still pending release by the instructor.", 
            type: "info" 
        });
        return;
    }
    
    // If not submitted yet, start the quiz normally
    setActiveQuizId(quizId);
    setScreen("quiz");
  }

  const handleQuizEntry = () => {
    const quizToStart = findQuizById(quizIdEntry);

    if (!quizToStart) {
        setModal({ message: "Invalid Quiz ID. Please try again.", type: "error" });
        return;
    }
    
    joinQuiz(quizToStart.id, currentUser.id); 
    
    // Update local state so the list refreshes
    if (!joinedQuizzes.find(q => q.id === quizToStart.id)) {
        setJoinedQuizzes(prev => [...prev, quizToStart]); 
    }
    
    setQuizIdEntry('');
    
    // Auto-navigate if not submitted
    const mySubmission = getMySubmission(quizToStart.id);
    if (!mySubmission) {
        handleStartQuiz(quizToStart.id);
    } else {
        setModal({ message: "You have joined this quiz, but you have already taken it.", type: "info" });
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col w-full max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
        <div className='flex items-center gap-4'>
            <h1 className="text-3xl font-extrabold text-blue-300">Welcome, {currentUser?.fullName || currentUser?.username}!</h1>
            <button 
                onClick={() => setShowProfile(true)}
                className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600 border border-gray-600"
            >
                My Profile
            </button>
        </div>
        <button
          className="px-4 py-2 bg-red-600 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      {/* --- PROFILE MODAL --- */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-blue-500 shadow-2xl">
                <h2 className="text-2xl font-bold mb-4 text-blue-400">My Profile</h2>
                
                <div className="space-y-3">
                    <div>
                        <span className="text-gray-400 text-sm">Full Name</span>
                        {editMode ? 
                            <input className="w-full p-2 rounded bg-gray-700 border border-blue-500" value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} /> : 
                            <p className="text-lg font-semibold">{currentUser.fullName}</p>
                        }
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-gray-400 text-sm">Grade</span>
                            {editMode ? (
                                <select 
                                    value={profileData.grade} 
                                    onChange={(e) => setProfileData({...profileData, grade: e.target.value})} 
                                    className="w-full p-2 rounded bg-gray-700 border border-blue-500"
                                >
                                    <option value="1st Year">1st Year</option>
                                    <option value="2nd Year">2nd Year</option>
                                    <option value="3rd Year">3rd Year</option>
                                    <option value="4th Year">4th Year</option>
                                </select>
                            ) : <p>{currentUser.grade}</p>}
                        </div>
                        <div>
                            <span className="text-gray-400 text-sm">Section</span>
                            {editMode ? <input className="w-full p-2 rounded bg-gray-700 border border-blue-500" value={profileData.section} onChange={e => setProfileData({...profileData, section: e.target.value})} /> : <p>{currentUser.section}</p>}
                        </div>
                    </div>
                    <div>
                        <span className="text-gray-400 text-sm">Student Number</span>
                        {editMode ? <input className="w-full p-2 rounded bg-gray-700 border border-blue-500" value={profileData.studentNumber} onChange={e => setProfileData({...profileData, studentNumber: e.target.value})} /> : <p>{currentUser.studentNumber}</p>}
                    </div>
                    <div>
                        <span className="text-gray-400 text-sm">Contact</span>
                        {editMode ? <input className="w-full p-2 rounded bg-gray-700 border border-blue-500" value={profileData.contact} onChange={e => setProfileData({...profileData, contact: e.target.value})} /> : <p>{currentUser.contact}</p>}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 border-t border-gray-700 pt-4">
                    {editMode ? (
                        <>
                            <button onClick={() => { setEditMode(false); setProfileData(currentUser); }} className="px-4 py-2 bg-gray-600 rounded">Cancel</button>
                            <button onClick={handleSaveProfile} className="px-4 py-2 bg-green-600 rounded">Save</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setShowProfile(false)} className="px-4 py-2 bg-gray-600 rounded">Close</button>
                            <button onClick={() => setEditMode(true)} className="px-4 py-2 bg-blue-600 rounded">Edit Info</button>
                        </>
                    )}
                </div>
            </div>
        </div>
      )}

      <div className="flex-1 bg-gray-800 p-6 rounded-xl shadow-2xl space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2 border-gray-700 text-blue-400">Start Quiz by ID</h2>
        <div className="flex gap-4 mb-8">
            <input
                type="text"
                placeholder="Enter 6-digit Quiz ID"
                value={quizIdEntry}
                onChange={(e) => setQuizIdEntry(e.target.value)}
                className="flex-1 p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button onClick={handleQuizEntry} className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-500 font-bold shadow-md transition-all active:scale-95">Join & Start</button>
        </div>
        
        <h2 className="text-2xl font-semibold border-b pb-2 border-gray-700 text-blue-400">My Joined Quizzes</h2>
        <div className="flex flex-col gap-4">
          {joinedQuizzes.length === 0 && <div className='text-center p-6 text-gray-400 border border-gray-700 rounded-lg'>Enter a Quiz ID above to see it here.</div>}
          {joinedQuizzes.map(quiz => {
              const mySubmission = getMySubmission(quiz.id);
              const isSubmitted = !!mySubmission;
              const isReleased = mySubmission?.isReleased;
              const totalScore = quiz.questions.reduce((sum, q) => sum + q.score, 0);
              
              // Color shifts: Blue (Start), Yellow (Pending), Green (Released/Review)
              const statusColor = isSubmitted ? (isReleased ? 'green' : 'yellow') : 'blue';
              
              const resultText = () => {
                  if (!isSubmitted) return `${quiz.questions.length} Questions | ${quiz.duration} minutes`;
                  if (isReleased) return `Final Score: ${mySubmission.score}/${totalScore}`;
                  return 'Status: Submitted (Waiting for Score)';
              }
              
              return (
                  <div key={quiz.id} className={`flex justify-between items-center p-4 border-l-4 border-${statusColor}-500 bg-gray-700 rounded-lg transition-all shadow-lg hover:bg-gray-650`}>
                    <div className='flex flex-col'>
                        <span className="font-bold text-lg">{quiz.name} <small className="text-gray-500 font-normal">#{quiz.id}</small></span>
                        <span className={`text-sm ${isReleased ? 'text-green-400 font-bold' : `text-${statusColor}-400`}`}>
                            {resultText()}
                        </span>
                    </div>
                    <button 
                        className={`px-5 py-2 rounded-lg font-bold transition-all shadow-md 
                            ${isSubmitted && !isReleased 
                                ? 'bg-gray-600 opacity-50 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-500 active:scale-95'}`}
                        disabled={isSubmitted && !isReleased}
                        onClick={() => handleStartQuiz(quiz.id)}
                    >
                      {isSubmitted ? (isReleased ? 'View Score' : 'Submitted') : 'Start'}
                    </button>
                  </div>
              );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;