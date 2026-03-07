'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchoolStudentsList from '@/components/SchoolStudentsList';
import SectionalView from '@/components/SectionalView';
import { schoolDetails, closeEvent } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';

const Students = () => {
  const router = useRouter();
  const { schoolid } = useParams();
  const searchParams = useSearchParams();
  const eventid = searchParams.get('eventid');
  const [school, setSchool] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('Sectional-View');
  const tabs = [
    { name: 'Sectional View', href: '#', id: 'Sectional-View' },
    { name: 'View All Students', href: '#', id: 'View-All-Students' },
  ];

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

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

  const completeEvent = async () => {
    setIsSubmitting(true);
    try {
      const request = await closeEvent(eventid, schoolid);
      if (request.status === true) {
        toastMessage(request.message, 'success');
        router.push(`/onground/roster/${schoolid}`);
      }
    } catch (error) {
      toastMessage(error.message || 'An error occurred while closing event', 'error');
    } finally {
      setIsSubmitting(false);
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
                href: `/onground/roster/${schoolid}`,
              },
            ]}
            homeLabel="Roster"
            homeHref="/onground/roster"
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
        {eventid !== '0' && eventid !== null ? (
          <div className="mb-5 mt-5 flex justify-center items-center gap-5">
            <button
              type="button"
              onClick={() => router.back()}
              className="font-normal cursor-pointer w-[78px] h-[37px] py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={() => completeEvent()}
              onSubmit={() => setIsSubmitting(false)}
              className="rounded-[5px] cursor-pointer bg-indigo-500 w-[135px] h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Verify & Save'}
            </button>
          </div>
        ) : (
          ''
        )}
      </div>
    </>
  );
};

export default Students;
