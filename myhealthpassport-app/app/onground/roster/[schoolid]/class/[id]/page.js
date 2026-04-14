'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import StudentCardView from '@/components/StudentCardView';
import Breadcrumbs from '@/components/Breadcrumbs';
import Header from '@/components/Header';
import SchoolClassRoomStudentsList from '@/components/SchoolClassRoomStudentsList';
import { schoolDetails, studentListByClassAndSection, closeEvent } from '@/services/secureApis';
import { toastMessage, formatFullName } from '@/helpers/utilities';
import InlineSpinner from '@/components/UI/InlineSpinner';
import FilterSection from '@/components/FilterSection';

const ClassView = () => {
  const router = useRouter();
  const { schoolid, id } = useParams();
  const classSection = decodeURI(id);
  const searchParams = useSearchParams();
  const eventid = searchParams.get('eventid');
  const [activeTab, setActiveTab] = useState('Table-View');
  const [schoolProfile, setSchoolProfile] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Summary counters — computed from full students list (not filtered)
  const summaryStats = [
    {
      label: 'Total Students',
      count: students.length,
      color: 'bg-[#ECF2FF] text-[#5389FF]',
      borderColor: 'border-[#B5CCFF]',
    },
    {
      label: 'Registered',
      count: students.filter(s => s.registration_status).length,
      color: 'bg-green-50 text-green-700',
      borderColor: 'border-green-200',
    },
    {
      label: 'Vision Screening',
      count: students.filter(s => s.eye_screening_status).length,
      color: 'bg-blue-50 text-blue-700',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Dental Screening',
      count: students.filter(s => s.dental_screening_status).length,
      color: 'bg-purple-50 text-purple-700',
      borderColor: 'border-purple-200',
    },
    {
      label: 'Nutrition Screening',
      count: students.filter(s => s.nutrition_screening_status).length,
      color: 'bg-orange-50 text-orange-700',
      borderColor: 'border-orange-200',
    },
    {
      label: 'Psychology Screening',
      count: students.filter(s => s.behavioural_screening_status).length,
      color: 'bg-pink-50 text-pink-700',
      borderColor: 'border-pink-200',
    },
  ];

  const tabs = [
    { name: 'Table View', href: '#', id: 'Table-View' },
    { name: 'Card View', href: '#', id: 'Card-View' },
  ];
  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  // Function to simulate fetching data from your API
  const fetchSchoolDetails = async () => {
    try {
      const response = await schoolDetails(schoolid);
      const results = await JSON.parse(response);
      if (results.status === true) {
        setSchoolProfile(results);
      } else {
        toastMessage(results.message || 'Failed to fetch school details.', 'error');
      }
    } catch (err) {
      toastMessage(err || 'An error occurred while fetching data.', 'error');
    }
  };

  const fetchStudentsData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!classSection) {
        setError('Invalid class found in URL parameter');
        return;
      }
      const dashIdx = classSection.indexOf('-'); const classRoom = dashIdx >= 0 ? classSection.slice(0, dashIdx) : classSection; const section = dashIdx >= 0 ? classSection.slice(dashIdx + 1) : '';
      const allStudentsResponse = await studentListByClassAndSection(schoolid, classRoom, section, searchQuery);
      const allStudentsResults = JSON.parse(allStudentsResponse);
      if (allStudentsResults.status === true) {
        const allStudents = allStudentsResults.data.students_list;
        setStudents(allStudents);
      } else {
        setError('Failed to fetch students: ' + allStudentsResults.message);
      }
    } catch (err) {
      setError('Error fetching students data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchSchoolDetails();
    fetchStudentsData();
  }, []);

  // Handle search input change
  const handleSearchChange = value => {
    setSearchQuery(value);
  };

  // Filter the student list based on the search term
  const filteredStudents = students.filter(student => {
    // Convert search term to lowercase for case-insensitive search
    const lowerCaseSearchTerm = searchQuery.toLowerCase();

    // Check if the search term is found in any of the relevant fields
    return (
      student.roll_no.toLowerCase().includes(lowerCaseSearchTerm) ||
      formatFullName(student).toLowerCase().includes(lowerCaseSearchTerm) ||
      student.gender.toLowerCase().includes(lowerCaseSearchTerm) ||
      student.age.toLowerCase().includes(lowerCaseSearchTerm) ||
      student.phone.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="py-8 w-full mx-auto">
          <InlineSpinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-red-500">{error}</div>
        </div>
      );
    }

    if (filteredStudents.length === 0) {
      return (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-gray-500">No students found for this section.</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'Table-View':
        return (
          <div className="bg-white rounded-lg pt-2">
            <SchoolClassRoomStudentsList school={schoolProfile?.data?.school} students={filteredStudents} stickyHeader={true} />
          </div>
        );
      case 'Card-View':
        return (
          <div className="bg-white rounded-lg grid grid-cols-4">
            {filteredStudents.map(student => (
              <StudentCardView key={student.id} student={student} />
            ))}
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
        router.refresh();
      } else if (request.status === false) {
        toastMessage(request.message, 'error');
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
      <div className="p-4 px-[80px]">
        <div className="">
          <Breadcrumbs
            items={[
              {
                name: schoolProfile?.data?.school.school_full_name ? schoolProfile?.data?.school.school_full_name : schoolProfile?.data?.school.school_name,
                href: `/onground/roster/${schoolProfile?.data?.school.school_id}`,
              },
              {
                name: `Class ${classSection.replace('-', '')}`,
                href: '#',
                current: true,
              },
            ]}
            homeLabel="Roster"
            homeHref={`/onground/roster/${schoolProfile?.data?.school.school_id}`}
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
        <div className="mb-[33px]">
          <FilterSection searchQuery={searchQuery} onSearchChange={handleSearchChange} />
        </div>

        {/* Real-time summary counters — visible only when data is loaded */}
        {!loading && students.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-[24px]">
            {summaryStats.map(stat => (
              <div
                key={stat.label}
                className={`flex flex-col items-center justify-center rounded-lg border ${stat.borderColor} ${stat.color} py-3 px-2 text-center`}
              >
                <span className="text-2xl font-bold leading-none">{stat.count}</span>
                <span className="mt-1 text-xs font-medium leading-tight">{stat.label}</span>
                {stat.label !== 'Total Students' && students.length > 0 && (
                  <span className="mt-0.5 text-xs opacity-60">
                    / {students.length}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

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
              className="rounded-[5px] cursor-pointer bg-indigo-500 h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
export default ClassView;
