import React from 'react';

const DangerButtons = () => {
  return (
    <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
      <button className="font-normal  py-2 px-5  border border-[#5465FF]  rounded-[5px] whitespace-nowrap">Close</button>
      <button type="button" className="rounded-[5px] border border-[#FF5454]   px-5 py-2 text-sm font-normal whitespace-nowrap text-[#FF5454] shadow-xs ">
        Deactivate Profile
      </button>
    </div>
  );
};

export default DangerButtons;
