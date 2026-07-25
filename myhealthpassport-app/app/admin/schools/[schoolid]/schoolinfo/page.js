'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import ViewAllTeachers from '@/components/ViewAllTeachers';
import SectionalView from '@/components/SectionalView';
import SchoolStudentsList from '@/components/SchoolStudentsList';
import PlusButton from '@/components/UI/PlusButton';
import Link from 'next/link';
import { schoolDetails } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';

const DOWNLOAD_MODULES = [
  { key: 'students-list', label: 'All Students (CSV)' },
  { key: 'nutrition-checklist', label: 'Nutrition Checklist' },
  { key: 'nutrition-analysis', label: 'Nutrition Analysis' },
  { key: 'psychology-checklist', label: 'Psychology Checklist' },
  { key: 'psychology-analysis', label: 'Psychology Analysis' },
  { key: 'smart-scale', label: 'Smart Scale' },
];

const SchoolData = () => {
  const { schoolid } = useParams();
  const [school, setSchool] = useState([]);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadingModule, setDownloadingModule] = useState(null);
  const [bulkPdf, setBulkPdf] = useState(null); // { done, total, generated, skipped }
  const bulkCancelled = useRef(false);
  const downloadMenuRef = useRef(null);

  const tabs = [
    { name: 'Sectional View', href: '#', id: 'Sectional-View' },
    { name: 'View All Students', href: '#', id: 'View-All-Students' },
    { name: 'View All Teachers', href: '#', id: 'View-All-Teachers' },
  ];

  const [activeTab, setActiveTab] = useState('Sectional-View');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const schoolResponse = await schoolDetails(schoolid);
        const schoolResults = JSON.parse(schoolResponse);
        if (schoolResults.status === true) {
          setSchool(schoolResults.data.school);
        }
      } catch (error) {
        toastMessage(error.message || 'An error occurred while fetching data', 'error');
      }
    };
    fetchData();
  }, []);

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
      const res = await fetch(`/api/export/${moduleKey}?school_id=${schoolid}`, { cache: 'no-store' });
      if (!res.ok) {
        let message = 'Failed to download';
        try {
          const err = await res.json();
          message = err?.error || message;
        } catch {}
        toastMessage(message, 'error');
        return;
      }
      const blob = await res.blob();
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

  // Whole-school PDF export: start a job, poll until the ZIP is built, download it.
  const handleBulkPdf = async () => {
    setShowDownloadMenu(false);
    bulkCancelled.current = false;
    setBulkPdf({ done: 0, total: 0 });

    try {
      const startRes = await fetch(`/api/bulk-pdf/start?school_id=${schoolid}`, { method: 'POST' });
      const start = await startRes.json();
      if (!startRes.ok || !start.job_id) {
        toastMessage(start?.error || start?.message || 'Could not start PDF export', 'error');
        setBulkPdf(null);
        return;
      }

      const jobId = start.job_id;

      // Poll every 3s. No hard timeout — a 400-student school legitimately
      // takes a while; the user can cancel from the progress dialog.
      while (!bulkCancelled.current) {
        const statusRes = await fetch(
          `/api/bulk-pdf/status?school_id=${schoolid}&job_id=${jobId}`,
          { cache: 'no-store' }
        );
        const job = await statusRes.json();

        if (job.state === 'error') {
          toastMessage(job.error || 'PDF export failed', 'error');
          setBulkPdf(null);
          return;
        }

        setBulkPdf({
          done: job.done || 0,
          total: job.total || 0,
          generated: job.generated || 0,
          skipped: job.skipped || 0,
        });

        if (job.status === true || job.state === 'ready') {
          const zipRes = await fetch(
            `/api/bulk-pdf/download?school_id=${schoolid}&job_id=${jobId}`,
            { cache: 'no-store' }
          );
          if (!zipRes.ok) {
            toastMessage('Reports were generated but the download failed', 'error');
            setBulkPdf(null);
            return;
          }
          const blob = await zipRes.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `health_reports_School${schoolid}.zip`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => window.URL.revokeObjectURL(url), 100);

          const skipped = job.skipped || 0;
          toastMessage(
            skipped > 0
              ? `Downloaded ${job.generated} reports — ${skipped} skipped (incomplete screening data)`
              : `Downloaded ${job.generated} reports`,
            'success'
          );
          setBulkPdf(null);
          return;
        }

        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (err) {
      toastMessage(err?.message || 'PDF export failed', 'error');
    } finally {
      if (!bulkCancelled.current) setBulkPdf(null);
    }
  };

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

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
      case 'View-All-Teachers':
        return (
          <div className="bg-white rounded-lg">
            <ViewAllTeachers />
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
                href: `/admin/schools/${schoolid}`,
              },
            ]}
            homeLabel="Schools"
            homeHref="/admin/schools"
          />
        </div>
        <div className="flex items-center justify-between mt-[17px] mb-[27px]">
          <div className="flex-1 flex items-center justify-center">
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
          <div className="relative" ref={downloadMenuRef}>
            <button
              onClick={() => setShowDownloadMenu(v => !v)}
              disabled={!!downloadingModule}
              className="flex items-center gap-2 px-4 py-2 bg-[#005BFE] text-white text-sm font-semibold rounded-lg hover:bg-[#0042B8] transition-colors disabled:opacity-60"
            >
              {downloadingModule ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
              )}
              {downloadingModule ? 'Downloading…' : 'Download'}
            </button>
            {showDownloadMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-[#ECF2FF] rounded-lg shadow-lg z-50">
                {DOWNLOAD_MODULES.map(m => (
                  <button
                    key={m.key}
                    onClick={() => handleDownload(m.key)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F4F8FF] hover:text-[#005BFE] transition-colors first:rounded-t-lg"
                  >
                    {m.label}
                  </button>
                ))}
                <div className="border-t border-[#ECF2FF]" />
                <button
                  onClick={handleBulkPdf}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F4F8FF] hover:text-[#005BFE] transition-colors rounded-b-lg"
                >
                  All Health Reports (PDF)
                  <span className="block text-[11px] text-gray-400 leading-tight mt-0.5">
                    ZIP of one PDF per student
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
        {renderTabContent()}
      </div>

      {bulkPdf && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BFE] mb-5" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Generating health reports</h3>
              <p className="text-sm text-gray-600 text-center">
                {bulkPdf.total > 0
                  ? `${bulkPdf.done} of ${bulkPdf.total} students processed`
                  : 'Preparing student list…'}
              </p>
              {bulkPdf.total > 0 && (
                <div className="w-full bg-[#ECF2FF] rounded-full h-2 mt-4">
                  <div
                    className="bg-[#005BFE] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((bulkPdf.done / bulkPdf.total) * 100)}%` }}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 text-center mt-5">
                A large school can take several minutes. The download starts automatically when it&rsquo;s ready.
              </p>
              <button
                onClick={() => {
                  bulkCancelled.current = true;
                  setBulkPdf(null);
                  toastMessage('Stopped waiting — generation continues in the background', 'info');
                }}
                className="mt-5 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Close and keep working
              </button>
            </div>
          </div>
        </div>
      )}

      <Link href={`/admin/schools/${schoolid}/student/add`}>
        <PlusButton />
      </Link>
    </>
  );
};

export default SchoolData;
