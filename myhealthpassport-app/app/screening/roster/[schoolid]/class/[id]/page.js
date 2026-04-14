'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import StudentCardView from '@/components/StudentCardView';
import Breadcrumbs from '@/components/Breadcrumbs';
import Header from '@/components/Header';
import SchoolClassRoomStudentsList from '@/components/SchoolClassRoomStudentsList';
import {
  schoolDetails,
  studentListByClassAndSection,
  exportNutritionChecklist,
  exportNutritionAnalysis,
  exportPsychologyAnalysis,
  exportPsychologyChecklist,
  exportSmartScale,
} from '@/services/secureApis';
import { formatFullName, toastMessage } from '@/helpers/utilities';
import InlineSpinner from '@/components/UI/InlineSpinner';
import FilterSection from '@/components/FilterSection';

const EXPORT_MODULES = [
  { key: 'nutrition-checklist', label: 'Nutrition Checklist' },
  { key: 'nutrition-analysis', label: 'Nutrition Analysis' },
  { key: 'psychology-checklist', label: 'Psychology Checklist' },
  { key: 'psychology-analysis', label: 'Psychology Analysis' },
  { key: 'smart-scale', label: 'Smart Scale Report' },
];


const ClassView = () => {
  const { schoolid, id } = useParams();
  const classSection = decodeURI(id);
  const [activeTab, setActiveTab] = useState('Table-View');
  const [schoolProfile, setSchoolProfile] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [hideAbsent, setHideAbsent] = useState(false);
  // Download dropdown state
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadingModule, setDownloadingModule] = useState(null);
  const downloadMenuRef = useRef(null);

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
      // console.log(err);
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
      const dashIdx = classSection.indexOf('-'); const classRoom = dashIdx >= 0 ? classSection.slice(0, dashIdx) : classSection; const section = dashIdx >= 0 ? classSection.slice(dashIdx + 1) : '';
      let res;
      if (moduleKey === 'nutrition-checklist') res = await exportNutritionChecklist(schoolid, classRoom, section);
      else if (moduleKey === 'nutrition-analysis') res = await exportNutritionAnalysis(schoolid, classRoom, section);
      else if (moduleKey === 'psychology-checklist') res = await exportPsychologyChecklist(schoolid, classRoom, section);
      else if (moduleKey === 'psychology-analysis') res = await exportPsychologyAnalysis(schoolid, classRoom, section);
      else if (moduleKey === 'smart-scale') res = await exportSmartScale(schoolid, classRoom, section);

      if (res?.error) {
        toastMessage(res.message || 'Failed to download', 'error');
        return;
      }

      // Create CSV blob and trigger download
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const label = classSection.replace('-', '');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${moduleKey}_Class${label}.csv`;
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

  // Handle search input change
  const handleSearchChange = value => {
    setSearchQuery(value);
  };

  // Filter the student list based on search, date, and absentee status
  const filteredStudents = students.filter(student => {
    const lowerCaseSearchTerm = searchQuery.toLowerCase();
    const matchesSearch =
      student.roll_no.toLowerCase().includes(lowerCaseSearchTerm) ||
      formatFullName(student).toLowerCase().includes(lowerCaseSearchTerm) ||
      student.gender.toLowerCase().includes(lowerCaseSearchTerm) ||
      student.age.toLowerCase().includes(lowerCaseSearchTerm);

    // Absentee filter: hide students with registration_status === false
    const matchesAbsent = hideAbsent ? student.registration_status !== false : true;

    // Date filter: if filterDate set, match student screening date
    // If student has no date field, don't hide them (show by default)
    const studentDate = student.screening_date || student.registered_date || student.created_at;
    const matchesDate = filterDate ? (studentDate ? studentDate.startsWith(filterDate) : true) : true;

    return matchesSearch && matchesAbsent && matchesDate;
  });

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className='w-full py-8'>
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
            <SchoolClassRoomStudentsList
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
                href: `/screening/roster/${schoolProfile?.data?.school.school_id}`,
              },
              {
                name: `Class ${classSection.replace('-', '')}`,
                href: '#',
                current: true,
              },
            ]}
            homeLabel="Roster"
            homeHref="/screening/roster"
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
        <div className="mb-[33px] flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <FilterSection searchQuery={searchQuery} onSearchChange={handleSearchChange} />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Filter by Date:</label>
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 whitespace-nowrap">
              <input
                type="checkbox"
                checked={hideAbsent}
                onChange={e => setHideAbsent(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              Hide absent students
            </label>
          </div>
        </div>
        {renderTabContent()}
      </div>
    </>
  );
};
export default ClassView;
