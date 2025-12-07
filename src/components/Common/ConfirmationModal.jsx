// src/components/Common/ConfirmationModal.js
import React from 'react';

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="p-6 rounded-lg shadow-2xl max-w-sm w-full bg-gray-800 text-white border border-yellow-500">
        <h3 className="text-xl font-bold mb-3 text-yellow-300">Warning</h3>
        <p className="mb-6">{message}</p>
        <div className='flex justify-end gap-3'>
          <button
            onClick={onCancel}
            className="py-2 px-4 bg-gray-600 text-white rounded font-semibold hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="py-2 px-4 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition-colors"
          >
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;