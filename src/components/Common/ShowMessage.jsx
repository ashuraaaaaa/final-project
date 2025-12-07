// src/components/Common/ShowMessage.js
import React from 'react';

const ShowMessage = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  let bgColor = 'bg-blue-500';
  if (type === 'error') bgColor = 'bg-red-600';
  if (type === 'success') bgColor = 'bg-green-600';
  
  const isConfirm = message.includes("discard your answers");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`p-6 rounded-lg shadow-2xl max-w-sm w-full ${bgColor} text-white`}>
        <h3 className="text-xl font-bold mb-3">{isConfirm ? "Warning" : (type.charAt(0).toUpperCase() + type.slice(1))}</h3>
        <p className="mb-4">{message}</p>
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