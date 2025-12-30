import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Use Router for navigation
import { loadUsers, saveCurrentUser } from '../../utils/storage.js';

// SVG Icons for Eye (Show) and Eye Slash (Hide)
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.173 8"/>
    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486z"/>
    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
    <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>
  </svg>
);

const LoginPage = ({ setCurrentUser, setModal }) => {
  const navigate = useNavigate(); // Hook for navigation
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // New state for toggling password
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    if (!username || !password) {
      setModal({ message: "Please enter your username and password.", type: "error" });
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => { 
        const users = loadUsers();
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            setModal({ message: "Invalid username or password.", type: "error" });
            setIsLoading(false);
            return;
        }

        // Login successful
        setCurrentUser(user);
        saveCurrentUser(user); 
        
        // Navigate based on role using Router
        if (user.role === "student") {
            navigate('/student');
        } else {
            navigate('/instructor');
        }
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
        
        {/* PASSWORD FIELD WITH TOGGLE */}
        <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-lg pr-12"
              disabled={isLoading}
            />
            <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
        </div>

        <button
          onClick={handleLogin}
          className={`w-full p-4 mt-2 rounded font-bold text-lg transition-all duration-200 shadow-lg ${isLoading ? 'bg-blue-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 hover:scale-[1.02]'}`}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>

        <p className="text-sm text-center mt-4 text-gray-400">
          Don't have an account?{" "}
          <Link 
            to="/signup" 
            className="text-blue-400 underline cursor-pointer hover:text-blue-300 font-semibold"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;