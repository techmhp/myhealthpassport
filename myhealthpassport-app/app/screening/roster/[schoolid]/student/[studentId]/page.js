'use client';

import { useState, useEffect } from 'react';
import OverallSummary from '@/components/OverallSummary';
import DetailedReports from '@/components/DetailedReports';
import YearSelect from '@/components/YearSelect';
import { schoolDetails, studentDetails } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { useParams } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProfileHeader from '@/components/Student/ProfileHeader';
import Header from '@/components/Header';
import NutritionalScreening from '@/components/ScreeningAnalyst/NutritionalScreening';
import BehaviouralScreening from '@/components/ScreeningAnalyst/BehaviouralScreening';
import Dentist from '@/components/ScreeningAnalyst/Dentist';
import Ophthalmologist from '@/components/ScreeningAnalyst/Ophthalmologist';
import PhysicalScreening from '@/components/ScreeningAnalyst/PhysicalScreening';
import ContactDetails from '@/components/ScreeningAnalyst/ContactDetails';
import ParentsResponse from '@/components/ScreeningAnalyst/ParentsResponse';
import TeachersResponse from '@/components/ScreeningAnalyst/TeachersResponse';
import LabReports from '@/components/ScreeningAnalyst/LabReports';
import Image from 'next/image';
import InlineSpinner from '@/components/UI/InlineSpinner';
// import PDFDownloadButton from '@/components/PDFDownloadButton';

// const reportOptions = [
//   { id: 'physical', label: 'Physical Screening' },
//   { id: 'eye', label: 'Vision Screening' },
//   { id: 'dental', label: 'Dental Screening' },
//   { id: 'nutrition', label: 'Nutritional Assessment Report' },
//   { id: 'emotional', label: 'Emotional & Development Assessment' },
//   { id: 'lab', label: 'Lab Reports' },
// ];

