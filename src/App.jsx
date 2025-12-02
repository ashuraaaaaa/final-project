import React, { useState, useEffect } from 'react';

// --- Local Storage Keys ---
const LS_USERS_KEY = 'quiz_app_users';
const LS_CURRENT_USER_KEY = 'quiz_app_current_user';

// --- Local Storage Helpers ---
const loadUsers = () => {
  try {
    const users = localStorage.getItem(LS_USERS_KEY);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error("Error loading users from local storage:", error);
    return [];
  }
};

const saveUsers = (users) => {
  try {
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Error saving users to local storage:", error);
  }
};

const saveCurrentUser = (user) => {
  try {
    localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Error saving current user to local storage:", error);
  }
};

const loadCurrentUser = () => {
  try {
    const user = localStorage.getItem(LS_CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Error loading current user from local storage:", error);
    return null;
  }
};

const clearCurrentUser = () => {
  try {
    localStorage.removeItem(LS_CURRENT_USER_KEY);
  } catch (error) {
    console.error("Error clearing current user from local storage:", error);
  }
};


// --- Components ---

// Component 1: Custom Modal for Alerts/Messages (replaces alert())
const ShowMessage = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  let bgColor = 'bg-blue-500';
  if (type === 'error') bgColor = 'bg-red-600';
  if (type === 'success') bgColor = 'bg-green-600';
  
  // Confirmation modal logic is now handled inline in App for simplicity
  const isConfirm = message.includes("discard your answers");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`p-6 rounded-lg shadow-2xl max-w-sm w-full ${bgColor} text-white`}>
        <h3 className="text-xl font-bold mb-3">{isConfirm ? "Warning" : (type.charAt(0).toUpperCase() + type.slice(1))}</h3>
        <p className="mb-4">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2 bg-white text-gray-800 rounded font-semibold hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Component 2: Choose Role Screen
const ChooseRole = ({ setRole, setScreen }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-xl shadow-2xl bg-gray-800 transition-all duration-300 transform scale-100">
      <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
        Choose Your Role
      </h1>
      <div className="flex flex-col sm:flex-row gap-6">
        <button
          className="w-40 px-6 py-4 bg-blue-600 rounded-xl font-bold text-lg hover:bg-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          onClick={() => { setRole("Student"); setScreen("login"); }}
        >
          Student
        </button>
        <button
          className="w-40 px-6 py-4 bg-green-600 rounded-xl font-bold text-lg hover:bg-green-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          onClick={() => { setRole("Instructor"); setScreen("login"); }}
        >
          Instructor
        </button>
      </div>
    </div>
  );
};

// Component 3: Login Screen
const LoginPage = ({ setScreen, setCurrentUser, role, setModal }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      setModal({ message: "Please enter both email and password.", type: "error" });
      return;
    }

    setIsLoading(true);
    
    // 1. Check Local Storage
    const users = loadUsers();
    const user = users.find(u => u.email === email && u.password === password);

    setTimeout(() => { // Simulate network delay
        if (!user) {
            setModal({ message: "Invalid credentials.", type: "error" });
            setIsLoading(false);
            return;
        }

        if (user.role !== role) {
            setModal({ message: `You are signed in as an ${user.role}. Please choose that role on the previous screen.`, type: "error" });
            setIsLoading(false);
            return;
        }

        setCurrentUser(user);
        saveCurrentUser(user); // Save to local storage
        setScreen(user.role === "Student" ? "student" : "instructor");
        setIsLoading(false);
    }, 500);
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transition-all duration-300">
      <button
        className="absolute left-4 top-4 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 font-bold transition-colors shadow-md"
        onClick={() => setScreen("choose")}
      >
        ← Back
      </button>
      <h1 className="text-3xl font-bold mb-8 text-blue-400">{role} Sign In (Local)</h1>

      <div className="w-full flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-4 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
          disabled={isLoading}
        />

        <button
          onClick={handleLogin}
          className={`w-full p-4 rounded font-bold transition-all duration-200 shadow-lg ${isLoading ? 'bg-blue-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 hover:scale-[1.02]'}`}
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>

        <p className="text-sm text-center mt-4 text-gray-400">
          Don't have an account?{" "}
          <span
            className="text-blue-400 underline cursor-pointer hover:text-blue-300 font-semibold"
            onClick={() => setScreen("signup")}
          >
            Sign Up
          </span>
        </p>
        <p className='text-xs text-center text-red-400 mt-2'>*Data is saved only in this browser*</p>
      </div>
    </div>
  );
};

