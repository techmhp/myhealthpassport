'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import ViewAllTeachers from '@/components/ViewAllTeachers';
import SectionalView from '@/components/SectionalView';
import SchoolStudentsList from '@/components/SchoolStudentsList';
import PlusButton from '@/components/UI/PlusButton';
import Link from 'next/link';
import { schoolDetails } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';

const SchoolData = () => {
  const { schoolid } = useParams();
  const [school, setSchool] = useState([]);

  const tabs = [
    { name: 'Sectional View', href: '#', id: 'Sectional-View' },
    { name: 'View All Students', href: '#', id: 'View-All-Students' },
    { name: 'View All Teachers', href: '#', id: 'View-All-Teachers' },
  ];

  const [activeTab, setActiveTab] = useState('Sectional-View');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch School
        const schoolResponse = await schoolDetails(schoolid);
        const schoolResults = JSON.parse(schoolResponse);
        if (schoolResults.status === true) {
          setSchool(schoolResults.data.school);
        }
      } catch (error) {
        toastMessage(error.message || 'An error occurred while fetching data', 'error');
      }
    };
    fetchData();
  }, []);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Sectional-View':
        return (
          <div className="bg-white rounded-lg">
            <SectionalView school={school} />
          </div>
        );
      case 'View-All-Students':
        return (
          <div className="bg-white rounded-lg">
            <SchoolStudentsList school={school} />
          </div>
        );
      case 'View-All-Teachers':
        return (
          <div className="bg-white rounded-lg">
            <ViewAllTeachers />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className="p-6.5 px-[146px]">
        <div className="">
          <Breadcrumbs
            items={[
              {
                name: school?.school_full_name ? school?.school_full_name : school?.school_name,
                href: `/admin/schools/${schoolid}`,
              },
            ]}
            homeLabel="Schools"
            homeHref="/admin/schools"
          />
        </div>
        <div className="flex items-center justify-center mt-[17px] mb-[27px]">
          <div className="flex space-x-1 overflow-x-auto gap-2.5 rounded-lg border border-[#ECF2FF] p-1.5">
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
      <Link href={`/admin/schools/${schoolid}/student/add`}>
        <PlusButton />
      </Link>
    </>
  );
};

export default SchoolData;
