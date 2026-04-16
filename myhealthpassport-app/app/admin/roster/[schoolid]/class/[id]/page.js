'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import StudentCardView from '@/components/StudentCardView';
import Breadcrumbs from '@/components/Breadcrumbs';
import Header from '@/components/Header';
import DynamicStudentTable from '@/components/SchoolStudentsList';
import {
  schoolDetails,
  studentList,
  exportNutritionChecklist,
  exportNutritionAnalysis,
  exportPsychologyAnalysis,
  exportPsychologyChecklist,
  exportSmartScale,
  startPDFGenerationSelected,
  createPDFDownloadToken,
} from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import PlusButton from '@/components/UI/PlusButton';
import Link from 'next/link';

const EXPORT_MODULES = [
  { key: 'nutrition-checklist', label: 'Nutrition Checklist' },
  { key: 'nutrition-analysis', label: 'Nutrition Analysis' },
  { key: 'psychology-checklist', label: 'Psychology Checklist' },
  { key: 'psychology-analysis', label: 'Psychology Analysis' },
  { key: 'smart-scale', label: 'Smart Scale Report' },
];

const ClassView = () => {
  const { schoolid, id } = useParams();
  const section = decodeURI(id);
  const [activeTab, setActiveTab] = useState('Table-View');
  const [schoolProfile, setSchoolProfile] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadingModule, setDownloadingModule] = useState(null);
  const downloadMenuRef = useRef(null);
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

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = e => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async moduleKey => {
    setShowDownloadMenu(false);
    setDownloadingModule(moduleKey);
    try {
      // Admin class page uses combined format (e.g. "9A"), need to split
      const classMatch = section.match(/^(\d+)([A-Z])$/);
      const classRoom = classMatch ? classMatch[1] : section;
      const sectionLetter = classMatch ? classMatch[2] : '';
      let res;
      if (moduleKey === 'nutrition-checklist') res = await exportNutritionChecklist(schoolid, classRoom, sectionLetter);
      else if (moduleKey === 'nutrition-analysis') res = await exportNutritionAnalysis(schoolid, classRoom, sectionLetter);
      else if (moduleKey === 'psychology-checklist') res = await exportPsychologyChecklist(schoolid, classRoom, sectionLetter);
      else if (moduleKey === 'psychology-analysis') res = await exportPsychologyAnalysis(schoolid, classRoom, sectionLetter);
      else if (moduleKey === 'smart-scale') res = await exportSmartScale(schoolid, classRoom, sectionLetter);

      if (res?.error) {
        toastMessage(res.message || 'Failed to download', 'error');
        return;
      }
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${moduleKey}_Class${section}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (err) {
      toastMessage(err?.message || 'Failed to download', 'error');
    } finally {
      setDownloadingModule(null);
    }
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
        <div className="flex items-center justify-between mt-[17px] mb-[27px]">
          {/* View tabs */}
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

          {/* Download dropdown */}
          <div className="relative" ref={downloadMenuRef}>
            <button
              onClick={() => setShowDownloadMenu(prev => !prev)}
              disabled={!!downloadingModule}
              className="flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60 transition-colors"
            >
              {downloadingModule ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Downloading…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v12m0 0l-4-4m4 4l4-4"/>
                  </svg>
                  Download Data
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </>
              )}
            </button>

            {showDownloadMenu && (
              <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {EXPORT_MODULES.map(mod => (
                  <button
                    key={mod.key}
                    onClick={() => handleDownload(mod.key)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
                  >
                    {mod.label}
                  </button>
                ))}
              </div>
            )}
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
