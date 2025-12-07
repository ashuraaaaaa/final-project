import React, { useState, useEffect } from 'react';
import { loadCurrentUser } from './utils/storage';

// Import Components
import ChooseRole from './components/Auth/ChooseRole.jsx';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import InstructorDashboard from './components/Dashboard/InstructorDashboard';
import QuizPage from './components/Quiz/QuizPage';
import ShowMessage from './components/Common/ShowMessage';
import ConfirmationModal from './components/Common/ConfirmationModal';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(""); 
  const [screen, setScreen] = useState("choose"); 
  const [modal, setModal] = useState(null); 

  // Load user state from local storage on mount
  useEffect(() => {
    const user = loadCurrentUser();
    if (user) {
        setCurrentUser(user);
        setRole(user.role);
        setScreen(user.role === "Student" ? "student" : "instructor");
    }
  }, []);

  const closeModal = () => setModal(null);
  
  // Determine which component to render
  const renderScreen = () => {
    switch (screen) {
      case "choose":
        return <ChooseRole setRole={setRole} setScreen={setScreen} />;
      case "login":
        return <LoginPage role={role} setScreen={setScreen} setCurrentUser={setCurrentUser} setModal={setModal} />;
      case "signup":
        return <SignupPage role={role} setScreen={setScreen} setCurrentUser={setCurrentUser} setModal={setModal} />;
      case "student":
        if (!currentUser) return <ChooseRole setRole={setRole} setScreen={setScreen} />;
        return <StudentDashboard currentUser={currentUser} setScreen={setScreen} />;
      case "instructor":
        if (!currentUser) return <ChooseRole setRole={setRole} setScreen={setScreen} />;
        return <InstructorDashboard currentUser={currentUser} setScreen={setScreen} />;
      case "quiz":
        return <QuizPage setScreen={setScreen} setModal={setModal} />;
      default:
        return <ChooseRole setRole={setRole} setScreen={setScreen} />;
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