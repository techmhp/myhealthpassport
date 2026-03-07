import React from 'react';

const PrimaryButtons = () => {
  return (
    <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
      <button className="font-normal  py-2 px-5  border border-[#5465FF]  rounded-[5px] whitespace-nowrap">Close</button>
      <button
        type="button"
        className="rounded-[5px] bg-indigo-500  px-5 py-2 text-sm font-normal whitespace-nowrap text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
      >
        Save changes
      </button>
    </div>
  );
};

export default PrimaryButtons;
