import React, { useState } from 'react';
import HealthMetrics from './HealthMetrics';
import DentalScreening from './DentalScreening';
import VisionScreening from './VisionScreening';
import EmotionalHealthReport from './DetailedReports/EmotionalHealthReport';
import NutritionalAssessmentReport from './DetailedReports/NutritionalAssessmentReport';
import LabReports from './LabReports';

import Image from 'next/image';

const Prescriptions = () => {
  const [openAccordion, setOpenAccordion] = useState(null);

  const toggleAccordion = index => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  // Define the accordion items with associated components
  const accordionItems = [
    { icon: '/detailed-reports-icons/physical-screening.svg', title: 'Physical Screening', component: <HealthMetrics /> },
    { icon: '/detailed-reports-icons/vision.svg', title: 'Vision Screening', component: <VisionScreening /> },
    { icon: '/detailed-reports-icons/teeth.svg', title: 'Dental Screening', component: <DentalScreening /> },
    { icon: '/detailed-reports-icons/apple.svg', title: 'Nutritional Assessment Report', component: <NutritionalAssessmentReport /> },
    { icon: '/detailed-reports-icons/imoji-face.svg', title: 'Emotional & Development Health Report', component: <EmotionalHealthReport /> },
    { icon: '/detailed-reports-icons/microscope.svg', title: 'Lab Reports', component: <LabReports /> },
  ];

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
              <span className="font-Inter font-medium text-sm leading-6 text-center">{item.title}</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-5 h-5 transition-transform ${openAccordion === index ? 'transform rotate-180' : ''}`}
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Accordion Content */}
          {openAccordion === index && <div className="mx-4">{item.component}</div>}
        </div>
      ))}
    </div>
  );
};

export default Prescriptions;
