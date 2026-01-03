// src/components/Common/ShowMessage.js
import React from 'react';

const ShowMessage = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  // Mapping styles to improve readability
  const colorMap = {
    info: 'bg-blue-500',
    error: 'bg-red-600',
    success: 'bg-green-600'
  };

  const isConfirm = message.includes("discard your answers");
  const bgColor = colorMap[type] || colorMap.info;

  // Helper to format the title
  const getTitle = () => {
    if (isConfirm) return "Warning";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`p-6 rounded-lg shadow-2xl max-w-sm w-full ${bgColor} text-white`}>
        <h3 className="text-xl font-bold mb-3">
          {getTitle()}
        </h3>
        
        <p className="mb-4">
          {message}
        </p>

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

export default ShowMessage;