import React, { useState } from 'react';
import { loadUsers, saveCurrentUser } from '../../utils/storage.js';

const LoginPage = ({ setScreen, setCurrentUser, setModal }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    if (!username || !password) {
      setModal({ message: "Please enter your username and password.", type: "error" });
      return;
    }

    setIsLoading(true);
    
    // Simulate short loading
    setTimeout(() => { 
        const users = loadUsers();
        // Find user matching Username AND Password
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            setModal({ message: "Invalid username or password.", type: "error" });
            setIsLoading(false);
            return;
        }

        // Login successful
        setCurrentUser(user);
        saveCurrentUser(user); 
        
        // Redirect based on the role found in the account
        setScreen(user.role === "Student" ? "student" : "instructor");
        setIsLoading(false);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm transition-all duration-300 border border-gray-700">
      
      <h1 className="text-3xl font-bold mb-8 text-blue-400">Log In</h1>

      <div className="w-full flex flex-col gap-5">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-4 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-lg"
          disabled={isLoading}
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-lg"
          disabled={isLoading}
        />

        <button
          onClick={handleLogin}
          className={`w-full p-4 mt-2 rounded font-bold text-lg transition-all duration-200 shadow-lg ${isLoading ? 'bg-blue-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 hover:scale-[1.02]'}`}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
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
      </div>
    </div>
  );
};

export default LoginPage;