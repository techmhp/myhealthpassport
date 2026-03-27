'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchoolStudentsList from '@/components/SchoolStudentsList';
import SectionalView from '@/components/SectionalView';
import {
  schoolDetails,
  studentList,
  exportNutritionChecklist,
  exportNutritionAnalysis,
  exportPsychologyAnalysis,
  exportPsychologyChecklist,
  exportSmartScale,
} from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';

const EXPORT_MODULES = [
  { key: 'nutrition-checklist', label: 'Nutrition Checklist' },
  { key: 'nutrition-analysis', label: 'Nutrition Analysis' },
  { key: 'psychology-checklist', label: 'Psychology Checklist' },
  { key: 'psychology-analysis', label: 'Psychology Analysis' },
  { key: 'smart-scale', label: 'Smart Scale Report' },
];


const Students = () => {

  const { schoolid } = useParams();
  const [school, setSchool] = useState([]);
  const [activeTab, setActiveTab] = useState('Sectional-View');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadingModule, setDownloadingModule] = useState(null);
  const downloadMenuRef = useRef(null);

  const tabs = [
    { name: 'Sectional View', href: '#', id: 'Sectional-View' },
    { name: 'View All Students', href: '#', id: 'View-All-Students' },
  ];

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch School
        const schoolResponse = await schoolDetails(schoolid);
        const schoolResults = JSON.parse(schoolResponse);
        if (schoolResults.status === true) {
          setSchool(schoolResults.data.school);
        }
      } catch (err) {
        // console.log(err)
        toastMessage(err.message || 'An error occurred while fetching data', 'error');
      }
    };
    fetchData();
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
      let res;
      // school-level download: no class/section filter
      if (moduleKey === 'nutrition-checklist') res = await exportNutritionChecklist(schoolid, null, null);
      else if (moduleKey === 'nutrition-analysis') res = await exportNutritionAnalysis(schoolid, null, null);
      else if (moduleKey === 'psychology-checklist') res = await exportPsychologyChecklist(schoolid, null, null);
      else if (moduleKey === 'psychology-analysis') res = await exportPsychologyAnalysis(schoolid, null, null);
      else if (moduleKey === 'smart-scale') res = await exportSmartScale(schoolid, null, null);

      if (res?.error) {
        toastMessage(res.message || 'Failed to download', 'error');
        return;
      }
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${moduleKey}_School${schoolid}.csv`;
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Sectional-View':
        return (
          <div className="bg-white rounded-lg">
            <SectionalView school={school} />
          </div>
        );
      case 'View-All-Students':
        return (
          <div className="bg-white rounded-lg">
            <SchoolStudentsList school={school} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className="p-6.5 px-[146px]">
        <div className="">
          <Breadcrumbs
            items={[
              {
                name: school?.school_full_name ? school?.school_full_name : school?.school_name,
                href: `/analyst/roster/${schoolid}`
              }
            ]}
            homeLabel="Roster"
            homeHref="/analyst/roster"
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
        {renderTabContent()}
      </div>
    </>
  );
};

export default Students;
