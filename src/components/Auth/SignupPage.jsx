import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loadUsers, saveUsers, saveCurrentUser } from '../../utils/storage.js'; 

// --- SVG ICONS (Matching Blue Theme) ---
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

const SignupPage = ({ setCurrentUser }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', contact: '',
    studentNumber: '', year: '', section: '', role: 'student', profilePic: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) { setError("Image is too large! Max 2MB."); return; }
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, profilePic: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');

    // 1. Basic Validation
    if (!formData.email || !formData.password || !formData.fullName) {
      setError("Please fill in all required fields.");
      return;
    }

    // 2. Load Existing Users (CRITICAL STEP)
    const users = loadUsers();

    // 3. Check for Duplicates (Avoid overwriting people)
    if (users.some(u => u.email === formData.email || u.username === formData.email.split('@')[0])) {
      setError("Email already registered.");
      return;
    }

    // 4. Create New User Object
    const newUser = {
      id: Date.now(),
      ...formData,
      username: formData.email.split('@')[0].toLowerCase(), // Auto-generate consistent username
      takenQuizzes: []
    };

    // 5. SAVE TO DATABASE (This was missing before!)
    users.push(newUser);
    saveUsers(users); // <--- This fixes the "User doesn't exist" login error

    // 6. Auto Login (Save Session)
    saveCurrentUser(newUser);
    if (setCurrentUser) setCurrentUser(newUser);

    // 7. Redirect
    setSuccess(true);
    setTimeout(() => {
      navigate(newUser.role === 'student' ? '/student' : '/instructor');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1e212d] text-white p-4">
      <div className="w-full max-w-md min-h-[650px] flex flex-col justify-center"> 
        
        <Link to="/" className="inline-flex items-center px-3 py-2 bg-[#2d303e] rounded text-sm font-medium hover:bg-[#3d404e] transition-colors mb-8 w-fit">
          ← Login
        </Link>

        <h2 className="text-4xl font-bold text-center text-green-500 mb-8">Sign Up</h2>

        {error && <div className="bg-red-600/20 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm text-center">{error}</div>}
        {success && <div className="bg-green-600/20 border border-green-500 text-green-200 p-3 rounded mb-4 text-sm text-center">Account created! Entering Dashboard...</div>}

        {/* ROLE SELECTION */}
        <div className="flex bg-[#2d303e] rounded-lg p-1 mb-6">
          <button
            className={`flex-1 py-2 rounded-md font-semibold transition-colors ${formData.role === 'student' ? 'bg-green-600' : 'hover:bg-[#3d404e]'}`}
            onClick={() => setFormData({ ...formData, role: 'student' })}
          >
            Student
          </button>
          <button
            className={`flex-1 py-2 rounded-md font-semibold transition-colors ${formData.role === 'instructor' ? 'bg-green-600' : 'hover:bg-[#3d404e]'}`}
            onClick={() => setFormData({ ...formData, role: 'instructor' })}
          >
            Instructor
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {/* PROFILE PICTURE */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 mb-2 group">
              {formData.profilePic ? (
                <img src={formData.profilePic} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-blue-500" />
              ) : (
                <div className="w-full h-full rounded-full bg-[#2d303e] border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-400">
                  📷
                </div>
              )}
              <input type="file" id="profilePicInput" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <label htmlFor="profilePicInput" className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                Change
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-gray-400 text-xs font-semibold mb-2">ACCOUNT INFO</h3>
            <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full p-3 rounded bg-[#2d303e] border border-gray-600 focus:border-blue-500 focus:outline-none mb-3" />
            
            <div className="relative">
                <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    placeholder="Password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    className="w-full p-3 rounded bg-[#2d303e] border border-gray-600 focus:border-green-500 focus:outline-none pr-10" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-white">
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
            </div>
          </div>

          <div>
            <h3 className="text-gray-400 text-xs font-semibold mb-2">PERSONAL INFO</h3>
            <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className="w-full p-3 rounded bg-[#2d303e] border border-gray-600 focus:border-green-500 focus:outline-none mb-3" />
            <input type="text" name="contact" placeholder="Contact Number" value={formData.contact} onChange={handleChange} className="w-full p-3 rounded bg-[#2d303e] border border-gray-600 focus:border-green-500 focus:outline-none" />
          </div>

          {formData.role === 'student' && (
            <div>
              <h3 className="text-gray-400 text-xs font-semibold mb-2">STUDENT DETAILS</h3>
              <input type="text" name="studentNumber" placeholder="Student Number" value={formData.studentNumber} onChange={handleChange} className="w-full p-3 rounded bg-[#2d303e] border border-gray-600 focus:border-green-500 focus:outline-none mb-3" />
              <div className="flex gap-3">
                <select name="year" value={formData.year} onChange={handleChange} className="flex-1 p-3 rounded bg-[#2d303e] border border-gray-600 focus:border-green-500 focus:outline-none appearance-none text-gray-400">
                  <option value="">Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                <input type="text" name="section" placeholder="Section" value={formData.section} onChange={handleChange} className="flex-1 p-3 rounded bg-[#2d303e] border border-gray-600 focus:border-green-500 focus:outline-none" />
              </div>
            </div>
          )}

          <button type="submit" className="w-full py-3 bg-green-600 text-white font-bold rounded hover:bg-green-500 transition-colors shadow-lg mt-4">
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;