const StudentInfo = () => {
  const { schoolid, studentId } = useParams();
  const [openPrint, setOpenPrint] = useState(false);
  const [school, setSchool] = useState({});
  const [results, setResults] = useState({});
  const [student_details, setStudent_details] = useState({});
  const [specialistType, setSpecialistType] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);

  // const [selectedReports, setSelectedReports] = useState([]);

  useEffect(() => {
    const base64LoginUser = localStorage.getItem('user_info');
    const loginUser = JSON.parse(atob(base64LoginUser));
    const roleBasedActiveTab =
      loginUser.user_role === 'PSYCHOLOGIST' ? 'Behavioural-Screening' : loginUser.user_role === 'NUTRITIONIST' ? 'Nutritional-Screening' : '';
    setActiveTab(roleBasedActiveTab);
    setSpecialistType(loginUser.user_role);
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
        toastMessage(err.message, 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [schoolid, studentId]);

  // Define all tab configurations based on specialist type
  const tabConfigurations = {
    NUTRITIONIST: [
      { name: 'Nutritional & Physical Screening', id: 'Nutritional-Screening', status: student_details?.nutrition_screening_status },
      { name: "Parent's Response", id: 'Parents-Response', status: null },
      { name: "Teacher's Response", id: 'Teachers-Response', status: null },
      { name: 'Lab Reports', id: 'Lab-Reports', status: null },
    ],
    PSYCHOLOGIST: [
      { name: 'Behavioural Screening', id: 'Behavioural-Screening', status: student_details?.behavioural_screening_status },
      { name: 'Parents Response', id: 'Parents-Response', status: null },
      { name: 'Teachers Response', id: 'Teachers-Response', status: null },
    ],
    DENTIST: [],
    EYE_SPECIALIST: [],
    PHYSICAL_WELLBEING: [],
  };

  // Get the tabs based on specialist type
  const currentTabs = tabConfigurations[specialistType] || [];

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  // const handlePrintClick = () => {
  //   setOpenPrint(true);
  // };

  // const handleClosePrintModal = () => {
  //   setOpenPrint(false);
  // };

  // const handleCheckboxChange = id => {
  //   setSelectedReports(prev => {
  //     if (prev.includes(id)) {
  //       return prev.filter(item => item !== id);
  //     } else {
  //       return [...prev, id];
  //     }
  //   });
  // };

  // const handleSaveAsPDF = () => {
  //   // console.log('Saving reports as PDF:', selectedReports);
  //   setOpenPrint(false);
  // };

  // const handlePrintReport = () => {
  //   // console.log('Printing reports:', selectedReports);
  //   setOpenPrint(false);
  // };

  // Function to render status icon
  const renderStatusIcon = status => {
    if (status === true) {
      return <Image alt="Active" src="/iconx/check-circle.svg" width={20} height={20} />;
    } else if (status === false) {
      return <Image alt="Warning" src="/iconx/minus-circle.svg" width={20} height={20} />;
    } else {
      return null;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Nutritional-Screening':
        return (
          <div className="bg-white rounded-lg flex flex-col gap-6">
            <NutritionalScreening />
            <div className="border-t border-gray-200 pt-4">
              <h3 className="px-4 pb-2 font-inter font-semibold text-sm text-gray-700">Physical Screening (Smart Scale)</h3>
              <PhysicalScreening />
            </div>
          </div>
        );

      case 'Parents-Response':
        return (
          <div className="bg-white rounded-lg">
            <ParentsResponse />
          </div>
        );

      case 'Teachers-Response':
        return (
          <div className="bg-white rounded-lg">
            <TeachersResponse />
          </div>
        );

      case 'Behavioural-Screening':
        return (
          <div className="bg-white rounded-lg">
            <BehaviouralScreening />
          </div>
        );

      case 'Psychologist-Screening':
        return (
          <div className="bg-white rounded-lg">
            <BehaviouralScreening />
          </div>
        );

      case 'Lab-Reports':
        return (
          <div className="bg-white rounded-lg">
            <LabReports studentId={studentId} />
          </div>
        );

      case 'Overall-Summary':
        return (
          <div className="bg-white rounded-lg">
            <div className="lg:mx-16 bg-white rounded-lg">
              <OverallSummary />
            </div>
          </div>
        );

      case 'Detailed-Reports':
        return (
          <div className="bg-white rounded-lg">
            <div className="bg-white rounded-lg">
              <DetailedReports />
            </div>
          </div>
        );

      case 'Contact-Details':
        return (
          <div className="bg-white rounded-lg">
            <ContactDetails />
          </div>
        );

      default:
        return null;
    }
  };

  const renderNoTabContent = () => {
    switch (specialistType) {
      case 'DENTIST':
        return (
          <div className="bg-white rounded-lg">
            <Dentist />
          </div>
        );
      case 'EYE_SPECIALIST':
        return (
          <div className="bg-white rounded-lg">
            <Ophthalmologist />
          </div>
        );
      case 'PHYSICAL_WELLBEING':
        return (
          <div className="bg-white rounded-lg">
            <PhysicalScreening />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading)
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <InlineSpinner />
      </div>
    );

  return (
    <>
      <Header />
      <div className="p-4 sm:p-6 md:p-[26px] md:px-12 lg:px-18">
        <div className="px-2 sm:px-6 md:px-10 lg:px-14 grid gap-4 md:gap-8 lg:gap-13">
          <div className="flex">
            <Breadcrumbs
              items={[
                {
                  name: school?.school_full_name ? school?.school_full_name : school?.school_name,
                  href: `/screening/roster/${school.school_id}`,
                  current: false,
                },
                {
                  name: student_details?.identity_details
                    ? `Class ${student_details?.identity_details?.class_room}${student_details?.identity_details?.section}`
                    : '',
                  href: `/screening/roster/${school.school_id}/class/${student_details?.identity_details?.class_room}-${student_details?.identity_details?.section}`,
                  current: true,
                },
                {
                  name: student_details?.id ? `${student_details?.first_name} ${student_details?.last_name}` : '',
                  href: '#',
                  current: true,
                },
              ]}
              homeLabel="Roster"
              homeHref={`/screening/roster/${school.school_id}`}
            />
            <YearSelect />
          </div>
          <div className="px-0 sm:px-1">
            <ProfileHeader details={results} school={school} />
          </div>
        </div>
        <div className="flex justify-center items-center mt-4 sm:mt-[22px]">
          <div className="w-full">
            {currentTabs.length > 0 && (
              <div className="relative flex items-center justify-center mb-[30px] sm:mb-[18px]">
                {/* Centered Tabs */}
                <div className="flex space-x-1 overflow-x-auto gap-2.5 rounded-lg border border-[#ECF2FF] p-1.5">
                  {currentTabs.map(tab => (
                    <button
                      key={tab.name}
                      onClick={() => setActiveTab(tab.id)}
                      aria-current={activeTab === tab.id ? 'page' : undefined}
                      className={classNames(
                        activeTab === tab.id ? 'text-[#000000] bg-[#ECF2FF]' : 'text-gray-500 hover:text-gray-700',
                        'rounded-md flex gap-1 px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out cursor-pointer'
                      )}
                    >
                      {tab.name}
                      {renderStatusIcon(tab.status)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {renderTabContent()}
          </div>
        </div>
        {currentTabs.length === 0 && renderNoTabContent()}
        {/* Print Reports Modal */}
        {/* {openPrint && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
            <div className="flex flex-col gap-14px rounded-[10px] border border-[#B3CBFF] p-[28px] bg-white w-full max-w-sm">
              <div className="flex justify-between items-center">
                <h2 className="font-medium text-[14px] leading-[24px] text-black">Print Reports</h2>
                <div onClick={handleClosePrintModal} className="cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L4 12" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 4L12 12" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <p className="mt-2 text-[14px] leading-[24px] text-black">Select the reports you wish to print</p>

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

              <div className="mt-6 flex gap-4">
                <PDFDownloadButton
                  studentId={id}
                  selectedReports={selectedReports}
                  onDownloadEnd={() => setOpenPrint(false)}
                  className="cursor-pointer flex-1 rounded-md border border-[#5465FF] bg-white py-2 px-4 text-sm font-medium text-[#5465FF] transition-all hover:bg-opacity-10"
                >
                  Save as PDF
                </PDFDownloadButton>
                <button
                  onClick={handlePrintReport}
                  className="flex-1 rounded-md border border-transparent bg-[#5465FF] py-2 px-4 text-sm font-medium text-white"
                >
                  Print Report
                </button>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </>
  );
};

export default StudentInfo;
