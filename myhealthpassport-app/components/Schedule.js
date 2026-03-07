'use client';

import React, { useEffect, useState } from 'react';
import CalendarPicker from './Dummy';
import Image from 'next/image';
import Link from 'next/link';

const Schedule = ({ userInfo }) => {
  return (
    <div className="flex gap-16 justify-start w-full">
      <div className="flex flex-col gap-5 w-[30%]">
        <p className="mb-0 font-medium text-sm">Your Calendar</p>
        <CalendarPicker />
      </div>
      <div className="flex flex-col gap-5  items-start w-[46%]">
        <div className="flex flex-col gap-4 w-full items-start">
          <p className="font-medium text-[14px] leading-[100%] mb-0">Today</p>
          <Link href={userInfo.role_type == 'CONSULTANT_TEAM' ? '#' : '/admin/schools/1/schoolinfo'} className="w-full">
            <div className="flex gap-[16px] rounded-[8px] border-2 border-[#5389FF] p-[20px] w-full">
              <Image alt="company logo" src="/brand-logos/school-logo.svg" className="h-58px w-58px" width={58} height={58} />
              <div className="flex flex-col gap-1.5">
                <p className="font-normal text-[12px] leading-[100%] text-[#949494] mb-0">Thursday, 19 Sept 2025</p>
                <p className="font-medium text-[14px] leading-[100%] mb-0">International School of India</p>
                <p className="font-medium text-[12px] leading-[100%] mb-0">08:00 - 16:00 | 8 Hours</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="flex flex-col gap-4 items-start w-full">
          <p className="font-medium text-[14px] leading-[100%] mb-0">Upcoming</p>
          <div className="flex gap-[16px] rounded-[8px] border-2 border-[#B3CBFF] p-[20px] w-full">
            <Image alt="company logo" src="/brand-logos/school-logo.svg" className="h-58px w-58px" width={58} height={58} />
            <div className="flex flex-col gap-1.5">
              <p className="font-normal text-[12px] leading-[100%] text-[#949494] mb-0">Thursday, 19 Sept 2025</p>
              <p className="font-medium text-[14px] leading-[100%] mb-0">International School of India</p>
              <p className="font-medium text-[12px] leading-[100%] mb-0">08:00 - 16:00 | 8 Hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
