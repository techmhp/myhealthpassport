'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import StudentCardView from '@/components/StudentCardView';
import Breadcrumbs from '@/components/Breadcrumbs';
import Header from '@/components/Header';
import SchoolClassRoomStudentsList from '@/components/SchoolClassRoomStudentsList';
import FilterSection from '@/components/FilterSection';
import PlusButton from '@/components/UI/PlusButton';
import { studentListByClassAndSection, exportDentalScreening, exportVisionScreening } from '@/services/secureApis';
import InlineSpinner from '@/components/UI/InlineSpinner';
import Link from 'next/link';
import { formatFullName, toastMessage } from '@/helpers/utilities';

const ClassView = () => {
  const { id } = useParams();
  const classSection = decodeURI(id);
  const [activeTab, setActiveTab] = useState('Table-View');
  const [school, setSchool] = useState({});
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingModule, setDownloadingModule] = useState(null);

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

  // Export a single CSV file for the entire class section (Dental or Vision)
  const handleExportCsv = async (type) => {
    if (downloadingModule) return;
    setDownloadingModule(type);
    try {
      const base64_user = localStorage.getItem('user_info');
      const userJson = JSON.parse(atob(base64_user));
      const dashIdx = classSection.indexOf('-');
      const classRoom = dashIdx >= 0 ? classSection.slice(0, dashIdx) : classSection;
      const section = dashIdx >= 0 ? classSection.slice(dashIdx + 1) : '';
      let res;
      if (type === 'dental') res = await exportDentalScreening(userJson.school_id, classRoom, section);
      else if (type === 'vision') res = await exportVisionScreening(userJson.school_id, classRoom, section);
      if (res?.error) { toastMessage(res.message || 'Failed to download', 'error'); return; }
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type === 'dental' ? 'Dental' : 'Vision'}-Screening_${classSection}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      toastMessage(`${type === 'dental' ? 'Dental' : 'Vision'} screening data downloaded successfully`, 'success');
    } catch (err) {
      toastMessage(err?.message || 'Failed to download', 'error');
    } finally {
      setDownloadingModule(null);
    }
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
        {/* Dental & Vision CSV Export */}
        <div className="flex items-center gap-2 mt-3 mb-3 justify-center">
          <button
            onClick={() => handleExportCsv('dental')}
            disabled={downloadingModule !== null || loading || filteredStudents.length === 0}
            title="Download Dental Screening data as CSV for all students"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#34C789] text-[#34C789] text-sm font-medium hover:bg-[#EDFDF5] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {downloadingModule === 'dental' ? (
              <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4"><path fillRule="evenodd" d="M13.75 7h-3V3.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L6.2 4.74a.75.75 0 0 0 1.1 1.02l1.95-2.1V7h-3A2.25 2.25 0 0 0 4 9.25v7.5A2.25 2.25 0 0 0 6.25 19h7.5A2.25 2.25 0 0 0 16 16.75v-7.5A2.25 2.25 0 0 0 13.75 7Zm-3 0h-1.5v5.25a.75.75 0 0 0 1.5 0V7Z" clipRule="evenodd" /></svg>
            )}
            Dental
          </button>
          <button
            onClick={() => handleExportCsv('vision')}
            disabled={downloadingModule !== null || loading || filteredStudents.length === 0}
            title="Download Vision Screening data as CSV for all students"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#F59E0B] text-[#F59E0B] text-sm font-medium hover:bg-[#FFFBEB] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {downloadingModule === 'vision' ? (
              <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4"><path fillRule="evenodd" d="M13.75 7h-3V3.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L6.2 4.74a.75.75 0 0 0 1.1 1.02l1.95-2.1V7h-3A2.25 2.25 0 0 0 4 9.25v7.5A2.25 2.25 0 0 0 6.25 19h7.5A2.25 2.25 0 0 0 16 16.75v-7.5A2.25 2.25 0 0 0 13.75 7Zm-3 0h-1.5v5.25a.75.75 0 0 0 1.5 0V7Z" clipRule="evenodd" /></svg>
            )}
            Vision
          </button>
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
