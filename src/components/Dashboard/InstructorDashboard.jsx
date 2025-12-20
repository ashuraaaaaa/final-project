import React, { useState, useEffect } from 'react';
import { clearCurrentUser, loadUsers } from '../../utils/storage.js'; 
import { loadQuizzes, deleteQuiz } from '../../utils/quizStorage.js'; 

const InstructorDashboard = ({ setScreen, currentUser, setModal }) => {
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [allQuizzes, setAllQuizzes] = useState([]);
    const [totalStudents, setTotalStudents] = useState(0);
    
    // State for the "View Details" Modal
    const [selectedQuiz, setSelectedQuiz] = useState(null); 
    const [viewingSubmissions, setViewingSubmissions] = useState([]);

    useEffect(() => {
        setAllQuizzes(loadQuizzes());
        setTotalStudents(loadUsers().filter(u => u.role === "Student").length);
    }, []);

    // Helper: Get aggregated stats for the main table
    const getQuizStats = (quizId) => {
        // Fetch the array of submissions
        const submissions = JSON.parse(localStorage.getItem(`quiz_submissions_${quizId}`) || '[]');
        
        return {
            totalSubmissions: submissions.length,
            // Sum of all violations across all students
            totalViolations: submissions.reduce((sum, sub) => sum + (sub.violations || 0), 0),
            // Check if results are released (check the first one as they are released in bulk)
            isReleased: submissions.length > 0 ? submissions[0].isReleased : false
        };
    };

    const formatTimeTaken = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    // Action: Open the "Who Took It" Modal
    const handleViewDetails = (quiz) => {
        const submissions = JSON.parse(localStorage.getItem(`quiz_submissions_${quiz.id}`) || '[]');
        setViewingSubmissions(submissions);
        setSelectedQuiz(quiz);
    };

    const handleReleaseResults = (quizId) => {
        const submissions = JSON.parse(localStorage.getItem(`quiz_submissions_${quizId}`) || '[]');
        
        if (submissions.length > 0) {
            // Update all submissions to be released
            const updatedSubmissions = submissions.map(sub => ({ ...sub, isReleased: true }));
            localStorage.setItem(`quiz_submissions_${quizId}`, JSON.stringify(updatedSubmissions));
            
            // Update local state
            setAllQuizzes(prev => prev.map(q => q.id === quizId ? {...q, isReleased: true} : q)); 
            setModal({ message: `Results for Quiz ID ${quizId} released to ${submissions.length} students.`, type: "success" });
        } else {
            setModal({ message: "No submissions to release yet.", type: "error" });
        }
    }

    const handleDeleteQuiz = (quizId) => {
        setModal({
            message: "Are you sure you want to delete this quiz?",
            type: "error",
            onConfirm: () => {
                deleteQuiz(quizId);
                localStorage.removeItem(`quiz_submissions_${quizId}`); // Clean up submissions
                setAllQuizzes(loadQuizzes()); 
            }
        });
    };

    const handleLogout = () => {
        clearCurrentUser(); 
        setScreen("login");
    };
  
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

            {/* --- STUDENT LIST MODAL --- */}
            {selectedQuiz && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-6 rounded-xl w-full max-w-4xl border border-blue-500 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                            <h2 className="text-2xl font-bold text-blue-300">
                                Submissions: {selectedQuiz.name}
                            </h2>
                            <button 
                                onClick={() => setSelectedQuiz(null)}
                                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white"
                            >
                                Close
                            </button>
                        </div>

                        {viewingSubmissions.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">No students have taken this quiz yet.</p>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-700 text-gray-300">
                                        <th className="p-3">Student Name</th>
                                        <th className="p-3">Score</th>
                                        <th className="p-3">Time Taken</th>
                                        <th className="p-3">Violations</th>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewingSubmissions.map((sub, idx) => (
                                        <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700">
                                            <td className="p-3 font-semibold">{sub.studentName}</td>
                                            <td className="p-3 text-green-400 font-bold">{sub.score}/{sub.totalScore}</td>
                                            <td className="p-3">{formatTimeTaken(sub.timeTaken)}</td>
                                            <td className={`p-3 font-bold ${sub.violations > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                                {sub.violations}
                                            </td>
                                            <td className="p-3 text-sm text-gray-400">
                                                {new Date(sub.submittedAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-3">
                                            <button
                                                onClick={() => setSelectedSubmission(sub)}
                                                className="px-3 py-1 bg-blue-600 rounded text-xs font-bold hover:bg-blue-500">
                                                View Answers
                                            </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        
                        <div className="mt-6 flex justify-end">
                             <button 
                                onClick={() => { handleReleaseResults(selectedQuiz.id); setSelectedQuiz(null); }}
                                className="px-6 py-2 bg-green-600 rounded font-bold hover:bg-green-500"
                                disabled={viewingSubmissions.length === 0}
                            >
                                Release All Results
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {selectedSubmission && (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-800 p-6 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-green-500">
      
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold text-green-300">
          Answers – {selectedSubmission.studentName}
        </h2>
        <button
          onClick={() => setSelectedSubmission(null)}
          className="px-3 py-1 bg-gray-600 rounded"
        >
          Close
        </button>
      </div>

      {Object.entries(selectedSubmission.answers || {}).map(([qId, ans], idx) => (
        <div key={qId} className="mb-4 p-4 bg-gray-700 rounded">
          <p className="font-semibold">Question {idx + 1}</p>
          <p className="text-yellow-300 mt-2">Answer:</p>
          <p className="text-white">{ans}</p>
        </div>
      ))}

      {/* Manual Score Editing */}
      <div className="mt-6">
        <label className="block mb-2 text-sm text-gray-300">
          Manual Score Adjustment
        </label>
        <input
          type="number"
          defaultValue={selectedSubmission.score}
          className="w-full p-2 rounded bg-gray-600"
          onBlur={(e) => {
            const updatedScore = Number(e.target.value);
            const key = `quiz_submissions_${selectedQuiz.id}`;
            const subs = JSON.parse(localStorage.getItem(key) || "[]");

            const updated = subs.map(s =>
              s.studentId === selectedSubmission.studentId
                ? { ...s, score: updatedScore }
                : s
            );

            localStorage.setItem(key, JSON.stringify(updated));
            setViewingSubmissions(updated);
          }}
        />
      </div>
    </div>
  </div>
)}


            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-4 border-gray-700 text-green-400">Quiz Management</h2>
                
                <button
                    className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors font-bold shadow-md flex items-center gap-2"
                    onClick={() => setScreen("createQuiz")}
                >
                    <span className='text-2xl'>+</span> Create New Quiz
                </button>
                
                <h2 className="text-2xl font-semibold border-b pb-2 border-gray-700 text-green-400 mt-8">Active Quizzes & Monitoring</h2>
                <p className='text-sm text-gray-400'>Total Students Registered: {totalStudents}</p>

                <div className='overflow-x-auto'>
                    <table className="w-full min-w-[700px] table-auto border-collapse rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-gray-700 text-left">
                                <th className="px-4 py-3 border-b border-gray-600">ID</th>
                                <th className="px-4 py-3 border-b border-gray-600">Name</th>
                                <th className="px-4 py-3 border-b border-gray-600">Submissions</th>
                                <th className="px-4 py-3 border-b border-gray-600">Violations (Total)</th>
                                <th className="px-4 py-3 border-b border-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allQuizzes.length === 0 && (
                                <tr><td colSpan="5" className='text-center p-4 text-gray-400'>No quizzes created yet.</td></tr>
                            )}
                            
                            {allQuizzes.map(quiz => {
                                const stats = getQuizStats(quiz.id);
                                return (
                                    <tr key={quiz.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                                        <td className="px-4 py-3 font-mono text-yellow-400">{quiz.id}</td>
                                        <td className="px-4 py-3 font-semibold">{quiz.name}</td>
                                        <td className="px-4 py-3">{stats.totalSubmissions} / {totalStudents}</td>
                                        <td className={`px-4 py-3 font-bold ${stats.totalViolations > 0 ? 'text-red-400' : 'text-green-400'}`}>{stats.totalViolations}</td>
                                        <td className="px-4 py-3 flex gap-2">
                                            {/* NEW: View Details Button */}
                                            <button 
                                                onClick={() => handleViewDetails(quiz)}
                                                className="px-3 py-1 text-xs rounded font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                                            >
                                                View
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleReleaseResults(quiz.id)}
                                                className={`px-3 py-1 text-xs rounded font-bold ${stats.isReleased ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'}`}
                                                disabled={stats.isReleased || stats.totalSubmissions === 0}
                                            >
                                                {stats.isReleased ? 'Released' : 'Release'}
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleDeleteQuiz(quiz.id)}
                                                className="px-3 py-1 text-xs rounded font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InstructorDashboard;