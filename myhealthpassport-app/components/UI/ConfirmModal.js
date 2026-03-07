'use client';

import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, type, data }) => {
  if (!isOpen) return null; // Don't render if not open
  const title = type === 'school_payment_status' ? 'Payment Status' : type === 'completed_status' ? 'Completion Status' : '';
  const confirmText = type === 'school_payment_status' ? 'Confirm' : type === 'completed_status' ? 'Mark All as Completed' : '';

  return (
    <div
      className="fixed inset-0 bg-[#2423239e] bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose} // Allows closing by clicking on the overlay
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm md:max-w-md animate-fade-in"
        onClick={e => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xm font-semibold text-gray-900 leading-[16px]">
            {type === 'completed_status' ? 'Completion Status' : type === 'payment_status' ? 'Payment Status' : ''}
          </h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors mb-2" aria-label="Close modal">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        {type === 'completed_status' ? (
          <div className="mb-6 text-gray-700">
            <div className="flex items-center gap-4 h-6 mb-1">
              <input type="checkbox" id="registration_status" checked={data.registration_status} className="w-5 h-5 border-[#5389FF] rounded" readOnly />
              <label htmlFor="registration_status" className="text-xm font-normal leading-6">
                Registration
              </label>
            </div>
            <div className="flex items-center gap-4 h-6 mb-1">
              <input type="checkbox" id="registration_status" checked={data.smart_scale_status} className="w-5 h-5 border-[#5389FF] rounded" readOnly />
              <label htmlFor="registration_status" className="text-xm font-normal leading-6">
                Physical Screening
              </label>
            </div>
            <div className="flex items-center gap-4 h-6 mb-1">
              <input type="checkbox" id="registration_status" checked={data.eye_screening_status} className="w-5 h-5 border-[#5389FF] rounded" readOnly />
              <label htmlFor="registration_status" className="text-xm font-normal leading-6">
                Eye Specialist
              </label>
            </div>
            <div className="flex items-center gap-4 h-6 mb-1">
              <input type="checkbox" id="registration_status" checked={data.dental_screening_status} className="w-5 h-5 border-[#5389FF] rounded" readOnly />
              <label htmlFor="registration_status" className="text-xm font-normal leading-6">
                Dentist
              </label>
            </div>
            <div className="flex items-center gap-4 h-6 mb-1">
              <input type="checkbox" id="registration_status" checked={data.nutrition_screening_status} className="w-5 h-5 border-[#5389FF] rounded" readOnly />
              <label htmlFor="registration_status" className="text-xm font-normal leading-6">
                Nutritionist
              </label>
            </div>
            <div className="flex items-center gap-4 h-6 mb-1">
              <input
                type="checkbox"
                id="registration_status"
                checked={data.behavioural_screening_status}
                className="w-5 h-5 border-[#5389FF] rounded"
                readOnly
              />
              <label htmlFor="registration_status" className="text-xm font-normal leading-6">
                Behavioural Specialist
              </label>
            </div>
          </div>
        ) : (
          <div className="mb-6 text-gray-700">Do you want confirm the payment as completed?</div>
        )}

        <div className="flex justify-center items-center gap-2 space-x-3">
          <button onClick={onClose} type="button" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
            Close
          </button>
          <button onClick={onConfirm} type="button" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
