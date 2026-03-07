'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import Breadcrumbs from '@/components/Breadcrumbs';
import ProfileHeader from '@/components/Student/ProfileHeader';
import Header from '@/components/Header';
import NutritionalQuestionnaire from '@/components/NutritionalQuestionnaire';
import BehaviouralQuestionnaire from '@/components/BehaviouralQuestionnaire';
import { studentDetails } from '@/services/secureApis';
import { formatFullName } from '@/helpers/utilities'


function Profile() {
  const router = useRouter();
  const { id } = useParams();
  const [profile, setProfile] = useState({});

  const tabs = [
    {
      name: 'Nutritional Questionnaire',
      href: '#',
      id: 'Nutritional-Questionnaire',
    },
    {
      name: 'Emotional & Developmental Questionnaire',
      href: '#',
      id: 'Behavioural-Questionnaire',
    },
  ];
  const [activeTab, setActiveTab] = useState('Nutritional-Questionnaire');

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  useEffect(() => {
    studentDetails(id).then(res => {
      const response = JSON.parse(res);
      if (response.status === true) {
        setProfile(response);
      }
    }).catch(err => {
      // console.log('error', err);
      toastMessage(err, "error");
    });
  }, [id]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Nutritional-Questionnaire':
        return (
          <div className="bg-white rounded-lg">
            <NutritionalQuestionnaire />
          </div>
        );
      case 'Behavioural-Questionnaire':
        return (
          <div className=" bg-white rounded-lg">
            <BehaviouralQuestionnaire />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className="p-4 sm:p-6 md:p-[26px] md:px-12 lg:px-18">
        <div className="px-2 sm:px-6 md:px-10 lg:px-14 grid gap-4 md:gap-8 lg:gap-13">
          <Breadcrumbs items={[
            {
              name: profile?.data?.student_details?.first_name ? formatFullName(profile.data.student_details) : '',
              href: '#',
              current: true,
            },
            { name: profile.name, href: '#', current: true }
          ]}
            homeLabel="My Students"
            homeHref="/teacher/students" />
          <div className="px-0 sm:px-1">
            <ProfileHeader details={profile} />
          </div>
        </div>
        <div className="flex justify-center items-center mt-4 sm:mt-[22px]">
          <div className="w-full">
            <div className="relative flex items-center justify-center mb-[30px] sm:mb-[18px]">
              {/* Centered Tabs */}
              <div className="flex space-x-1 overflow-x-auto gap-2.5 rounded-lg border border-[#ECF2FF] p-1.5 mb-4 sm:mb-3">
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
            {renderTabContent()}
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
