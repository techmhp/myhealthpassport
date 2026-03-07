'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Schedule from '@/components/ScreeningAnalyst/Schedule';
import { isValidUrl } from '@/helpers/utilities';

export default function Home() {
  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    const base64_user = localStorage.getItem('user_info');
    if (base64_user) {
      const userJson = JSON.parse(atob(base64_user));
      setUserInfo(userJson);
    }
  }, []);

  return (
    <div className="w-full flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 flex">
        {/* Full height container that ensures centering */}
        <div className="mt-12 w-full flex flex-col items-center justify-center gap-10">
          <div className="gap-10 flex flex-col items-center">
            <Image
              alt="company logo"
              src={isValidUrl(userInfo.school_logo) ? userInfo.school_logo : '/brand-logos/school-logo.svg'}
              className="h-93px w-93px"
              width={93}
              height={93}
            />
            <div className="space-y-[10px]">
              <h1 className="font-inter font-semibold text-[20px] leading-[25px] tracking-[0%] text-center">
                {userInfo.school_name ? userInfo.school_name : 'Welcome'}
              </h1>
              <p className="font-inter font-normal text-[14px] leading-[100%] tracking-[0%] text-center m-0">Principal</p>
            </div>
          </div>
          <div className="flex gap-5">
            <Link href={'/school-admin/teachers'}>
              <div className="flex gap-[10px] px-[20px] py-[10px] rounded-[5px] border border-[#5465FF] items-center justify-center">
                <span className="font-normal text-[14px] leading-[100%] tracking-[0%] text-center">View Teachers Status</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#000000" className="size-5">
                  <path
                    fillRule="evenodd"
                    d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </Link>
            <Link href={'/school-admin/students'}>
              <div className="flex gap-[10px] px-[20px] py-[10px] rounded-[5px] bg-[#5465FF] items-center">
                <span className="font-normal text-[14px] leading-[100%] tracking-[0%] text-center text-white">View Students</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#FFFFFF" className="size-5">
                  <path
                    fillRule="evenodd"
                    d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-16 w-[80%] mb-10">
            <Schedule userInfo={userInfo} />
          </div>
        </div>
      </div>
    </div>
  );
}
