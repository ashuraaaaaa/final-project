// src/components/Auth/LoginPage.js
import React, { useState } from 'react';
import { loadUsers, saveCurrentUser } from '../../utils/storage';

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
    
    const users = loadUsers();
    const user = users.find(u => u.email === email && u.password === password);

    setTimeout(() => { 
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
        saveCurrentUser(user); 
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
      <h1 className="text-3xl font-bold mb-8 text-blue-400">{role} Sign In </h1>

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

export default LoginPage;