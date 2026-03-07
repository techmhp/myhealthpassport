import React, { useRef, useState, useEffect } from 'react';
import DentalScreeningReport from './DetailedReports/DentalScreeningReport';
import VisionScreeningReport from './DetailedReports/VisionScreeningReport';
import EmotionalHealthReport from './DetailedReports/EmotionalHealthReport';
import NutritionalAssessmentReport from './DetailedReports/NutritionalAssessmentReport';
import PhysicalScreeningReport from './DetailedReports/PhysicalScreeningReport';
import LabDetailedReports from './DetailedReports/LabDetailedReports';
import Image from 'next/image';
import { studentDetailedReportSummary, getMedicalReportStatus } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { useParams } from 'next/navigation';
import nookies from 'nookies';

const DetailedReports = ({ academicYear = null }) => {
  const cookies = nookies.get();
  const { studentId, id } = useParams();
  const [results, setResults] = useState({});
  const [medicalResults, setMedicalResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);
  const sectionRefs = useRef([]);

  const toggleAccordion = index => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  useEffect(() => {
    const recordId = studentId ? studentId : id;
    studentDetailedReportSummary(recordId, academicYear)
      .then(res => {
        const response = JSON.parse(res);
        setResults(response);
      })
      .catch(err => {
        toastMessage(err, 'error');
      })
      .finally(() => {
        setLoading(false);
      });

    const access_roots = ['parent', 'screening', 'analyst'];
    if (access_roots.includes(cookies.root)) {
      getMedicalReportStatus(recordId, academicYear)
        .then(res => {
          const response = JSON.parse(res);
          setMedicalResults(response.data);
        })
        .catch(err => {
          toastMessage(err, 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    }

    // scroll to top
    if (openIndex === null) return;
    const el = sectionRefs.current[openIndex];
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [openIndex, academicYear]);

  // Define the accordion items with associated components
  const allAccordionItems = [
    {
      id: 'physical_screening',
      icon: '/detailed-reports-icons/physical-screening.svg',
      title: 'Physical Screening',
      component: (
        <PhysicalScreeningReport
          data={results?.data?.smart_scale_data}
          medical_data={medicalResults?.medical_screening_statuses?.find(item => item.medical_officer_status_type === 'physical_screening_status')}
        />
      ),
    },
    {
      id: 'nutritional_assessment',
      icon: '/detailed-reports-icons/apple.svg',
      title: 'Nutritional Assessment Report',
      component: (
        <NutritionalAssessmentReport
          data={results?.data?.nutritional_screening_report}
          medical_data={medicalResults?.medical_screening_statuses?.find(item => item.medical_officer_status_type === 'nutritional_report_status')}
        />
      ),
    },
    {
      id: 'emotional_health',
      icon: '/detailed-reports-icons/imoji-face.svg',
      title: 'Emotional & Development Health Report',
      component: (
        <EmotionalHealthReport
          data={results?.data?.developmental_emotional_assessment}
          medical_data={medicalResults?.medical_screening_statuses?.find(item => item.medical_officer_status_type === 'psychological_report_status')}
        />
      ),
    },
    {
      id: 'vision_screening',
      icon: '/detailed-reports-icons/vision.svg',
      title: 'Vision Screening',
      component: (
        <VisionScreeningReport
          data={results?.data?.eye_screening_report}
          medical_data={medicalResults?.medical_screening_statuses?.find(item => item.medical_officer_status_type === 'vision_screening_status')}
        />
      ),
    },
    {
      id: 'dental_screening',
      icon: '/detailed-reports-icons/teeth.svg',
      title: 'Dental Screening',
      component: (
        <DentalScreeningReport
          data={results?.data?.dental_screening_report}
          medical_data={medicalResults?.medical_screening_statuses?.find(item => item.medical_officer_status_type === 'dental_screening_status')}
        />
      ),
    },
    {
      id: 'lab_reports',
      icon: '/detailed-reports-icons/microscope.svg',
      title: 'Lab Reports',
      component: (
        <LabDetailedReports
          data={results?.data?.lab_reports}
          medical_data={medicalResults?.medical_screening_statuses?.find(item => item.medical_officer_status_type === 'lab_report_status')}
        />
      ),
    },
  ];

  const getFilteredAccordionItems = () => {
    const { root, role } = cookies;

    // If not expert login, show all items
    if (root !== 'expert') {
      return allAccordionItems;
    }

    // Role-based filtering for expert login
    switch (role) {
      case 'DENTIST':
        return allAccordionItems.filter(item => item.id === 'dental_screening');

      case 'EYE_SPECIALIST':
        return allAccordionItems.filter(item => item.id === 'vision_screening');

      case 'PSYCHOLOGIST':
        return allAccordionItems.filter(item => item.id === 'emotional_health');

      case 'NUTRITIONIST':
        return allAccordionItems.filter(item => ['nutritional_assessment', 'physical_screening', 'lab_reports'].includes(item.id));

      // For PEDIATRICIAN or any other expert roles, show all items
      default:
        return allAccordionItems;
    }
  };

  const accordionItems = getFilteredAccordionItems();

  return (
    <div className="flex flex-col w-full gap-4">
      {accordionItems.map((item, index) => (
        <div key={index} className="w-full">
          {/* Accordion Header */}
          <div
            className="w-full h-11 flex justify-between items-center rounded-lg px-6 py-2.5 bg-[#ECF2FF] cursor-pointer"
            onClick={() => toggleAccordion(index)}
          >
            <div className="flex items-center gap-4">
              <Image src={item.icon} alt="phy" width={20} height={20} className="size-5" />
              <span className="font-Inter font-medium text-xs sm:text-sm leading-6 text-start sm:text-center">{item.title}</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-5 h-5 transition-transform ${openIndex === index ? 'transform rotate-180' : ''}`}
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Accordion Content */}
          {openIndex === index && (
            <div ref={el => (sectionRefs.current[index] = el)} className="mx-4">
              {item.component}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DetailedReports;
