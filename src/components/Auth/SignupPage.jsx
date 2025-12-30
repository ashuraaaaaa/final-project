import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const SignupPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    contact: '',
    studentNumber: '',
    year: '',
    section: '',
    role: 'student',
    profilePic: ''
  });

  const [showPassword, setShowPassword] = useState(false); // Added toggle state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        setError("Image is too large! Please choose an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePic: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password || !formData.fullName) {
      setError("Please fill in all required fields.");
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(u => u.email === formData.email)) {
      setError("Email already registered.");
      return;
    }

    const newUser = {
      id: Date.now(),
      ...formData,
      username: formData.email.split('@')[0], 
      takenQuizzes: []
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    setSuccess(true);
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1e212d] text-white p-4">
      {/* Added min-h-[650px] here to prevent jumping size */}
      <div className="w-full max-w-md min-h-[650px] flex flex-col justify-center"> 
        
        <Link to="/" className="inline-flex items-center px-3 py-2 bg-[#2d303e] rounded text-sm font-medium hover:bg-[#3d404e] transition-colors mb-8 w-fit">
          ← Login
        </Link>

        <h2 className="text-4xl font-bold text-center text-green-500 mb-8">Sign Up</h2>

        {error && <div className="bg-red-600/20 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm text-center">{error}</div>}
        {success && <div className="bg-green-600/20 border border-green-500 text-green-200 p-3 rounded mb-4 text-sm text-center">Account created! Redirecting...</div>}

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
          {/* --- PROFILE PICTURE --- */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 mb-2 group">
              {formData.profilePic ? (
                <img src={formData.profilePic} alt="Profile Preview" className="w-full h-full rounded-full object-cover border-2 border-green-500" />
              ) : (
                <div className="w-full h-full rounded-full bg-[#2d303e] border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <input type="file" id="profilePicInput" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <label htmlFor="profilePicInput" className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                Change
              </label>
            </div>
            <span className="text-xs text-gray-400">Upload Profile Picture</span>
          </div>

          <div>
            <h3 className="text-gray-400 text-xs font-semibold mb-2">ACCOUNT INFO</h3>
            <input type="email" name="email" placeholder="ryuujiflare@gmail.com" value={formData.email} onChange={handleChange} className="w-full p-3 rounded bg-[#2d303e] border border-gray-600 focus:border-green-500 focus:outline-none mb-3" />
            
            {/* PASSWORD WITH TOGGLE */}
            <div className="relative">
                <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    placeholder="••••••" 
                    value={formData.password} 
                    onChange={handleChange} 
                    className="w-full p-3 rounded bg-[#2d303e] border border-gray-600 focus:border-green-500 focus:outline-none pr-10" 
                />
                <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                >
                    {showPassword ? "🙈" : "👁️"}
                </button>
            </div>
          </div>

          <div>
            <h3 className="text-gray-400 text-xs font-semibold mb-2">PERSONAL INFO</h3>
            <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className="w-full p-3 rounded bg-[#2d303e] border border-gray-600 focus:border-green-500 focus:outline-none mb-3" />
            <input type="text" name="contact" placeholder="Contact Number / Email" value={formData.contact} onChange={handleChange} className="w-full p-3 rounded bg-[#2d303e] border border-gray-600 focus:border-green-500 focus:outline-none" />
          </div>

          {formData.role === 'student' && (
            <div>
              <h3 className="text-gray-400 text-xs font-semibold mb-2">STUDENT DETAILS</h3>
              <input type="text" name="studentNumber" placeholder="Student Number" value={formData.studentNumber} onChange={handleChange} className="w-full p-3 rounded bg-[#2d303e] border border-gray-600 focus:border-green-500 focus:outline-none mb-3" />
              <div className="flex gap-3">
                <select name="year" value={formData.year} onChange={handleChange} className="flex-1 p-3 rounded bg-[#2d303e] border border-gray-600 focus:border-green-500 focus:outline-none appearance-none text-gray-400">
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                <input type="text" name="section" placeholder="Section" value={formData.section} onChange={handleChange} className="flex-1 p-3 rounded bg-[#2d303e] border border-gray-600 focus:border-green-500 focus:outline-none" />
              </div>
            </div>
          )}

          <button type="submit" className="w-full py-3 bg-green-600 text-white font-bold rounded hover:bg-green-500 transition-colors">
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;