// Component 4: Signup Screen
const SignupPage = ({ setScreen, setCurrentUser, role, setModal }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = () => {
    if (!email || !username || !password) {
      setModal({ message: "Please fill all fields.", type: "error" });
      return;
    }

    setIsLoading(true);
    
    // 1. Check Local Storage
    const users = loadUsers();
    
    setTimeout(() => { // Simulate network delay
        // 2. Check if email already exists
        if (users.some(u => u.email === email)) {
            setModal({ message: "Email already registered. Please sign in.", type: "error" });
            setIsLoading(false);
            return;
        }

        // 3. Create new user document
        const newUser = { 
            id: Date.now().toString(), // Simple unique ID
            email, 
            username, 
            password, 
            role, 
            createdAt: new Date().toISOString() 
        };
        
        users.push(newUser);
        saveUsers(users); // Save updated user list
        saveCurrentUser(newUser); // Set as current user
        
        setCurrentUser(newUser);
        setModal({ message: `Welcome, ${username}! Account created.`, type: "success" });
        setScreen(role === "Student" ? "student" : "instructor");
        setIsLoading(false);
    }, 500);
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transition-all duration-300">
      <button
        className="absolute left-4 top-4 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 font-bold transition-colors shadow-md"
        onClick={() => setScreen("login")}
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-8 text-green-400">{role} Sign Up (Local)</h1>

      <div className="w-full flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-4 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
          disabled={isLoading}
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-4 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
          disabled={isLoading}
        />

        <button
          onClick={handleSignup}
          className={`w-full p-4 rounded font-bold transition-all duration-200 shadow-lg ${isLoading ? 'bg-green-800 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 hover:scale-[1.02]'}`}
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Sign Up'}
        </button>

        <p className="text-sm text-center mt-4 text-gray-400">
          Already have an account?{" "}
          <span
            className="text-green-400 underline cursor-pointer hover:text-green-300 font-semibold"
            onClick={() => setScreen("login")}
          >
            Sign In
          </span>
        </p>
        <p className='text-xs text-center text-red-400 mt-2'>*Data is saved only in this browser*</p>
      </div>
    </div>
  );
};


