'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import StudentCardView from '@/components/StudentCardView';
import Breadcrumbs from '@/components/Breadcrumbs';
import Header from '@/components/Header';
import SchoolClassRoomStudentsList from '@/components/SchoolClassRoomStudentsList';
import FilterSection from '@/components/FilterSection';
import PlusButton from '@/components/UI/PlusButton';
import { studentListByClassAndSection } from '@/services/secureApis';
import InlineSpinner from '@/components/UI/InlineSpinner';
import Link from 'next/link';
import { formatFullName } from '@/helpers/utilities';

const ClassView = () => {
  const { id } = useParams();
  const classSection = decodeURI(id);
  const [activeTab, setActiveTab] = useState('Table-View');
  const [school, setSchool] = useState({});
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { name: 'Table View', href: '#', id: 'Table-View' },
    { name: 'Card View', href: '#', id: 'Card-View' },
  ];

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const fetchStudentsData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!classSection) {
        setError('Invalid class found in URL parameter');
        return;
      }
      const dashIdx = classSection.indexOf('-'); const classRoom = dashIdx >= 0 ? classSection.slice(0, dashIdx) : classSection; const section = dashIdx >= 0 ? classSection.slice(dashIdx + 1) : '';
      const base64_user = localStorage.getItem('user_info');
      const userJson = JSON.parse(atob(base64_user));
      setSchool(userJson);
      const allStudentsResponse = await studentListByClassAndSection(userJson.school_id, classRoom, section, searchQuery);
      const allStudentsResults = JSON.parse(allStudentsResponse);
      if (allStudentsResults.status === true) {
        const allStudents = allStudentsResults.data.students_list;
        console.log('allStudents', allStudents);
        setStudents(allStudents);
      } else {
        setError('Failed to fetch students: ' + allStudentsResults.message);
      }
    } catch (error) {
      setError('Error fetching students data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
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
    return student.roll_no.toLowerCase().includes(lowerCaseSearchTerm) || formatFullName(student).toLowerCase().includes(lowerCaseSearchTerm);
  });

  const renderTabContent = () => {
    if (loading) {
      return <InlineSpinner />;
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
          <div className="text-gray-500">{searchQuery ? `No students found matching "${searchQuery}"` : 'No students found for this section.'}</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'Table-View':
        return (
          <div className="bg-white rounded-lg pt-2">
            {Object.keys(filteredStudents).length > 0 ? <SchoolClassRoomStudentsList school={school} students={filteredStudents} /> : <InlineSpinner />}
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
                name: `Class ${classSection.replace('-', '')}`,
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
        <div className="mb-[33px]">
          <FilterSection searchQuery={searchQuery} onSearchChange={handleSearchChange} />
        </div>
        {renderTabContent()}
      </div>
      <Link href={'/school-admin/students/add'}>
        <PlusButton />
      </Link>
    </>
  );
};

export default ClassView;
