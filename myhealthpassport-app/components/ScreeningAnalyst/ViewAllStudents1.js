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

const ViewAllStudents1 = () => {
  return (
    <div className="w-full flex flex-col gap-8">
      <div className="w-full flex items-center justify-center">
        <div className="w-[80%] flex gap-[70px] items-center justify-center">
          <div className="">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
              <path
                fillRule="evenodd"
                d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="w-full flex gap-5 items-center">
            <div className="flex flex-1 gap-[10px]">
              <div className="w-full grid grid-cols-1">
                <input
                  id="search"
                  name="search"
                  type="search"
                  placeholder="search"
                  className="w-full col-start-1 row-start-1 block rounded-[5px] p-[10px] bg-white pr-3 text-base text-gray-900 outline-1 -outline-offset-1 border-[#B5CCFF] outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:pl-9 sm:text-sm/6"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="#5389FF"
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 ml-3 size-4 self-center text-gray-400 sm:size-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#5389FF" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25" />
              </svg>
            </div>
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#5389FF" className="size-6">
                <path d="M6 12a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 1 1 1.5 0v7.5A.75.75 0 0 1 6 12ZM18 12a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 1.5 0v7.5A.75.75 0 0 1 18 12ZM6.75 20.25v-1.5a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0ZM18.75 18.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 1.5 0ZM12.75 5.25v-1.5a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0ZM12 21a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 1.5 0v7.5A.75.75 0 0 1 12 21ZM3.75 15a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0ZM12 11.25a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5ZM15.75 15a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
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
              <th className="bg-[#ECF2FF] border-t border-l border-r border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
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
                  {student.section}
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

export default ViewAllStudents1;
