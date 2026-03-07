import { useState } from 'react';

const students = [
  {
    rollNo: '09-B-001',
    name: 'Aarav Sharma',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-002',
    name: 'Anaya Iyer',
    registration: 'pending',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-003',
    name: 'Vivaan Mehta',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-004',
    name: 'Siya Nair',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-005',
    name: 'Rohan Choudhary',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-006',
    name: 'Kavya Reddy',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-007',
    name: 'Advait Malhotra',
    registration: 'pending',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-009',
    name: 'Meher Singh',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-010',
    name: 'Devansh Kulkarni',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-011',
    name: 'Riya Deshmukh',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-012',
    name: 'Arjun Bansal',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-013',
    name: 'Tanvi Joshi',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-014',
    name: 'Krish Verma',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-015',
    name: 'Aisha Thakur',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-016',
    name: 'Neil Tiwari',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-017',
    name: 'Sneha Rao',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-018',
    name: 'Aryan Saxena',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-019',
    name: 'Saanvi Agarwal',
    registration: 'pending',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-020',
    name: 'Reyansh Gupta',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-021',
    name: 'Myra Bhattacharya',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-022',
    name: 'Rudra Bose',
    registration: 'pending',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
  {
    rollNo: '09-B-023',
    name: 'Zoya Chakraborty',
    registration: 'completed',
    physicalScreening: 'completed',
    eyeSpecialist: 'completed',
    dentist: 'completed',
    nutritionist: 'completed',
    behavioral: 'completed',
    allCompleted: 'completed',
  },
];

const GroundCampTable = () => {
  return (
    <div className="w-full flex flex-col gap-8 p-4">
      <div className="w-full overflow-x-auto">
        <table
          className="w-full border border-solid border-[#B5CCFF] rounded"
          style={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            borderRadius: '4px',
          }}
        >
          <thead>
            <tr className="bg-[#ECF2FF]">
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-24">
                Roll No.
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-40">
                Name
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-center font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-24">
                Registration
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-center font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-28">
                <div className="flex flex-col items-center">
                  <div>Physical</div>
                  <div>Screening</div>
                </div>
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-center font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-24">
                <div className="flex flex-col items-center">
                  <div>Eye</div>
                  <div>Specialist</div>
                </div>
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-center font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-20">
                Dentist
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-center font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-24">
                Nutritionist
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-center font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-24">
                Behavioral
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-r border-solid border-[#B5CCFF] py-2.5 px-3 text-center font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-24">
                <div className="flex flex-col items-center">
                  <div>All</div>
                  <div>Completed</div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={index} className="bg-white">
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {student.rollNo}
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {student.name}
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                  <div className="flex justify-center">
                    <button className="items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#89E382" className="size-5">
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                  <div className="flex justify-center">
                    <button className="items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#89E382" className="size-5">
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                  <div className="flex justify-center">
                    <button className="items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#89E382" className="size-5">
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                  <div className="flex justify-center">
                    <button className="items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#89E382" className="size-5">
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                  <div className="flex justify-center">
                    <button className="items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#89E382" className="size-5">
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                  <div className="flex justify-center">
                    <button className="items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#89E382" className="size-5">
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="bg-white border-t border-l border-r border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                  <div className="flex justify-center">
                    <button className="items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#89E382" className="size-5">
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GroundCampTable;
