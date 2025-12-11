import React, { useState } from 'react';
import { loadUsers, saveCurrentUser, saveUsers } from '../../utils/storage.js';

const SignupPage = ({ setScreen, setCurrentUser, setModal }) => {
  // Role selection state
  const [role, setRole] = useState("Student"); 

  // Common Fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");

  // Student Specific Fields
  const [studentNumber, setStudentNumber] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = () => {
    // Validation
    if (!username || !password || !fullName) {
      setModal({ message: "Please fill in all required fields (Username, Password, Name).", type: "error" });
      return;
    }

    if (role === "Student" && (!studentNumber || !grade || !section)) {
        setModal({ message: "Please fill in all student details.", type: "error" });
        return;
    }

    setIsLoading(true);
    const users = loadUsers();
    
    setTimeout(() => { 
        if (users.some(u => u.username === username)) {
            setModal({ message: "Username already taken. Please choose another.", type: "error" });
            setIsLoading(false);
            return;
        }

        const newUser = { 
            id: Date.now().toString(), 
            role,
            username, 
            password, 
            fullName,
            contact,
            // Add student specific fields if role is student
            ...(role === "Student" && {
                studentNumber,
                grade,
                section
            }),
            createdAt: new Date().toISOString() 
        };
        
        users.push(newUser);
        saveUsers(users); 
        saveCurrentUser(newUser); 
        
        setCurrentUser(newUser);
        setModal({ message: `Welcome, ${fullName}! Account created.`, type: "success" });
        setScreen(role === "Student" ? "student" : "instructor");
        setIsLoading(false);
    }, 500);
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transition-all duration-300 my-10">
      <button
        className="absolute left-4 top-4 p-2 bg-gray-700 rounded hover:bg-gray-600 font-bold transition-colors shadow-md text-sm"
        onClick={() => setScreen("login")}
      >
        ← Login
      </button>

      <h1 className="text-3xl font-bold mb-6 text-green-400">Sign Up</h1>

      {/* Role Toggle */}
      <div className="flex bg-gray-700 rounded-lg p-1 mb-6 w-full">
        <button 
            className={`flex-1 py-2 rounded-md font-bold transition-all ${role === "Student" ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setRole("Student")}
        >
            Student
        </button>
        <button 
            className={`flex-1 py-2 rounded-md font-bold transition-all ${role === "Instructor" ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setRole("Instructor")}
        >
            Instructor
        </button>
      </div>

      <div className="w-full flex flex-col gap-3 h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* Core Info */}
        <p className="text-gray-400 text-sm font-bold uppercase mt-2">Account Info</p>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
        
        <p className="text-gray-400 text-sm font-bold uppercase mt-2">Personal Info</p>
        <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
        <input type="text" placeholder="Contact Number / Email" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />

        {/* Student Specifics */}
        {role === "Student" && (
            <>
                <p className="text-gray-400 text-sm font-bold uppercase mt-2">Student Details</p>
                <input type="text" placeholder="Student Number" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                
                <div className="flex gap-2">
                    {/* CHANGED: Grade is now a Dropdown */}
                    <select 
                        value={grade} 
                        onChange={(e) => setGrade(e.target.value)} 
                        className="flex-1 p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="" disabled>Select Year</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                    </select>

                    <input type="text" placeholder="Section" value={section} onChange={(e) => setSection(e.target.value)} className="flex-1 p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
            </>
        )}
      </div>

      <button
          onClick={handleSignup}
          className={`w-full p-4 mt-6 rounded font-bold transition-all duration-200 shadow-lg ${isLoading ? 'bg-green-800 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 hover:scale-[1.02]'}`}
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>
    </div>
  );
};

export default SignupPage;