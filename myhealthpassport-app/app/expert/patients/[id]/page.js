'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProfileHeader from '@/components/Student/ProfileHeader';
import Header from '@/components/Header';
import CaseHistory from '@/components/CaseHistory';
import Dentist from '@/components/Expert/Dentist';
// import Dentist from '@/components/ScreeningAnalyst/Dentist';
import Ophthalmologist from '@/components/Expert/Ophthalmologist';
import Paediatrician from '@/components/Expert/Paediatrician';
import Psychologist from '@/components/Expert/Psychologist';
import NutritionistReport from '@/components/Expert/NutritionistReport';
import DetailedReports from '@/components/DetailedReports';
import VaccinationRecords from '@/components/HealthRecords/VaccinationRecords';
import { studentDetails } from '@/services/secureApis';
import InlineSpinner from '@/components/UI/InlineSpinner';
import nookies from 'nookies';
import { toastMessage } from '@/helpers/utilities';

function PatientProfile() {
  const cookies = nookies.get();
  const router = useRouter();
  const { id } = useParams();

  // Define all tab configurations based on specialist type
  const tabs =
    cookies.role === 'PEDIATRICIAN'
      ? [
          { name: 'Case History', href: '#', id: 'Case-History' },
          { name: 'Detailed Reports', href: '#', id: 'detail-reports' },
          { name: 'Vaccination Records', href: '#', id: 'Vaccination Records' },
          { name: 'Diagnosis Treatment', href: '#', id: 'Diagnosis-Treatment' },
        ]
      : [
          { name: 'Case History', href: '#', id: 'Case-History' },
          { name: 'Detailed Reports', href: '#', id: 'detail-reports' },
          { name: 'Diagnosis Treatment', href: '#', id: 'Diagnosis-Treatment' },
        ];

  const [activeTab, setActiveTab] = useState('Case-History');
  const [studentDetailsData, setStudentDetailsData] = useState({});
  const [loading, setLoading] = useState(true);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  useEffect(() => {
    studentDetails(id)
      .then(res => {
        const response = JSON.parse(res);
        if (response.status === true) {
          setStudentDetailsData(response);
        }
      })
      .catch(err => {
        toastMessage(err, 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Case-History':
        return (
          <div className="bg-white rounded-lg">
            <CaseHistory />
          </div>
        );
      case 'detail-reports':
        return (
          <div className="bg-white rounded-lg">
            <DetailedReports />
          </div>
        );

      case 'Vaccination Records':
        return (
          <div className="bg-white rounded-lg">
            <VaccinationRecords />
          </div>
        );
      case 'Diagnosis-Treatment':
        if (cookies.role === 'DENTIST') {
          return (
            <div className="bg-white rounded-lg">
              <Dentist />
            </div>
          );
        }
        if (cookies.role === 'EYE_SPECIALIST') {
          return (
            <div className="bg-white rounded-lg">
              <Ophthalmologist />
            </div>
          );
        }
        if (cookies.role === 'PEDIATRICIAN') {
          return (
            <div className="bg-white rounded-lg">
              <Paediatrician />
            </div>
          );
        }
        if (cookies.role === 'PSYCHOLOGIST') {
          return (
            <div className="bg-white rounded-lg">
              <Psychologist />
            </div>
          );
        }
        if (cookies.role === 'NUTRITIONIST') {
          return (
            <div className="bg-white rounded-lg">
              <NutritionistReport />
            </div>
          );
        }
      default:
        return null;
    }
  };

  if (loading)
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <InlineSpinner />
      </div>
    );

  return (
    <>
      <Header />
      <div className="p-5 sm:p-6 md:p-[1rem] md:px-12 lg:px-21">
        <div className="px-2 sm:px-6 md:px-10 lg:px-2 grid gap-4 md:gap-8 lg:gap-13">
          <Breadcrumbs
            items={[
              {
                name: studentDetailsData?.data?.student_details.first_name + ' ' + studentDetailsData?.data?.student_details.last_name,
                href: '#',
                current: true,
              },
            ]}
            homeLabel="My Patients"
            homeHref="/expert/patients"
          />
          <div className="px-0 sm:px-0">
            <ProfileHeader details={studentDetailsData} />
          </div>
        </div>
        <div className="flex justify-center items-center mt-4 sm:mt-[22px]">
          <div className="w-full">
            <div className="relative flex items-center justify-center mb-[30px] sm:mb-[18px]">
              {/* Centered Tabs */}
              <div className="flex space-x-1 overflow-x-auto gap-2.5 rounded-lg border border-[#ECF2FF] p-1.5">
                {tabs.map(tab => (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    className={classNames(
                      activeTab === tab.id ? 'text-[#000000] bg-[#ECF2FF]' : 'text-gray-500 hover:text-gray-700',
                      'flex rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out cursor-pointer'
                    )}
                  >
                    {tab.name}
                    {tab.id == 'Diagnosis-Treatment' ? <Image alt="Subtract" src="/iconx/subtract.svg" width={16} height={16} className="size-5 ml-3" /> : ''}
                  </button>
                ))}
              </div>

              {/* Edit Icon - Absolutely positioned to the right */}
              <div className="flex absolute right-5">
                <Link href="#" title="download" className="m-2">
                  <Image src="/iconx/download-2.svg" width={20} height={20} alt="download" className="size-5" />
                </Link>
                <Link href="#" title="print" className="m-2">
                  <Image src="/iconx/print.svg" width={20} height={20} alt="download" className="size-5" />
                </Link>
              </div>
            </div>
            {/* Select Year */}
            {/* <div className="w-full justify-center flex items-center gap-2 h-[44px] m-4">
              <span className="text-[#656565] text-sm font-normal">Select Year</span>
              <div className="relative">
                <select
                  className="h-[44px] min-w-[300px] px-4 py-[10px] border border-[#D5D9E2] rounded-lg appearance-none text-[#000000] text-sm font-normal leading-[24px] tracking-normal pr-10"
                  defaultValue="2024-25"
                >
                  <option value="2024-25">2024-25</option>
                  <option value="2023-24">2023-24</option>
                  <option value="2022-23">2022-23</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#656565]">
                    <path
                      fillRule="evenodd"
                      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div> */}
            {renderTabContent()}
          </div>
        </div>
      </div>
    </>
  );
}

export default PatientProfile;
