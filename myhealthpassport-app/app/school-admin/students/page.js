'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import SectionalView from '@/components/SectionalView';
import FilterSection from '@/components/FilterSection';
import PlusButton from '@/components/UI/PlusButton';
import SchoolStudentsList from '@/components/SchoolStudentsList';
import { schoolDetails } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { useParams } from 'next/navigation';

const Students = () => {
  const tabs = [
    { name: 'Sectional View', href: '#Sectional-View', id: 'Sectional-View' },
    { name: 'View All Students', href: '#View-All-Students', id: 'View-All-Students' },
  ];

  const [activeTab, setActiveTab] = useState('Sectional-View');
  const [school, setSchool] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async school_info => {
    try {
      // Fetch School
      const schoolResponse = await schoolDetails(school_info.school_id);
      const schoolResults = JSON.parse(schoolResponse);
      if (schoolResults.status === true) {
        setSchool(schoolResults.data.school);
      }
    } catch (error) {
      toastMessage(error.message || 'An error occurred while fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const base64User = localStorage.getItem('user_info');
    if (base64User || base64User !== 'undefined') {
      const school_info = JSON.parse(atob(base64User));
      fetchData(school_info);
    }
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
                name: 'View All Students',
                href: '#',
                current: true,
              },
            ]}
            homeLabel="Students"
            homeHref="/school-admin/students"
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
      {/* Add (Plus) Button - Fixed at bottom left */}
      <Link href={'/school-admin/students/add'}>
        <PlusButton />
      </Link>
    </>
  );
};

export default Students;
