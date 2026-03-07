'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import Overview from '@/components/ScreeningAnalyst/Overview';
import Schedule from '@/components/ScreeningAnalyst/Schedule';
import Footer from '@/components/ScreeningAnalyst/Footer';
import { formatString } from '@/helpers/utilities';
import moment from 'moment';

const tabs = [
  { name: "Today's Overview", href: '#', id: 'today-overview' },
  { name: 'Schedule', href: '#', id: 'schedule' },
];


const Home = () => {
  const [activeTab, setActiveTab] = useState('today-overview');
  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    const base64_user = localStorage.getItem('user_info');
    if (base64_user) {
      const userJson = JSON.parse(atob(base64_user));
      setUserInfo(userJson);
    }
  }, []);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'today-overview':
        return (
          <div className="bg-white rounded-lg w-full">
            <Overview />
          </div>
        );
      case 'schedule':
        return (
          <div className="bg-white rounded-lg ">
            <Schedule userInfo={userInfo} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="w-full overflow-hidden min-h-[100vh]">
        <Header />
        <div className="w-full px-[72px] py-10">
          <div className="w-full">
            <div className="relative flex items-center justify-center">
              {/* Centered Tabs */}
              <div className="flex space-x-1  gap-2.5 rounded-lg border border-[#ECF2FF] p-1.5">
                {tabs.map(tab => (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    className={classNames(
                      activeTab === tab.id ? 'text-[#000000] bg-[#ECF2FF]' : 'text-gray-500 hover:text-gray-700',
                      'rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out cursor-pointer'
                    )}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-11 flex justify-between items-center">
              <div className="flex gap-5 items-center">
                <Image src="/detailed-reports-icons/apple.svg" alt="apple" width={24} height={26} />
                <div className="flex items-center gap-2.5">
                  <span className="text-[16px] font-medium leading-[25px]">
                    {userInfo && userInfo.first_name ? formatString(`${userInfo.first_name} ${userInfo.last_name}`?.toLowerCase()) : 'loading...'}
                  </span>
                  <div className="w-[24px] rotate-[-90deg] border border-black"></div>
                  <span className="text-[16px] font-normal leading-[25px]">{userInfo.user_role ? formatString(userInfo.user_role?.toLowerCase()) : 'loading...'}</span>
                </div>
              </div>
              <div className="w-auto">
                <span className="font-normal text-xs text-[#ACACAC]">{moment().format('dddd, DD MMMM YYYY h:mm a')}</span>
              </div>
            </div>
            <div className="w-full border border-[#B7B7B7] mt-6"></div>
            <div className="mt-10 w-full">{renderTabContent()}</div>
          </div>
        </div>
        <Footer userInfo={userInfo} />
      </div>
    </>
  );
};

export default Home;
