import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { loadCurrentUser, clearCurrentUser } from './utils/storage.js';

// Import Components
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import InstructorDashboard from './components/Dashboard/InstructorDashboard';

// Import Quiz Components
import QuizCreationPage from './components/Quiz/QuizCreationPage'; 
import QuizPage from './components/Quiz/QuizPage'; 

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Lifted state for shared data
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [modal, setModal] = useState(null); 

  const navigate = useNavigate();

  useEffect(() => {
    const user = loadCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setIsLoading(false);
  }, []);

  // --- THE FIX: Bridge 'setScreen' to 'navigate' ---
  const handleSetScreen = (screenName) => {
    switch(screenName) {
        case 'login':
            clearCurrentUser(); 
            setCurrentUser(null); 
            navigate('/'); 
            break;
        case 'createQuiz':
            navigate('/create-quiz');
            break;
        case 'quiz':
            navigate('/take-quiz');
            break;
        case 'instructor':
            navigate('/instructor');
            break;
        case 'student':
            navigate('/student');
            break;
        default:
            console.warn("Unknown screen:", screenName);
            navigate('/');
    }
  };

  // --- MODAL RENDERER (Updated for Green Theme) ---
  const renderModal = () => {
    if (!modal) return null;

    const isSuccess = modal.type === 'success';
    const isInfo = modal.type === 'info';
    const isError = modal.type === 'error';

    // 1. SUCCESS: Solid Green (Matches Screenshot)
    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-green-600 p-8 rounded-xl max-w-sm w-full shadow-2xl text-white">
                    <h3 className="text-2xl font-bold mb-4">Success</h3>
                    <p className="mb-8 text-lg">{modal.message}</p>
                    <button 
                        onClick={() => { 
                            if(modal.onConfirm) modal.onConfirm();
                            setModal(null); 
                        }} 
                        className="w-full py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    // 2. INFO: Solid Blue (Matches Screenshot)
    if (isInfo) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-blue-600 p-8 rounded-xl max-w-sm w-full shadow-2xl text-white">
                    <h3 className="text-2xl font-bold mb-4">Info</h3>
                    <p className="mb-8 text-lg">{modal.message}</p>
                    <button 
                        onClick={() => setModal(null)} 
                        className="w-full py-3 bg-white text-blue-900 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    // 3. DEFAULT/ERROR: Dark Theme
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`bg-gray-800 p-6 rounded-xl max-w-sm w-full border ${isError ? 'border-red-500' : 'border-gray-500'}`}>
                <h3 className={`text-xl font-bold mb-2 ${isError ? 'text-red-500' : 'text-white'}`}>
                    {isError ? 'Error' : 'Notice'}
                </h3>
                <p className="text-gray-300 mb-6">{modal.message}</p>
                <div className="flex justify-end gap-2">
                    {modal.onConfirm && (
                        <button onClick={() => { modal.onConfirm(); setModal(null); }} className="px-4 py-2 bg-red-600 rounded text-white font-bold">Yes</button>
                    )}
                    <button onClick={() => setModal(null)} className="px-4 py-2 bg-gray-600 rounded text-white font-bold">Close</button>
                </div>
            </div>
        </div>
    );
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 sm:p-8 font-sans">
      {renderModal()}
      
      <Routes>
        {/* --- 1. LOGIN --- */}
        <Route 
          path="/" 
          element={
            currentUser ? (
               <Navigate to={currentUser.role === 'student' ? "/student" : "/instructor"} />
            ) : (
               <LoginPage setCurrentUser={setCurrentUser} />
            )
          } 
        />

        {/* --- 2. SIGNUP --- */}
        <Route 
          path="/signup" 
          element={<SignupPage setCurrentUser={setCurrentUser} />} 
        />

        {/* --- 3. STUDENT DASHBOARD --- */}
        <Route 
          path="/student" 
          element={
            currentUser && currentUser.role === 'student' ? (
              <StudentDashboard 
                currentUser={currentUser} 
                setCurrentUser={setCurrentUser}
                setScreen={handleSetScreen} 
                setModal={setModal} 
                setActiveQuizId={setActiveQuizId} 
              /> 
            ) : (
              <Navigate to="/" />
            )
          } 
        />

        {/* --- 4. INSTRUCTOR DASHBOARD --- */}
        <Route 
          path="/instructor" 
          element={
            currentUser && currentUser.role === 'instructor' ? (
              <InstructorDashboard 
                currentUser={currentUser} 
                setScreen={handleSetScreen} 
                setModal={setModal}
              /> 
            ) : (
              <Navigate to="/" />
            )
          } 
        />

        {/* --- 5. CREATE QUIZ --- */}
        <Route 
            path="/create-quiz"
            element={
                currentUser && currentUser.role === 'instructor' ? (
                    <QuizCreationPage 
                        setScreen={handleSetScreen} 
                        setModal={setModal} 
                    />
                ) : <Navigate to="/" />
            }
        />

        {/* --- 6. TAKE QUIZ --- */}
        <Route 
            path="/take-quiz"
            element={
                currentUser && currentUser.role === 'student' && activeQuizId ? (
                    <QuizPage 
                        activeQuizId={activeQuizId}
                        setScreen={handleSetScreen}
                        setModal={setModal}
                    />
                ) : <Navigate to="/student" />
            }
        />

        {/* --- Fallback --- */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App;