'use client';

import Image from 'next/image';
import Header from '@/components/Header';
import StaffMembers from '@/components/StaffMembers';
import ViewAllStaffMembers from '@/components/ViewAllStaffMembers';
import PlusButton from '@/components/UI/PlusButton';
import nookies from 'nookies';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const tabs = [
  { name: 'Categorial View', href: '#', id: 'Categorial-View' },
  { name: 'View All Staff', href: '#', id: 'View-All-Staff' },
];

const Staff = () => {
  const router = useRouter();
  const cookies = nookies.get();

  const [role, setRole] = useState(null);
  const [activeTab, setActiveTab] = useState('Categorial-View');
  const [items, setItems] = useState([]);
  const [openAccordion, setOpenAccordion] = useState(0);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const toggleAccordion = index => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  useEffect(() => {
    setRole(cookies.role);
    // Define the accordion items with associated components
    if (cookies.role && cookies.role !== 'SUPER_ADMIN') {
      setItems([
        { id: 2, icon: '/iconx/user.svg', title: 'On Ground Camp Co-Ordinators', team_type: 'ON_GROUND_TEAM', role: '' },
        { id: 3, icon: '/iconx/screening-crew.svg', title: 'Screening Crew', team_type: 'SCREENING_TEAM', role: '' },
        { id: 4, icon: '/detailed-reports-icons/social-interactions.svg', title: 'Analysis Crew', team_type: 'ANALYST_TEAM', role: '' },
      ]);
    } else {
      setItems([
        { id: 1, icon: '/iconx/pad.svg', title: 'Program Co-Ordinators', team_type: 'ADMIN_TEAM', role: 'PROGRAM_COORDINATOR' },
        { id: 2, icon: '/iconx/user.svg', title: 'On Ground Camp Co-Ordinators', team_type: 'ON_GROUND_TEAM', role: '' },
        { id: 3, icon: '/iconx/screening-crew.svg', title: 'Screening Crew', team_type: 'SCREENING_TEAM', role: '' },
        { id: 4, icon: '/detailed-reports-icons/social-interactions.svg', title: 'Analysis Crew', team_type: 'ANALYST_TEAM', role: '' },
      ]);
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Categorial-View':
        return (
          <div className="flex flex-col gap-[27px]">
            {items.map((item, index) => (
              <div key={index} className="w-full">
                <div
                  className="w-full h-11 flex justify-between items-center rounded-lg px-6 py-2.5 bg-[#ECF2FF] cursor-pointer"
                  onClick={() => toggleAccordion(index)}
                >
                  <div className="flex items-center gap-4">
                    <Image src={item.icon} alt={item.title} width={20} height={20} />
                    <span className="font-Inter font-medium text-sm leading-6 text-center">{item.title}</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-5 h-5 transition-transform ${openAccordion === index ? 'transform rotate-180' : ''}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                {/* Accordion Content */}
                {openAccordion === index && (
                  <div className="mx-4">
                    <StaffMembers team_type={item.team_type} role={item.role} />
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      case 'View-All-Staff':
        return (
          <div className="bg-white rounded-lg">
            <ViewAllStaffMembers />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className="p-4 sm:p-6 md:p-[28px] md:px-12 lg:px-18">
        <div className="w-full flex flex-row justify-between">
          <div className="flex items-center justify-center w-[inherit]">
            <nav aria-label="Tabs" className="mb-[30px] sm:mb-[18px] space-x-4 overflow-x-auto border border-[#ECF2FF] p-1 rounded-lg">
              {tabs.map(tab => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  className={classNames(
                    activeTab === tab.id ? 'text-[#000000] bg-[#ECF2FF]' : 'text-gray-500 hover:text-gray-700',
                    'rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap'
                  )}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
        {/* <div className="w-full flex items-center justify-center pb-4">
          <div className="w-[60%] flex gap-[60px] items-center justify-center">
            <div className="w-full flex gap-5 items-center">
              <div className="flex flex-1 gap-[10px]">
                <div className="w-full grid grid-cols-1">
                  <input
                    id="search"
                    name="search"
                    type="search"
                    placeholder="search"
                    className="w-full col-start-1 row-start-1 block rounded-[5px] p-[10px] bg-white pr-3 text-base text-gray-900 outline-1 -outline-offset-1 border-[#B5CCFF] outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:pl-9 sm:text-sm/6"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="#5389FF"
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 ml-3 size-4 self-center text-gray-400 sm:size-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#5389FF" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25" />
                </svg>
              </div>
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#5389FF" className="size-6">
                  <path d="M6 12a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 1 1 1.5 0v7.5A.75.75 0 0 1 6 12ZM18 12a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 1.5 0v7.5A.75.75 0 0 1 18 12ZM6.75 20.25v-1.5a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0ZM18.75 18.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 1.5 0ZM12.75 5.25v-1.5a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0ZM12 21a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 1.5 0v7.5A.75.75 0 0 1 12 21ZM3.75 15a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0ZM12 11.25a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5ZM15.75 15a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z" />
                </svg>
              </div>
            </div>
          </div>
        </div> */}
        {renderTabContent()}
      </div>
      <Link href="staff/add">
        <PlusButton />
      </Link>
    </>
  );
};

export default Staff;
