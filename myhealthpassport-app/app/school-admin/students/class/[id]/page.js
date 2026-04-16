'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import StudentCardView from '@/components/StudentCardView';
import Breadcrumbs from '@/components/Breadcrumbs';
import Header from '@/components/Header';
import SchoolClassRoomStudentsList from '@/components/SchoolClassRoomStudentsList';
import FilterSection from '@/components/FilterSection';
import PlusButton from '@/components/UI/PlusButton';
import { studentListByClassAndSection, startPDFGenerationSelected, createPDFDownloadToken } from '@/services/secureApis';
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

  // Bulk download handler for dental or vision reports
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
              if (pollData.status === true && pollData.download) { downloadUrl = pollData.download; break; }
              else if (pollData.status === 'error') { break; }
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
          link.href = directUrl; link.style.display = 'none';
          document.body.appendChild(link); link.click(); document.body.removeChild(link);
          await new Promise(r => setTimeout(r, 1200));
        } else { failed++; setBulkProgress({ current: i + 1, total: filteredStudents.length, failed }); }
      } catch { failed++; setBulkProgress({ current: i + 1, total: filteredStudents.length, failed }); }
    }
    setBulkDownloading(false);
    if (failed === 0) toastMessage(`All ${filteredStudents.length} ${label} PDFs downloaded successfully`, 'success');
    else toastMessage(`Downloaded ${filteredStudents.length - failed}/${filteredStudents.length} ${label} PDFs. ${failed} failed.`, 'warning');
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
        {/* Dental & Vision Bulk Download */}
        <div className="flex items-center gap-2 mt-3 mb-3 justify-center">
          <button
            onClick={() => handleBulkDownload(['dental'], 'Dental')}
            disabled={bulkDownloading || loading || filteredStudents.length === 0}
            title="Bulk Download Dental Reports"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#34C789] text-[#34C789] text-sm font-medium hover:bg-[#EDFDF5] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
              <path fillRule="evenodd" d="M13.75 7h-3V3.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L6.2 4.74a.75.75 0 0 0 1.1 1.02l1.95-2.1V7h-3A2.25 2.25 0 0 0 4 9.25v7.5A2.25 2.25 0 0 0 6.25 19h7.5A2.25 2.25 0 0 0 16 16.75v-7.5A2.25 2.25 0 0 0 13.75 7Zm-3 0h-1.5v5.25a.75.75 0 0 0 1.5 0V7Z" clipRule="evenodd" />
            </svg>
            Dental Download
          </button>
          <button
            onClick={() => handleBulkDownload(['eye'], 'Vision')}
            disabled={bulkDownloading || loading || filteredStudents.length === 0}
            title="Bulk Download Vision Reports"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#F59E0B] text-[#F59E0B] text-sm font-medium hover:bg-[#FFFBEB] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
              <path fillRule="evenodd" d="M13.75 7h-3V3.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L6.2 4.74a.75.75 0 0 0 1.1 1.02l1.95-2.1V7h-3A2.25 2.25 0 0 0 4 9.25v7.5A2.25 2.25 0 0 0 6.25 19h7.5A2.25 2.25 0 0 0 16 16.75v-7.5A2.25 2.25 0 0 0 13.75 7Zm-3 0h-1.5v5.25a.75.75 0 0 0 1.5 0V7Z" clipRule="evenodd" />
            </svg>
            Vision Download
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
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%` }} />
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">Please do not close this window</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClassView;
