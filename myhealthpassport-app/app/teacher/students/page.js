'use client';

import React, { useState, useEffect } from 'react';
import StudentCardView from '@/components/StudentCardView';
import Breadcrumbs from '@/components/Breadcrumbs';
import Header from '@/components/Header';
import SchoolClassRoomStudentsList from '@/components/SchoolClassRoomStudentsList';
import { getProfile, schoolDetails, studentListByClassAndSection } from '@/services/secureApis';
import { formatFullName, toastMessage } from '@/helpers/utilities';
import InlineSpinner from '@/components/UI/InlineSpinner';
import Image from 'next/image';

const Students = () => {
  const [activeTab, setActiveTab] = useState('Table-View');
  const [school_info, setSchoolProfile] = useState({});
  const [teacher_info, setTeacherProfile] = useState({});
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { name: 'Table View', href: '#', id: 'Table-View' },
    { name: 'Card View', href: '#', id: 'Card-View' },
  ];

  useEffect(() => {
    async function GetDetails() {
      try {
        const base64User = localStorage.getItem('user_info');
        if (!base64User || base64User === 'undefined') {
          toastMessage('Invalid school login found', 'error');
          return;
        }
        const user_info = JSON.parse(atob(base64User));
        const GetProfile = await getProfile();
        const GetProfileResults = JSON.parse(GetProfile);
        const fetchSchoolDetails = await schoolDetails(user_info.school_id);
        const GetSchoolDetailsResults = await JSON.parse(fetchSchoolDetails);
        if (GetSchoolDetailsResults.status === true) {
          setSchoolProfile(GetSchoolDetailsResults);
        }

        if (GetProfileResults.status === true) {
          setTeacherProfile(GetProfileResults.data);
          const fetchStudentsDetails = await studentListByClassAndSection(
            user_info.school_id,
            GetProfileResults.data.class_room,
            GetProfileResults.data.section,
            ''
          );
          const studentsResults = JSON.parse(fetchStudentsDetails);
          if (studentsResults.status === true) {
            setStudents(studentsResults.data.students_list);
          } else {
            toastMessage(studentsResults.message || 'Failed to fetch all students', 'error');
          }
        }
      } catch (err) {
        toastMessage(err || 'An error occurred while fetching data.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    GetDetails();
  }, []);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  // Handle changes in the input field
  const handleSearchChange = value => {
    setSearchQuery(value);
  };

  // Filter the student list based on the search term
  const filteredStudents = students.filter(student => {
    // Convert search term to lowercase for case-insensitive search
    const lowerCaseSearchTerm = searchQuery.toLowerCase();

    // Check if the search term is found in any of the relevant fields
    return (
      formatFullName(student).toLowerCase().includes(lowerCaseSearchTerm) ||
      student.phone.toLowerCase().includes(lowerCaseSearchTerm) ||
      student.age.toLowerCase().includes(lowerCaseSearchTerm) ||
      student.gender.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Table-View':
        return (
          <div className="bg-white rounded-lg pt-2">
            {/* <ViewAllStudents /> */}
            <SchoolClassRoomStudentsList school={school_info} students={filteredStudents} />
          </div>
        );
      case 'Card-View':
        return Object.keys(filteredStudents).length > 0 ? (
          <div className="bg-white rounded-lg grid grid-cols-4">
            {filteredStudents.map(student => (
              <StudentCardView key={student.id} student={student} />
            ))}
          </div>
        ) : (
          <div className="w-full text-center py-10 text-gray-500 text-sm/6"> No student data available </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <InlineSpinner />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="p-4 px-[80px]">
        <div className="">
          <Breadcrumbs
            items={[
              {
                name: `Class ${teacher_info?.class_room}-${teacher_info?.section}`,
                href: '#',
                current: true,
              },
            ]}
            homeLabel="My Students"
            homeHref="/teacher/students"
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
        <div className="w-full flex items-center justify-center pb-4">
          <div className="w-[60%] flex gap-[70px] items-center justify-center">
            <div className="w-full flex gap-5 items-center">
              <div className="flex flex-1 gap-[10px]">
                <div className="w-full grid grid-cols-1">
                  <input
                    id="search"
                    name="search"
                    type="search"
                    placeholder="search"
                    onChange={e => handleSearchChange(e.target.value)}
                    value={searchQuery}
                    className="w-full col-start-1 row-start-1 block rounded-[5px] p-[10px] bg-white pr-3 text-base text-gray-900 outline-1 -outline-offset-1 border-[#B5CCFF] outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:pl-9 sm:text-sm/6"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="#5389FF"
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 ml-3 size-4 self-center text-gray-400 sm:size-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              {/* <div>
                <Image src='/iconx/bars-arrow-down.svg' width={24} height={24} alt='Search' className='size-5' />
              </div> */}
              <div>
                <Image src="/iconx/filter.svg" width={24} height={24} alt="Filter" className="size-5" />
              </div>
            </div>
          </div>
        </div>
        {renderTabContent()}
      </div>
    </>
  );
};
export default Students;
