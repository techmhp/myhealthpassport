'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import StudentCardView from '@/components/StudentCardView';
import Breadcrumbs from '@/components/Breadcrumbs';
import Header from '@/components/Header';
import SchoolClassRoomStudentsList from '@/components/SchoolClassRoomStudentsList';
import {
  schoolDetails,
  studentListByClassAndSection,
  startPDFGenerationSelected,
  createPDFDownloadToken,
  exportDentalScreening,
  exportVisionScreening,
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
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, failed: 0 });
  const [bulkDownloadLabel, setBulkDownloadLabel] = useState('All Reports');

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

  // Generic bulk download handler for All Reports (individual PDFs)
  const handleBulkDownload = async (reports = ['dental', 'eye', 'physical', 'emotional', 'nutrition', 'lab'], label = 'All Reports') => {
    if (bulkDownloading || filteredStudents.length === 0) return;
    setBulkDownloading(true);
    setBulkDownloadLabel(label);
    setBulkProgress({ current: 0, total: filteredStudents.length, failed: 0 });

    const reportData = JSON.stringify({ reports });
    const academicYear = null;

    let failed = 0;
    for (let i = 0; i < filteredStudents.length; i++) {
      const student = filteredStudents[i];
      setBulkProgress({ current: i + 1, total: filteredStudents.length, failed });
      try {
        const downloadData = await startPDFGenerationSelected(parseInt(student.id), reportData, academicYear);
        let downloadUrl = null;

        if (downloadData.status === true && downloadData.download) {
          downloadUrl = downloadData.download;
        } else if (downloadData.status === false && downloadData.check_status) {
          const key = new URL(downloadData.check_status).searchParams.get('key');
          for (let attempt = 0; attempt < 6; attempt++) {
            await new Promise(r => setTimeout(r, 5000));
            try {
              const { downloadPDFSelected } = await import('@/services/secureApis');
              const pollResp = await downloadPDFSelected(parseInt(student.id), key, academicYear);
              const pollData = JSON.parse(pollResp);
              if (pollData.status === true && pollData.download) {
                downloadUrl = pollData.download;
                break;
              } else if (pollData.status === 'error') {
                break;
              }
            } catch { break; }
          }
        }

        if (downloadUrl) {
          const urlObj = new URL(downloadUrl);
          const key = urlObj.searchParams.get('key');
          const acYear = urlObj.searchParams.get('academic_year');
          const token = await createPDFDownloadToken(student.id, key, acYear);
          const baseApiUrl = process.env.NEXT_PUBLIC_API_URL;
          const params = new URLSearchParams({ key, academic_year: acYear || '', direct: 'true', download_token: token });
          const directUrl = `${baseApiUrl}/report/${student.id}/download-selected?${params.toString()}`;
          const link = document.createElement('a');
          link.href = directUrl;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          await new Promise(r => setTimeout(r, 1200));
        } else {
          failed++;
          setBulkProgress({ current: i + 1, total: filteredStudents.length, failed });
        }
      } catch {
        failed++;
        setBulkProgress({ current: i + 1, total: filteredStudents.length, failed });
      }
    }

    setBulkDownloading(false);
    if (failed === 0) {
      toastMessage(`All ${filteredStudents.length} ${label} PDFs downloaded successfully`, 'success');
    } else {
      toastMessage(`Downloaded ${filteredStudents.length - failed}/${filteredStudents.length} ${label} PDFs. ${failed} failed.`, 'warning');
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
            {/* All Reports Bulk Download (individual PDFs) */}
            <button
              onClick={() => handleBulkDownload(['dental', 'eye', 'physical', 'emotional', 'nutrition', 'lab'], 'All Reports')}
              disabled={bulkDownloading || downloadingModule !== null || loading || filteredStudents.length === 0}
              title="Bulk Download All Reports for all students"
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#5389FF] text-[#5389FF] text-sm font-medium hover:bg-[#ECF2FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M13.75 7h-3V3.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L6.2 4.74a.75.75 0 0 0 1.1 1.02l1.95-2.1V7h-3A2.25 2.25 0 0 0 4 9.25v7.5A2.25 2.25 0 0 0 6.25 19h7.5A2.25 2.25 0 0 0 16 16.75v-7.5A2.25 2.25 0 0 0 13.75 7Zm-3 0h-1.5v5.25a.75.75 0 0 0 1.5 0V7Z" clipRule="evenodd" />
              </svg>
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

      {/* Bulk Download Progress Modal */}
      {bulkDownloading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="mb-5">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Bulk Downloading — {bulkDownloadLabel}</h3>
              <p className="text-sm text-gray-600 text-center mb-3">
                Processing student {bulkProgress.current} of {bulkProgress.total}
                {bulkProgress.failed > 0 && ` (${bulkProgress.failed} skipped)`}
              </p>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">Please don&apos;t close this window</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default ClassView;
