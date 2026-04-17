'use client';

import React from 'react';

const CommentsModal = ({ isOpen, onClose, onConfirm, title, remarks, setRemarks, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    if (!isOpen) return null; // Don't render if not open

    return (
        <div className="fixed inset-0 bg-[#2423239e] bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={onClose} // Allows closing by clicking on the overlay
        >
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm md:max-w-md animate-fade-in"
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
            >
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xm font-semibold text-gray-900">{title}</h4>
                    <button
                        type='button'
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div className="mb-6 text-gray-700">
                    <div className="flex flex-col gap-5">
                        <div className="flex justify-between">
                            <div className="flex-1 flex flex-col gap-7">
                                <div className="w-full flex flex-col gap-5">
                                    <textarea
                                        placeholder="Please add remarks here"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        className="min-w-[298px] border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none resize-none"
                                        rows="6"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center items-center gap-2 space-x-3">
                    <button
                        type='button'
                        onClick={onClose}
                        className="bg-[#F09E3A] text-white font-normal cursor-pointer py-2 px-5 border border-[#F09E3A] rounded-[5px] whitespace-nowrap disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type='button'
                        onClick={onConfirm}
                        className="rounded-[5px] cursor-pointer bg-indigo-500 px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommentsModal;