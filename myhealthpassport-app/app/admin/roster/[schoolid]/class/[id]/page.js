'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import StudentCardView from '@/components/StudentCardView';
import Breadcrumbs from '@/components/Breadcrumbs';
import Header from '@/components/Header';
import DynamicStudentTable from '@/components/SchoolStudentsList';
import { schoolDetails, studentList } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import PlusButton from '@/components/UI/PlusButton';
import Link from 'next/link';

const ClassView = () => {
  const { schoolid, id } = useParams();
  const section = decodeURI(id);
  const [activeTab, setActiveTab] = useState('Table-View');
  const [schoolProfile, setSchoolProfile] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const fetchStudentsData = async id => {
    try {
      setLoading(true);
      setError(null);

      // Fetch All Students List
      const allStudentsResponse = await studentList(schoolid);

      const allStudentsResults = JSON.parse(allStudentsResponse);

      if (allStudentsResults.status === true) {
        const allStudents = allStudentsResults.data.students_list;

        // Filter students based on section from URL
        if (section) {
          // Extract class and section from URL param (e.g., "10A" -> class: "10", section: "A")
          const classMatch = section.match(/^(\d+)([A-Z])$/);
          if (classMatch) {
            const [, classRoom, sectionLetter] = classMatch;
            const sectionStudents = allStudents.filter(student => student.class_room === classRoom && student.section === sectionLetter);
            setFilteredStudents(sectionStudents);
          } else {
            // Fallback: try direct section match
            const sectionStudents = allStudents.filter(student => `${student.class_room}${student.section}` === section);
            setFilteredStudents(sectionStudents);
          }
        } else {
          setFilteredStudents(allStudents);
        }
      } else {
        setError('Failed to fetch students: ' + allStudentsResults.message);
        // console.error('Failed to fetch all students:', allStudentsResults.message);
      }
    } catch (error) {
      setError('Error fetching students data');
      // console.error('Error in API calls:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolDetails();
    fetchStudentsData();
  }, []);

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-gray-500">Loading students...</div>
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
            <DynamicStudentTable
              studentsData={filteredStudents}
              userRole="admin"
              // onStudentClick={onStudentClick}
            />
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

  return (
    <>
      <Header />
      <div className="p-4 px-[80px]">
        <div className="">
          <Breadcrumbs
            items={[
              {
                name: schoolProfile?.data?.school.school_name,
                href: `/admin/schools/${schoolProfile?.data?.school.school_id}`,
              },
              {
                name: `Class ${section}`,
                href: '#',
                current: true,
              },
            ]}
            homeLabel="Roster"
            homeHref="/admin/roster"
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
          <div className="w-[80%] flex gap-[70px] items-center justify-center">
            <div className="">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                <path
                  fillRule="evenodd"
                  d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="w-full flex gap-5 items-center">
              <div className="flex flex-1 gap-[10px]">
                <div className="w-full grid grid-cols-1">
                  <input
                    id="search"
                    name="search"
                    type="search"
                    placeholder="search"
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
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#5389FF" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25" />
                </svg>
              </div>
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#5389FF" className="size-6">
                  <path d="M6 12a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 1 1 1.5 0v7.5A.75.75 0 0 1 6 12ZM18 12a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 1.5 0v7.5A.75.75 0 0 1 18 12ZM6.75 20.25v-1.5a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0ZM18.75 18.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 1.5 0ZM12.75 5.25v-1.5a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0ZM12 21a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 1.5 0v7.5A.75.75 0 0 1 12 21ZM3.75 15a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0ZM12 11.25a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5ZM15.75 15a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {renderTabContent()}
      </div>
      <Link href={`/admin/roster/${id}/student/add`}>
        <PlusButton />
      </Link>
    </>
  );
};
export default ClassView;
