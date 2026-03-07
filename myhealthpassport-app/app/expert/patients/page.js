'use client';

import React, { useState, useEffect } from 'react';
import StudentCardView from '@/components/StudentCardView';
import Breadcrumbs from '@/components/Breadcrumbs';
import Header from '@/components/Header';
import PatientsList from '@/components/PatientsList';
import FilterSection from '@/components/FilterSection';
import InlineSpinner from '@/components/UI/InlineSpinner';
import { useRouter } from 'next/navigation';
import { getPatientsList } from '@/services/secureApis';
import { formatFullName, toastMessage } from '@/helpers/utilities';

const Patients = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Table-View');
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { name: 'Table View', href: '#', id: 'Table-View' },
    { name: 'Card View', href: '#', id: 'Card-View' },
  ];

  useEffect(() => {
    getPatientsList()
      .then(res => {
        const response = JSON.parse(res);
        if (response.status === true) {
          setPatients(response.data.consultations);
        } else if (response.status === false) {
          toastMessage(response.message, 'error');
        }
      })
      .catch(err => {
        toastMessage(err, 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  // Handle search input change
  const handleSearchChange = value => {
    setSearchQuery(value);
  };

  // Filter the patients list based on the search term
  const filteredPatients = patients.filter(patient => {
    // Convert search term to lowercase for case-insensitive search
    const lowerCaseSearchTerm = searchQuery.toLowerCase();

    // Check if the search term is found in any of the relevant fields
    return (
      formatFullName(patient).toLowerCase().includes(lowerCaseSearchTerm) ||
      patient.phone.toLowerCase().includes(lowerCaseSearchTerm) ||
      patient.age.toLowerCase().includes(lowerCaseSearchTerm) ||
      patient.gender.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  if (loading)
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <InlineSpinner />
      </div>
    );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Table-View':
        return (
          <div className="bg-white rounded-lg pt-2">
            <PatientsList patients={filteredPatients} />
          </div>
        );
      case 'Card-View':
        return Object.keys(filteredPatients).length > 0 ? (
          <div className="bg-white rounded-lg grid grid-cols-4">
            {filteredPatients.map((patient, index) => (
              <StudentCardView key={index} student={patient} />
            ))}
          </div>
        ) : (
          <div className="text-center justity-center mt-5 text-gray-500 text-sm font-normal">No Data Found</div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className="p-4 px-[80px]">
        <div className="">
          <Breadcrumbs
            items={[
              {
                name: 'List View',
                href: '#',
                current: true,
              },
            ]}
            homeLabel="My Patients"
            homeHref="/expert/patients"
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
        <div className="pb-4">
          <FilterSection searchQuery={searchQuery} onSearchChange={handleSearchChange} />
        </div>
        {renderTabContent()}
      </div>
    </>
  );
};
export default Patients;
