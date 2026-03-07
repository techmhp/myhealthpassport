'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Breadcrumbs from '@/components/Breadcrumbs';
import ProfileHeader from '@/components/Student/ProfileHeader';
import StudentProfileForm from '@/components/Student/StudentProfileForm';
import Header from '@/components/Header';
import NutritionalQuestionnaire from '@/components/NutritionalQuestionnaire';
import BehaviouralQuestionnaire from '@/components/BehaviouralQuestionnaire';
import { studentDetails } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import InlineSpinner from '@/components/UI/InlineSpinner';

function Profile() {
  const router = useRouter();
  const { childId } = useParams();
  const [activeTab, setActiveTab] = useState('Nutritional-Questionnaire');
  const [student_details, setStudent_details] = useState({});
  const [tabName, setTabName] = useState('');
  const [loading, setLoading] = useState(true);

  const tabs = [
    { name: 'Profile', href: '#', id: 'Profile' },
    {
      name: 'Nutritional Questionnaire',
      href: '#',
      id: 'Nutritional-Questionnaire',
    },
    {
      // name: 'Emotional & Developmental Questionnaire',
      name: tabName,
      href: '#',
      id: 'Behavioural-Questionnaire',
    },
  ];

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  useEffect(() => {
    studentDetails(childId)
      .then(res => {
        const response = JSON.parse(res);
        if (response.status === true) {
          setStudent_details(response);
          setTabName(parseInt(response.data.student_details.identity_details.class_room) > 3 ? 'Emotional Questionnaire' : 'Developmental Questionnaire');
        }
      })
      .catch(err => {
        toastMessage(err, 'error');
      }).finally(() => {
        setLoading(false);
      });
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Profile':
        return <div className="bg-white rounded-lg">{student_details.status === true ? <StudentProfileForm details={student_details} /> : ''}</div>;
      case 'Nutritional-Questionnaire':
        return (
          <div className="bg-white rounded-lg">
            <NutritionalQuestionnaire />
          </div>
        );
      case 'Behavioural-Questionnaire':
        return (
          <div className=" bg-white rounded-lg">
            <BehaviouralQuestionnaire tabName={tabName} />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <InlineSpinner />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="p-4 sm:p-6 md:p-[26px] md:px-12 lg:px-18">
        <div className="px-2 sm:px-6 md:px-10 lg:px-14 grid gap-4 md:gap-8 lg:gap-13">
          <Breadcrumbs
            items={[
              { name: `${student_details?.data?.student_details.first_name} ${student_details?.data?.student_details.last_name}`, href: '#' },
              { name: 'Profile', href: '#', current: true },
            ]}
            homeLabel="Home"
            homeHref="/parent/home"
          />
          <div className="px-0 sm:px-1">
            <ProfileHeader details={student_details} />
          </div>
        </div>
        <div className="flex justify-center items-center mt-4 sm:mt-[22px]">
          <div className="w-full">
            <div className="relative flex justify-center items-center mb-[30px] sm:mb-[18px] w-full">
              {/* Tabs */}
              <div className="overflow-x-auto">
                <div className="inline-flex space-x-1 gap-2.5 rounded-lg border border-[#ECF2FF] p-1.5">
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

              {/* Edit Icon - absolutely positioned to the right of parent */}
              {/* <div className="absolute right-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                  <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                </svg>
              </div> */}
            </div>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
