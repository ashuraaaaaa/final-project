import React, { useState } from 'react';
import { loadUsers, saveUsers, saveCurrentUser } from '../../utils/storage';

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
    const users = loadUsers();
    
    setTimeout(() => { 
        if (users.some(u => u.email === email)) {
            setModal({ message: "Email already registered. Please sign in.", type: "error" });
            setIsLoading(false);
            return;
        }

        const newUser = { 
            id: Date.now().toString(), 
            email, 
            username, 
            password, 
            role, 
            createdAt: new Date().toISOString() 
        };
        
        users.push(newUser);
        saveUsers(users); 
        saveCurrentUser(newUser); 
        
        setCurrentUser(newUser);
        setModal({ message: `Welcome, ${username}! Account created.`, type: "success" });
        setScreen(role === "Student" ? "student" : "instructor");
        setIsLoading(false);
    }, 500);
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transition-all duration-300">
      <button
        className="absolute left-4 top-4 p-1 bg-gray-700 rounded hover:bg-gray-600 font-bold transition-colors shadow-md"
        onClick={() => setScreen("login")}
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-8 text-green-400">{role} Sign Up</h1>

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

export default SignupPage;