import { useState } from 'react';
import Link from 'next/link';

const Overview = () => {
  const [progress, setProgress] = useState(82);

  return (
    <div className="w-full flex flex-col justify-between gap-10">
      <p className="font-medium text-sm">Todays Progress | International School of Hyderabad</p>
      <div className="w-full flex gap-24 items-center">
        {/* Circular Progress Indicator */}
        <div className="flex gap-16 items-center">
          <div className="flex items-center gap-7">
            <div className="w-19 h-19">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background Circle */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E6EFFF" strokeWidth="12" />
                {/* Progress Circle - gap at the top right */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#5389FF"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 40 * (progress / 100)} ${2 * Math.PI * 40}`}
                  strokeLinecap="round"
                  transform="rotate(0 50 50)"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="font-semibold text-[20px] leading-[25px] tracking-[0px] text-[#5389FF] mb-0">{progress}%</p>
              <span className="font-normal text-[14px] leading-[100%] tracking-[0px]">Completed</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="font-semibold text-[20px] leading-[25px] tracking-[0px] mb-0">
              <span className="text-[#5389FF]">7</span>/9
            </p>
            <span className="font-normal text-[14px] leading-[100%] tracking-[0px]">Classes</span>
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="font-semibold text-[20px] leading-[25px] tracking-[0px] mb-0">
              <span className="text-[#5389FF]">124</span>/340
            </p>
            <span className="font-normal text-[14px] leading-[100%] tracking-[0px]">Students</span>
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="font-semibold text-[20px] leading-[25px] tracking-[0px] mb-0">Class 9E</p>
            <span className="font-normal text-[14px] leading-[100%] tracking-[0px]">Currently Reporting</span>
          </div>
        </div>
        <Link href="roster" className="px-[20px] py-[10px] bg-[#5465FF] rounded-[5px] flex items-center gap-2.5">
          <span className="text-sm font-normal text-white">See Roster</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="size-5">
            <path
              fillRule="evenodd"
              d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default Overview;