// Component 5: Student Dashboard
const StudentDashboard = ({ setScreen, currentUser }) => {
  const handleLogout = () => {
    clearCurrentUser(); // Clear local storage
    setScreen("choose");
  };
  
  // Local storage does not require user ID display for multi-user collaboration
  // We remove the user ID display line here: {/* <div className="text-sm text-gray-500 mb-6">User ID: {currentUser?.id}</div> */}

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col w-full max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
        <h1 className="text-3xl font-extrabold text-blue-300">Welcome, {currentUser?.username || "Student"}!</h1>
        <button
          className="px-4 py-2 bg-red-600 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <div className="flex-1 bg-gray-800 p-6 rounded-xl shadow-2xl space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2 border-gray-700 text-blue-400">Available Quizzes</h2>
        <div className="flex flex-col gap-4">
          {/* Active quiz */}
          <div
            className="flex justify-between items-center p-4 border-l-4 border-blue-500 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors shadow-lg"
            onClick={() => setScreen("quiz")}
          >
            <div className='flex flex-col'>
                <span className="font-bold text-lg">Sample Quiz 1: Introduction to React</span>
                <span className='text-sm text-gray-400'>10 Questions | 15 minutes | Due: Dec 15th</span>
            </div>
            <button className="px-5 py-2 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition-colors shadow-md">
              Start
            </button>
          </div>

          {/* Already taken quiz */}
          <div className="flex justify-between items-center p-4 border-l-4 border-green-500 bg-gray-700 rounded-lg opacity-80 cursor-not-allowed shadow-inner">
            <div className='flex flex-col'>
                <span className="font-bold text-lg">Sample Quiz 2: Basic JavaScript</span>
                <span className='text-sm text-green-400'>Score: 92% | Taken on: Nov 28th</span>
            </div>
            <button className="px-5 py-2 bg-gray-600 rounded-lg font-bold opacity-50 cursor-not-allowed">
              Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component 6: Instructor Dashboard
const InstructorDashboard = ({ setScreen, currentUser }) => {
  const mockResults = [
    { id: 1, name: "John Doe", score: 85, violations: 1, submittedAt: "2025-12-02 10:30 AM" },
    { id: 2, name: "Jane Smith", score: 92, violations: 0, submittedAt: "2025-12-02 11:00 AM" },
    { id: 3, name: "Alice Johnson", score: 78, violations: 3, submittedAt: "2025-12-02 12:45 PM" },
  ];

  const handleLogout = () => {
    clearCurrentUser(); // Clear local storage
    setScreen("choose");
  };
  
  // Local storage does not require user ID display for multi-user collaboration
  // We remove the user ID display line here: {/* <div className="text-sm text-gray-500 mb-6">User ID: {currentUser?.id}</div> */}

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col w-full max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
        <h1 className="text-3xl font-extrabold text-green-300">Instructor Dashboard</h1>
        <button
          className="px-4 py-2 bg-red-600 rounded-xl hover:bg-red-700 transition-colors font-bold shadow-md"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2 border-gray-700 text-green-400">Quiz Results: Introduction to React</h2>
        
        <div className='overflow-x-auto'>
          <table className="w-full min-w-[600px] table-auto border-collapse rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-700 text-left">
                <th className="px-4 py-3 border-b border-gray-600">Name</th>
                <th className="px-4 py-3 border-b border-gray-600">Score (%)</th>
                <th className="px-4 py-3 border-b border-gray-600">Violations</th>
                <th className="px-4 py-3 border-b border-gray-600">Submitted At</th>
                <th className="px-4 py-3 border-b border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockResults.map(r => (
                <tr key={r.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3 font-semibold text-xl">{r.score}</td>
                  <td className={`px-4 py-3 font-semibold ${r.violations > 0 ? 'text-red-400' : 'text-green-400'}`}>{r.violations}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{r.submittedAt}</td>
                  <td className="px-4 py-3">
                    <button className="text-blue-400 hover:text-blue-300 text-sm">Review Attempt</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <button className="mt-4 px-6 py-3 bg-green-600 rounded-lg hover:bg-green-500 transition-colors font-bold shadow-md">
          Release All Results
        </button>
      </div>
    </div>
  );
};

// Component 7: Quiz Page
const QuizPage = ({ setScreen, setModal }) => {
  const questions = [
    { id: 1, question: "What is 2 + 2?", options: ["2", "3", "4"], answer: "4" },
    { id: 2, question: "Capital of France?", options: ["Paris", "Rome", "Berlin"], answer: "Paris" },
    { id: 3, question: "Which hook manages state in React?", options: ["useEffect", "useState", "useContext"], answer: "useState" },
  ];

  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  const handleSelect = (qId, option) => setAnswers({ ...answers, [qId]: option });
  
  const handleSubmit = () => {
    let finalScore = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.answer) {
        finalScore++;
      }
    });

    setScore(finalScore);
    setIsSubmitted(true);
    setModal({ 
        message: `Quiz submitted successfully! You scored ${finalScore} out of ${questions.length}.`, 
        type: "success" 
    });
    // In a real local app, you would save the score to local storage here.
  };

  const handleBack = () => {
    if (!isSubmitted) {
        // We use a simple modal wrapper that calls setScreen on confirm
        setModal({ 
            message: "Warning: Leaving now will discard your answers. Proceed anyway?", 
            type: "error",
            onConfirm: () => setScreen("student"),
            onCancel: () => setModal(null)
        });
    } else {
        setScreen("student");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center w-full">
      <header className="w-full max-w-xl flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-yellow-300">Sample Quiz</h1>
        <button
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-bold shadow-md"
          onClick={handleBack}
        >
          {isSubmitted ? 'Back to Dashboard' : 'End Quiz'}
        </button>
      </header>

      <div className="w-full max-w-xl bg-gray-800 p-8 rounded-xl shadow-2xl space-y-8">
        <div className="flex justify-between text-lg font-medium border-b pb-4 border-gray-700">
          <span className='text-gray-400'>Time Remaining: 15:00</span>
          <span className='text-gray-400'>Violations: 0</span>
        </div>

        {questions.map(q => {
          const isCorrect = isSubmitted && answers[q.id] === q.answer;
          const isIncorrect = isSubmitted && answers[q.id] && answers[q.id] !== q.answer;

          return (
            <div key={q.id} className="p-5 border border-gray-700 rounded-lg space-y-3 bg-gray-700 shadow-inner">
              <p className="font-semibold text-xl">{q.id}. {q.question}</p>
              
              <div className="flex flex-col gap-2">
                {q.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => !isSubmitted && handleSelect(q.id, opt)}
                    disabled={isSubmitted}
                    className={`px-4 py-3 text-left rounded-lg transition-all duration-150 ${
                      answers[q.id] === opt 
                        ? (isSubmitted ? (isCorrect ? "bg-green-600" : "bg-red-600") : "bg-blue-600") 
                        : "bg-gray-600 hover:bg-gray-500"
                    } ${isSubmitted ? 'cursor-default' : 'hover:scale-[1.01]'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {isSubmitted && isIncorrect && (
                  <p className="text-sm text-green-400 mt-2">Correct Answer: {q.answer}</p>
              )}
            </div>
          );
        })}

        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            className="w-full px-4 py-3 bg-yellow-600 rounded-lg hover:bg-yellow-500 font-bold transition-all shadow-xl hover:scale-[1.01]"
          >
            Submit Quiz
          </button>
        ) : (
             <div className="text-center p-4 bg-gray-700 rounded-lg shadow-inner">
                <p className='text-2xl font-bold'>Final Score: <span className='text-yellow-400'>{score} / {questions.length}</span></p>
                <p className='text-sm text-gray-400 mt-2'>Your results have been recorded.</p>
             </div>
        )}
      </div>
    </div>
  );
};

// Component 8: Main App
const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(""); // Student or Instructor
  const [screen, setScreen] = useState("choose"); // "choose", "login", "signup", "student", "instructor", "quiz"
  const [modal, setModal] = useState(null); // { message, type, onConfirm, onCancel }

  // 1. Load user state from local storage on mount
  useEffect(() => {
    const user = loadCurrentUser();
    if (user) {
        setCurrentUser(user);
        setRole(user.role);
        setScreen(user.role === "Student" ? "student" : "instructor");
    }
  }, []);

  const closeModal = () => setModal(null);
  
  // Custom Confirmation Modal component (for leaving quiz)
  const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="p-6 rounded-lg shadow-2xl max-w-sm w-full bg-gray-800 text-white border border-yellow-500">
                <h3 className="text-xl font-bold mb-3 text-yellow-300">Warning</h3>
                <p className="mb-6">{message}</p>
                <div className='flex justify-end gap-3'>
                    <button
                        onClick={onCancel}
                        className="py-2 px-4 bg-gray-600 text-white rounded font-semibold hover:bg-gray-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="py-2 px-4 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition-colors"
                    >
                        Proceed Anyway
                    </button>
                </div>
            </div>
        </div>
    );
  };
  
  // Determine which component to render
  const renderScreen = () => {
    // We no longer need to check for db/auth initialization
    switch (screen) {
      case "choose":
        return <ChooseRole setRole={setRole} setScreen={setScreen} />;
      case "login":
        return <LoginPage role={role} setScreen={setScreen} setCurrentUser={setCurrentUser} setModal={setModal} />;
      case "signup":
        return <SignupPage role={role} setScreen={setScreen} setCurrentUser={setCurrentUser} setModal={setModal} />;
      case "student":
        // Fallback for direct load without full context, although useEffect should handle it
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