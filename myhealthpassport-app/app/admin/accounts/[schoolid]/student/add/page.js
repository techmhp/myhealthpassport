'use client';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import StudentForm from '@/components/Student/StudentForm';
import BulkImport from '@/components/BulkImport';
import React, { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { schoolDetails } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';


const AddStudent = () => {
  const { id } = useParams();
  const [school, setSchool] = useState([]);
  const [activeTab, setActiveTab] = useState('Bulk-Import');
  const tabs = [
    { name: 'Bulk Import', href: '#Bulk-Import', id: 'Bulk-Import' },
    { name: 'Individual Student', href: '#Individual-Student', id: 'Individual-Student' },
  ];

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const schoolResponse = await schoolDetails(id);
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Bulk-Import':
        return (
          <div className="bg-white rounded-lg">
            <BulkImport />
          </div>
        );
      case 'Individual-Student':
        return (
          <div className="bg-white rounded-lg">
            <StudentForm />
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <>
      <Header />
      <div className="px-[90px] py-[27px]">
        <div className="">
          <Breadcrumbs
            items={[
              {
                name: school?.school_full_name ? school?.school_full_name : school?.school_name,
                href: `/admin/schools/${id}`
              },
              {
                name: 'Add Student',
                href: '#',
                current: true,
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
    </>
  );
};

export default AddStudent;
