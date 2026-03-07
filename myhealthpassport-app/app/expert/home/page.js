'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import Schedule from '@/components/ScreeningAnalyst/Schedule';
import InlineSpinner from '@/components/UI/InlineSpinner';
import { formatString, toastMessage } from '@/helpers/utilities';
import moment from 'moment';


export default function Home() {
  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    try {
      const base64_user = localStorage.getItem('user_info');
      if (base64_user) {
        const userJson = JSON.parse(atob(base64_user));
        setUserInfo(userJson);
      }
    } catch (err) {
      toastMessage(err, 'error');
    }
  }, []);

  return (
    <main>
      <Header />
      <div className="w-full px-[72px] py-10">
        <div className="w-full">
          <div className="mt-10 flex justify-between items-center">
            <div className="flex gap-5 items-center">
              <Image src="/iconx/teeth.svg" alt="apple" width={24} height={26} />
              <div className="flex items-center gap-2.5">
                <span className="text-[16px] font-medium leading-[25px]">
                  {userInfo && userInfo.first_name ? formatString(`${userInfo.first_name} ${userInfo.last_name}`?.toLowerCase()) : <InlineSpinner />}
                </span>
                <div className="w-[24px] rotate-[-90deg] border-1 border-black"></div>
                <span className="text-[16px] font-normal leading-[25px]">
                  {userInfo.user_role ? formatString(userInfo.user_role?.toLowerCase()) : <InlineSpinner />}
                </span>
                <div className="w-[24px] rotate-[-90deg] border-1 border-black"></div>
                <span className="text-[16px] font-normal leading-[25px]">MBBS</span>
              </div>
            </div>
            <div className='relative'>
              <span className="font-normal text-xs text-[#ACACAC]">{moment().format("dddd, DD MMMM YYYY h:mm a")}</span>
            </div>
          </div>
          <div className="w-full border border-[#B7B7B7] mt-5"></div>
          <div className="mt-10 w-full">
            <div className="bg-white rounded-lg">
              <Schedule userInfo={userInfo} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
