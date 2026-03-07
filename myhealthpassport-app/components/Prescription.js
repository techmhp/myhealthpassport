import React, { useState } from 'react';
import Pediatrician from './Prescription/Pediatrician';
import Cardiologist from './Prescription/Cardiologist';
import Dentist from './Prescription/Dentist';
import Dermatologist from './Prescription/Dermatologist';
import Neurologist from './Prescription/Neurologist';
import Orthopedic from './Prescription/Orthopedic';
import Nutritionist from './Prescription/Nutritionist';
import Counsellor from './Prescription/Counsellor';
import EyeSpecialist from './Prescription/EyeSpecialist';

const Prescription = ({ academicYear = null }) => {
  const [openAccordion, setOpenAccordion] = useState(null);

  const toggleAccordion = index => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  const accordionItems = [
    { title: 'Pediatrician', component: <Pediatrician academicYear={academicYear} /> },
    { title: 'Dentist', component: <Dentist academicYear={academicYear} /> },
    // { title: 'Cardiologist - 25/05/2024', component: <Cardiologist /> },
    // { title: 'Dermatologist - 30/05/2024', component: <Dermatologist /> },
    // { title: 'Orthopedic Surgeon - 02/06/2024', component: <Orthopedic /> },
    // { title: 'Nutritionist', component: <Nutritionist /> },
    { title: 'Counsellor', component: <Counsellor academicYear={academicYear} /> },
    { title: 'Eye Specialist', component: <EyeSpecialist academicYear={academicYear} /> },
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
            <span className="font-inter text-sm text-[#000000]">{item.title}</span>
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

export default Prescription;
