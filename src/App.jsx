import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { loadCurrentUser } from './utils/storage.js';

// Import Components
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import InstructorDashboard from './components/Dashboard/InstructorDashboard';
// Import other components if you have them ready, or comment them out for now
// import QuizPage from './components/Quiz/QuizPage';
// import QuizCreationPage from './components/Quiz/QuizCreationPage';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);

  // Load user on startup
  useEffect(() => {
    const user = loadCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 sm:p-8 font-sans">
      <Routes>
        {/* --- 1. LOGIN (Default Page) --- */}
        <Route 
          path="/" 
          element={<LoginPage setCurrentUser={setCurrentUser} />} 
        />

        {/* --- 2. SIGNUP --- */}
        <Route 
          path="/signup" 
          element={<SignupPage />} 
        />

        {/* --- 3. STUDENT DASHBOARD --- */}
        <Route 
          path="/student" 
          element={
            currentUser && currentUser.role === 'student' ? (
              <StudentDashboard 
                currentUser={currentUser} 
                setCurrentUser={setCurrentUser}
                setActiveQuizId={() => {}} // Placeholder if needed
                setModal={() => {}} // Placeholder if needed
                setScreen={() => {}} // Remove dependency on setScreen
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
                setScreen={() => {}} 
                setModal={() => {}} 
              /> 
            ) : (
              <Navigate to="/" />
            )
          } 
        />

        {/* --- Fallback: Redirect unknown links to Login --- */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App;