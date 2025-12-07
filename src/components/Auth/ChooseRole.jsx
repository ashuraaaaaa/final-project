import React from 'react';

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

export default ChooseRole;