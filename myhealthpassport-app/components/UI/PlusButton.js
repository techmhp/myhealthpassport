import React from 'react';

const PlusButton = () => {
  return (
    <div
      className="fixed bottom-6 cursor-pointer right-6 bg-blue-500 text-white rounded-[100%] w-9 h-9 p-2.5 flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      aria-label="Add new item"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
        <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
      </svg>
    </div>
  );
};

export default PlusButton;
