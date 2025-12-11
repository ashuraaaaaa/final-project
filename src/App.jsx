import React, { useState, useEffect } from 'react';
import { loadCurrentUser } from './utils/storage.js';

// Import Components
// Removed ChooseRole as it is no longer the landing page
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import InstructorDashboard from './components/Dashboard/InstructorDashboard';
import QuizPage from './components/Quiz/QuizPage';
import QuizCreationPage from './components/Quiz/QuizCreationPage';
import ShowMessage from './components/Common/ShowMessage';
import ConfirmationModal from './components/Common/ConfirmationModal';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [screen, setScreen] = useState("login"); // Default is now LOGIN
  const [modal, setModal] = useState(null); 
  const [activeQuizId, setActiveQuizId] = useState(null);

  // Load user state from local storage on mount
  useEffect(() => {
    const user = loadCurrentUser();
    if (user) {
        setCurrentUser(user);
        // Auto-redirect based on the stored role
        setScreen(user.role === "Student" ? "student" : "instructor");
    }
  }, []);

  const closeModal = () => setModal(null);
  
  // Determine which component to render
  const renderScreen = () => {
    switch (screen) {
      case "login":
        return <LoginPage setScreen={setScreen} setCurrentUser={setCurrentUser} setModal={setModal} />;
      case "signup":
        return <SignupPage setScreen={setScreen} setCurrentUser={setCurrentUser} setModal={setModal} />;
      case "student":
        if (!currentUser) return <LoginPage setScreen={setScreen} setCurrentUser={setCurrentUser} setModal={setModal} />;
        return <StudentDashboard 
                    currentUser={currentUser} 
                    setCurrentUser={setCurrentUser} // Pass this so profile edits update app state
                    setScreen={setScreen} 
                    setModal={setModal} 
                    setActiveQuizId={setActiveQuizId} 
                />;
      case "instructor":
        if (!currentUser) return <LoginPage setScreen={setScreen} setCurrentUser={setCurrentUser} setModal={setModal} />;
        return <InstructorDashboard 
                    currentUser={currentUser} 
                    setScreen={setScreen} 
                    setModal={setModal} 
                />;
      case "createQuiz":
        return <QuizCreationPage setScreen={setScreen} setModal={setModal} />;
      case "quiz":
        return <QuizPage setScreen={setScreen} setModal={setModal} activeQuizId={activeQuizId} />;
      default:
        return <LoginPage setScreen={setScreen} setCurrentUser={setCurrentUser} setModal={setModal} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 sm:p-8 font-sans">
      {renderScreen()}
      
      {/* Global Message Modal */}
      {modal && modal.onConfirm ? (
        <ConfirmationModal 
            message={modal.message} 
            onConfirm={() => { modal.onConfirm(); closeModal(); }} 
            onCancel={closeModal} 
        />
      ) : (
        <ShowMessage message={modal?.message} type={modal?.type} onClose={closeModal} />
      )}
    </div>
  );
};

export default App;