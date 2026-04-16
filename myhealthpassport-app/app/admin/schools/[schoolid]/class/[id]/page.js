'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import StudentCardView from '@/components/StudentCardView';
import Breadcrumbs from '@/components/Breadcrumbs';
import Header from '@/components/Header';
import SchoolClassRoomStudentsList from '@/components/SchoolClassRoomStudentsList';
import {
  schoolDetails,
  studentListByClassAndSection,
  exportDentalScreening,
  exportVisionScreening,
  exportAllReportsExcel,
} from '@/services/secureApis';
import { formatFullName, toastMessage } from '@/helpers/utilities';
import PlusButton from '@/components/UI/PlusButton';
import Link from 'next/link';
import InlineSpinner from '@/components/UI/InlineSpinner';
import FilterSection from '@/components/FilterSection';


const ClassView = () => {
  const { schoolid, id } = useParams();
  const classSection = decodeURI(id);
  const [activeTab, setActiveTab] = useState('Table-View');
  const [schoolProfile, setSchoolProfile] = useState([]);
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

  // Parse class and section from URL param (e.g. "7-SEC A" → classRoom="7", section="SEC A")
  const dashIdx = classSection.indexOf('-');
  const classRoom = dashIdx >= 0 ? classSection.slice(0, dashIdx) : classSection;
  const section = dashIdx >= 0 ? classSection.slice(dashIdx + 1) : '';

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

  // Export a single CSV file for the entire class section (Dental or Vision)
  const handleExportCsv = async (type) => {
    if (downloadingModule) return;
    setDownloadingModule(type);
    try {
      let res;
      if (type === 'dental') {
        res = await exportDentalScreening(schoolid, classRoom, section);
      } else if (type === 'vision') {
        res = await exportVisionScreening(schoolid, classRoom, section);
      }
      if (res?.error) {
        toastMessage(res.message || 'Failed to download', 'error');
        return;
      }
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const label = type === 'dental' ? 'Dental' : 'Vision';
      a.download = `${label}-Screening_${classSection}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      toastMessage(`${label} screening data downloaded successfully`, 'success');
    } catch (err) {
      toastMessage(err?.message || 'Failed to download', 'error');
    } finally {
      setDownloadingModule(null);
    }
  };

  // Download all reports as a single multi-sheet Excel (.xlsx) file
  const handleBulkDownload = async () => {
    if (downloadingModule || filteredStudents.length === 0) return;
    setDownloadingModule('bulk');
    try {
      const res = await exportAllReportsExcel(schoolid, classRoom, section);
      if (res?.error) {
        toastMessage(res.message || 'Failed to download', 'error');
        return;
      }
      // GetCallBinary returns base64 — decode to binary blob
      const binary = atob(res.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `All-Reports_${classSection}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      toastMessage('All reports downloaded as Excel successfully', 'success');
    } catch (err) {
      toastMessage(err?.message || 'Failed to download', 'error');
    } finally {
      setDownloadingModule(null);
    }
  };

  // Filter the student list based on the search term
  const filteredStudents = students.filter(student => {
    const lowerCaseSearchTerm = searchQuery.toLowerCase();
    return (
      student.roll_no.toLowerCase().includes(lowerCaseSearchTerm) ||
      formatFullName(student).toLowerCase().includes(lowerCaseSearchTerm) ||
      student.gender.toLowerCase().includes(lowerCaseSearchTerm) ||
      student.age.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="w-full py-8">
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
            < SchoolClassRoomStudentsList
              school={schoolProfile?.data?.school}
              students={filteredStudents}
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
                name: schoolProfile?.data?.school.school_full_name ? schoolProfile?.data?.school.school_full_name : schoolProfile?.data?.school.school_name,
                href: `/admin/schools/${schoolProfile?.data?.school.school_id}`,
              },
              {
                name: `Class ${classSection.replace('-', '')}`,
                href: '#',
                current: true,
              },
            ]}
            homeLabel="Schools"
            homeHref="/admin/schools"
          />
        </div>
        <div className="relative flex items-center justify-center mt-[17px] mb-[27px]">
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
          {/* Export / Download Buttons — top right */}
          <div className="absolute right-0 flex items-center gap-2">
            {/* Dental CSV Export */}
            <button
              onClick={() => handleExportCsv('dental')}
              disabled={downloadingModule !== null || loading || filteredStudents.length === 0}
              title="Download Dental Screening data as CSV for all students"
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#34C789] text-[#34C789] text-sm font-medium hover:bg-[#EDFDF5] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {downloadingModule === 'dental' ? (
                <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                  <path fillRule="evenodd" d="M13.75 7h-3V3.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L6.2 4.74a.75.75 0 0 0 1.1 1.02l1.95-2.1V7h-3A2.25 2.25 0 0 0 4 9.25v7.5A2.25 2.25 0 0 0 6.25 19h7.5A2.25 2.25 0 0 0 16 16.75v-7.5A2.25 2.25 0 0 0 13.75 7Zm-3 0h-1.5v5.25a.75.75 0 0 0 1.5 0V7Z" clipRule="evenodd" />
                </svg>
              )}
              Dental
            </button>
            {/* Vision CSV Export */}
            <button
              onClick={() => handleExportCsv('vision')}
              disabled={downloadingModule !== null || loading || filteredStudents.length === 0}
              title="Download Vision Screening data as CSV for all students"
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#F59E0B] text-[#F59E0B] text-sm font-medium hover:bg-[#FFFBEB] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {downloadingModule === 'vision' ? (
                <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                  <path fillRule="evenodd" d="M13.75 7h-3V3.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L6.2 4.74a.75.75 0 0 0 1.1 1.02l1.95-2.1V7h-3A2.25 2.25 0 0 0 4 9.25v7.5A2.25 2.25 0 0 0 6.25 19h7.5A2.25 2.25 0 0 0 16 16.75v-7.5A2.25 2.25 0 0 0 13.75 7Zm-3 0h-1.5v5.25a.75.75 0 0 0 1.5 0V7Z" clipRule="evenodd" />
                </svg>
              )}
              Vision
            </button>
            {/* All Reports — Excel Download */}
            <button
              onClick={handleBulkDownload}
              disabled={downloadingModule !== null || loading || filteredStudents.length === 0}
              title="Download All Reports as Excel (.xlsx) for all students"
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#5389FF] text-[#5389FF] text-sm font-medium hover:bg-[#ECF2FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {downloadingModule === 'bulk' ? (
                <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                  <path fillRule="evenodd" d="M13.75 7h-3V3.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L6.2 4.74a.75.75 0 0 0 1.1 1.02l1.95-2.1V7h-3A2.25 2.25 0 0 0 4 9.25v7.5A2.25 2.25 0 0 0 6.25 19h7.5A2.25 2.25 0 0 0 16 16.75v-7.5A2.25 2.25 0 0 0 13.75 7Zm-3 0h-1.5v5.25a.75.75 0 0 0 1.5 0V7Z" clipRule="evenodd" />
                </svg>
              )}
              Bulk Download
            </button>
          </div>
        </div>
        <div className="mb-[33px]">
          <FilterSection searchQuery={searchQuery} onSearchChange={handleSearchChange} />
        </div>
        {renderTabContent()}
      </div>
      <Link href={`/admin/schools/${schoolid}/student/add`}>
        <PlusButton />
      </Link>

    </>
  );
};
export default ClassView;
