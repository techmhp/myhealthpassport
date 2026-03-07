'use client';

import { useState, useEffect } from 'react';
import DetailedReports from '@/components/DetailedReports';
import YearSelect from '@/components/YearSelect';
import { schoolDetails, studentDetails } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { useParams } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProfileHeader from '@/components/Student/ProfileHeader';
import Header from '@/components/Header';
import ContactDetails from '@/components/ScreeningAnalyst/ContactDetails';
import BookAppointment from '@/components/ScreeningAnalyst/BookAppointment';
import InlineSpinner from '@/components/UI/InlineSpinner';
import { getCurrentAcademicYear } from '@/helpers/academicYear';

const StudentInfo = () => {
  const { schoolid, studentId } = useParams();
  const [school, setSchool] = useState({});
  const [results, setResults] = useState({});
  const [student_details, setStudent_details] = useState({});
  const [parent_details, setParent_details] = useState({});
  const [activeTab, setActiveTab] = useState('Contact-Details');
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());

  useEffect(() => {
    schoolDetails(schoolid)
      .then(res => {
        const response = JSON.parse(res);
        if (response.status === true) {
          setSchool(response.data.school);
        }
      })
      .catch(err => {
        toastMessage(err, 'error');
      });

    studentDetails(studentId)
      .then(res => {
        const response = JSON.parse(res);
        if (response.status === true) {
          setResults(response);
          setStudent_details(response.data.student_details);
          setParent_details(response.data.parent_details);
        }
      })
      .catch(err => {
        toastMessage(err.message, 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [schoolid, studentId]);

  const tabs = [
    { name: 'Contact details', id: 'Contact-Details', status: null },
    { name: 'Detailed Reports', id: 'Detailed-Reports', status: null },
    { name: 'Book Appointment', id: 'Book-Appointment', status: null },
  ];

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  // const handleYearChange = year => {
  //   setAcademicYear(year);
  // };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Contact-Details':
        return (
          <div className="bg-white rounded-lg">
            <ContactDetails parentDetails={parent_details} />
          </div>
        );

      case 'Detailed-Reports':
        return (
          <div className="bg-white rounded-lg">
            <DetailedReports />
          </div>
        );

      case 'Book-Appointment':
        return (
          <div className="bg-white rounded-lg">
            <BookAppointment studentId={studentId} />
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
          <div className="flex">
            <Breadcrumbs
              items={[
                {
                  name: school?.school_full_name ? school?.school_full_name : school?.school_name,
                  href: `/health-buddy/roster/${school.school_id}`,
                  current: false,
                },
                {
                  name: student_details?.identity_details
                    ? `Class ${student_details?.identity_details?.class_room}${student_details?.identity_details?.section}`
                    : '',
                  href: `/health-buddy/roster/${school.school_id}/class/${student_details?.identity_details?.class_room}-${student_details?.identity_details?.section}`,
                  current: true,
                },
                {
                  name: student_details?.id ? `${student_details?.first_name} ${student_details?.last_name}` : '',
                  href: '#',
                  current: true,
                },
              ]}
              homeLabel="Roster"
              homeHref={`/health-buddy/roster/${school.school_id}`}
            />
            {/* <YearSelect onYearChange={handleYearChange} /> */}
          </div>
          <div className="px-0 sm:px-1">
            <ProfileHeader details={results} school={school} />
          </div>
        </div>

        <div className="flex justify-center items-center mt-4 sm:mt-[22px]">
          <div className="w-full">
            <div className="relative flex items-center justify-center mb-[30px] sm:mb-[18px]">
              <div className="flex space-x-1 overflow-x-auto gap-2.5 rounded-lg border border-[#ECF2FF] p-1.5">
                {tabs.map(tab => (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    className={classNames(
                      activeTab === tab.id ? 'text-[#000000] bg-[#ECF2FF]' : 'text-gray-500 hover:text-gray-700',
                      'rounded-md flex gap-1 px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out cursor-pointer'
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
};

export default StudentInfo;
