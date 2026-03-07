'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProfileHeader from '@/components/Student/ProfileHeader';
import OverallSummary from '@/components/OverallSummary';
import DetailedReports from '@/components/DetailedReports';
import YearSelect from '@/components/YearSelect';
import { schoolDetails, studentDetails } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { useParams } from 'next/navigation';
import PDFDownloadButton from '@/components/PDFDownloadButton';

const tabs = [
  { name: 'Overall Summary', href: '#', id: 'summary' },
  { name: 'Detailed Reports', href: '#', id: 'detail-reports' },
];

// List of report options for the print modal
const reportOptions = [
  { id: 'physical', label: 'Physical Screening' },
  { id: 'eye', label: 'Vision Screening' },
  { id: 'dental', label: 'Dental Screening' },
  { id: 'nutrition', label: 'Nutritional Assessment Report' },
  { id: 'emotional', label: 'Emotional & Development Assessment' },
  { id: 'lab', label: 'Lab Reports' },
];

const HealthRecords = () => {
  const { schoolid, studentId } = useParams();
  const [openPrint, setOpenPrint] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [school, setSchool] = useState({});
  const [results, setResults] = useState({});
  const [student_details, setStudent_details] = useState({});

  const [selectedReports, setSelectedReports] = useState([]);

  useEffect(() => {
    schoolDetails(schoolid)
      .then(res => {
        const response = JSON.parse(res);
        if (response.status === true) {
          setSchool(response.data.school);
        }
      })
      .catch(err => {
        toastMessage(err, 'error');
      });
    studentDetails(studentId)
      .then(res => {
        const response = JSON.parse(res);
        if (response.status === true) {
          setResults(response);
          setStudent_details(response.data.student_details);
        }
      })
      .catch(err => {
        toastMessage(err, 'error');
      });
  }, [schoolid, studentId]);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const handlePrintClick = () => {
    setOpenPrint(true);
  };

  const handleClosePrintModal = () => {
    setOpenPrint(false);
  };

  const handleCheckboxChange = id => {
    setSelectedReports(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // const handleSaveAsPDF = () => {
  //   setOpenPrint(false);
  // };

  const handlePrintReport = () => {
    setOpenPrint(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <div className="lg:mx-16 bg-white rounded-lg">
            {/* <OverallSummary /> */}
            <OverallSummary />
          </div>
        );
      case 'detail-reports':
        return (
          <div className="bg-white rounded-lg">
            <DetailedReports />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className="p-4 sm:p-6 md:p-[28px] md:px-12 lg:px-18">
        <div className="px-2 sm:px-6 md:px-10 lg:px-14 grid gap-4 md:gap-8 lg:gap-13">
          {/* Breadcrumbs and Year Selector - flex-col on small screens, flex-row on larger */}
          <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <Breadcrumbs
              items={[
                {
                  name: school?.school_full_name ? school?.school_full_name : school?.school_name,
                  href: `/admin/schools/${school.school_id}`,
                  current: false,
                },
                {
                  name: student_details?.identity_details
                    ? `Class ${student_details?.identity_details?.class_room}${student_details?.identity_details?.section}`
                    : '',
                  href: `/admin/schools/${school.school_id}/class/${student_details?.identity_details?.class_room}-${student_details?.identity_details?.section}`,
                  current: true,
                },
                {
                  name: student_details?.id ? `${student_details?.first_name} ${student_details?.last_name}` : '',
                  href: '#',
                  current: true,
                },
              ]}
              homeLabel="Schools"
              homeHref={`/admin/schools`}
            />
            <YearSelect />
          </div>
          <div className="px-0 sm:px-1">
            <ProfileHeader details={results} school={school} />
          </div>
        </div>
        <div className="flex justify-center items-center mt-4 sm:mt-[22px]">
          <div className="w-full">
            <div className="relative flex items-center justify-center mb-[30px] sm:mb-[18px]">
              {/* Centered Tabs */}
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

              {/* Edit Icon - Absolutely positioned to the right */}
              <div className="lg:mx-16 absolute right-0 flex gap-5">
                <PDFDownloadButton studentId={studentId} selectedReports={selectedReports} className="cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                    <path
                      fillRule="evenodd"
                      d="M13.75 7h-3V3.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L6.2 4.74a.75.75 0 0 0 1.1 1.02l1.95-2.1V7h-3A2.25 2.25 0 0 0 4 9.25v7.5A2.25 2.25 0 0 0 6.25 19h7.5A2.25 2.25 0 0 0 16 16.75v-7.5A2.25 2.25 0 0 0 13.75 7Zm-3 0h-1.5v5.25a.75.75 0 0 0 1.5 0V7Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </PDFDownloadButton>

                <div onClick={handlePrintClick} className="cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                    <path
                      fillRule="evenodd"
                      d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0 1 18 8.653v4.097A2.25 2.25 0 0 1 15.75 15h-.241l.305 1.984A1.75 1.75 0 0 1 14.084 19H5.915a1.75 1.75 0 0 1-1.73-2.016L4.492 15H4.25A2.25 2.25 0 0 1 2 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.75-.107 1.127-.153L5 6.25v-3.5Zm8.5 3.397a41.533 41.533 0 0 0-7 0V2.75a.25.25 0 0 1 .25-.25h6.5a.25.25 0 0 1 .25.25v3.397ZM6.608 12.5a.25.25 0 0 0-.247.212l-.693 4.5a.25.25 0 0 0 .247.288h8.17a.25.25 0 0 0 .246-.288l-.692-4.5a.25.25 0 0 0-.247-.212H6.608Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
            {renderTabContent()}
          </div>
        </div>
        {/* Print Reports Modal */}
        {openPrint && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
            <div className="flex flex-col gap-14px rounded-[10px] border border-[#B3CBFF] p-[28px] bg-white w-full max-w-sm">
              {/* Modal Header */}
              <div className="flex justify-between items-center">
                <h2 className="font-medium text-[14px] leading-[24px] text-black">Print Reports</h2>
                <div onClick={handleClosePrintModal} className="cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L4 12" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 4L12 12" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Subtitle */}
              <p className="mt-2 text-[14px] leading-[24px] text-black">Select the reports you wish to print</p>

              {/* Checkboxes List */}
              <div className="mt-4 space-y-4">
                {reportOptions.map(report => (
                  <div key={report.id} className="flex items-center">
                    <input
                      id={report.id}
                      name={report.id}
                      type="checkbox"
                      className="h-4 w-4 text-[#5465FF] border-gray-300 rounded"
                      checked={selectedReports.includes(report.id)}
                      onChange={() => handleCheckboxChange(report.id)}
                    />
                    <label htmlFor={report.id} className="ml-3 text-sm text-gray-700">
                      {report.label}
                    </label>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-4">
                <PDFDownloadButton
                  studentId={studentId}
                  selectedReports={selectedReports}
                  onDownloadEnd={() => setOpenPrint(false)}
                  className="cursor-pointer flex-1 rounded-md border border-[#5465FF] bg-white py-2 px-4 text-sm font-medium text-[#5465FF] transition-all hover:bg-opacity-10"
                >
                  Save as PDF
                </PDFDownloadButton>

                <button
                  onClick={handlePrintReport}
                  className="flex-1 rounded-md border border-transparent bg-[#5465FF] py-2 px-4 text-sm font-medium text-white transition-all hover:bg-[#4356E8]"
                >
                  Print Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HealthRecords;
