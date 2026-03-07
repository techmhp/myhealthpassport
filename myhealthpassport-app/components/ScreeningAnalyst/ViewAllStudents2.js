import { useState, useEffect } from 'react';
import Image from 'next/image';
import nookies from 'nookies';

const students = [
  {
    rollNo: '09-B-001',
    name: 'Aarav Sharma',
    class: '9',
    section: 'B',
    gender: 'Male',
    age: '14',
    phoneNumber: '+91 7331124989',
  },
  {
    rollNo: '09-B-002',
    name: 'Anaya Iyer',
    class: '9',
    section: 'B',
    gender: 'Female',
    age: '14',
    phoneNumber: '+91 7331124900',
  },
  {
    rollNo: '09-B-003',
    name: 'Vivaan Mehta',
    class: '9',
    section: 'B',
    gender: 'Male',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-004',
    name: 'Siya Nair',
    class: '9',
    section: 'B',
    gender: 'Female',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-005',
    name: 'Rohan Choudhary',
    class: '9',
    section: 'B',
    gender: 'Male',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-006',
    name: 'Kavya Reddy',
    class: '9',
    section: 'B',
    gender: 'Female',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-007',
    name: 'Advait Malhotra',
    class: '9',
    section: 'B',
    gender: 'Male',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-009',
    name: 'Meher Singh',
    class: '9',
    section: 'B',
    gender: 'Male',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-010',
    name: 'Devansh Kulkarni',
    class: '9',
    section: 'B',
    gender: 'Female',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-011',
    name: 'Riya Deshmukh',
    class: '9',
    section: 'B',
    gender: 'Male',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-012',
    name: 'Arjun Bansal',
    class: '9',
    section: 'B',
    gender: 'Female',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-013',
    name: 'Tanvi Joshi',
    class: '9',
    section: 'B',
    gender: 'Male',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-014',
    name: 'Krish Verma',
    class: '9',
    section: 'B',
    gender: 'Female',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-015',
    name: 'Aisha Thakur',
    class: '9',
    section: 'B',
    gender: 'Male',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-016',
    name: 'Neil Tiwari',
    class: '9',
    section: 'B',
    gender: 'Female',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-017',
    name: 'Sneha Rao',
    class: '9',
    section: 'B',
    gender: 'Male',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-018',
    name: 'Aryan Saxena',
    class: '9',
    section: 'B',
    gender: 'Female',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-019',
    name: 'Saanvi Agarwal',
    class: '9',
    section: 'B',
    gender: 'Male',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-020',
    name: 'Reyansh Gupta',
    class: '9',
    section: 'B',
    gender: 'Female',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-021',
    name: 'Myra Bhattacharya',
    class: '9',
    section: 'B',
    gender: 'Male',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-022',
    name: 'Rudra Bose',
    class: '9',
    section: 'B',
    gender: 'Female',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
  {
    rollNo: '09-B-023',
    name: 'Zoya Chakraborty',
    class: '9',
    section: 'B',
    gender: 'Male',
    age: '14',
    phoneNumber: '+91 9848298457',
  },
];

const TableView = () => {
  const cookies = nookies.get();
  const [role, setRole] = useState('');

  useEffect(() => {
    if (cookies.role && cookies.role !== 'undefined') {
      setRole(cookies.role);
    }
  }, [cookies]);

  // Function to get random status icons
  const getRandomStatus = () => {
    const statuses = [
      { color: '#89E382', icon: 'check' }, // Green check
      { color: '#FFB84D', icon: 'clock' }, // Orange clock
      { color: '#FF6B6B', icon: 'x' }, // Red X
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const StatusIcon = ({ status }) => {
    if (status.icon === 'check') {
      return <Image alt="Active" src="/iconx/check-circle.svg" width={20} height={20} />;
    } else if (status.icon === 'clock') {
      return <Image alt="Inactive" src="/iconx/minus-circle.svg" width={20} height={20} />;
    } else {
      return <Image alt="Active" src="/iconx/check-circle.svg" width={20} height={20} />;
    }
  };

  // Program Coordinator table design
  if (role === 'PROGRAM_COORDINATOR') {
    return (
      <div className="w-full flex flex-col gap-8">
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
                <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Roll No.
                </th>
                <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Name
                </th>
                <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Class
                </th>
                <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Section
                </th>
                <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Gender
                </th>
                <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Age
                </th>
                <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Payment
                  <br />
                  Status
                </th>
                <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Screening <br /> Status
                </th>
                <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Report <br /> Status
                </th>
                <th className="bg-[#ECF2FF] border-t border-l border-r border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Health
                  <br />
                  Buddy
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
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {student.class}
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {student.section}
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {student.gender}
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {student.age}
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                    <div className="flex justify-center">
                      <button className="items-center justify-center">
                        <StatusIcon status={getRandomStatus()} />
                      </button>
                    </div>
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                    <div className="flex justify-center">
                      <button className="items-center justify-center">
                        <StatusIcon status={getRandomStatus()} />
                      </button>
                    </div>
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                    <div className="flex justify-center">
                      <button className="items-center justify-center">
                        <StatusIcon status={getRandomStatus()} />
                      </button>
                    </div>
                  </td>
                  <td className="bg-white border-t border-l border-r border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                    <div className="flex justify-center">
                      <button className="items-center justify-center">
                        <StatusIcon status={getRandomStatus()} />
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
  }

  // Registration table design
  if (role === 'REGISTRATION_TEAM') {
    return (
      <div className="w-full flex flex-col gap-8">
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
                <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Roll No.
                </th>
                <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Name
                </th>
                <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Gender
                </th>
                <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Age
                </th>
                <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Phone Number
                </th>
                <th className="bg-[#ECF2FF] border-t border-l border-r border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                  Screening Status
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
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {student.gender}
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {student.age}
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {student.phoneNumber}
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
  }

  // Regular table design (default)
  return (
    <div className="w-full flex flex-col gap-8">
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
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Roll No.
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Name
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Class
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Gender
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Age
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Status
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
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {student.class}
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {student.gender}
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {student.age}
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                  <button className="items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#89E382" className="size-5">
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;
