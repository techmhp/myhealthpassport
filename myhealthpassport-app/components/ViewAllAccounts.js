import Image from 'next/image';

const ViewAllAccounts = ({ studentsData }) => {
  // Function to format student name
  const formatFullName = student => {
    const firstName = student.first_name || '';
    const middleName = student.middle_name || '';
    const lastName = student.last_name || '';

    let fullName = firstName;
    if (middleName && middleName !== '-') {
      fullName += ` ${middleName}`;
    }
    if (lastName) {
      fullName += ` ${lastName}`;
    }

    return fullName.trim();
  };

  // Function to render status icon
  const renderStatusIcon = status => {
    if (status) {
      // Green checkmark for true
      return <Image alt="Active" src="/iconx/check-circle.svg" width={20} height={20} />;
    } else {
      // Red X for false
      return <Image alt="Warning" src="/iconx/minus-circle.svg" width={20} height={20} />;
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 ">
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
              <th className=" border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Roll No.
              </th>
              <th className=" border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Name
              </th>
              <th className=" border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Class
              </th>
              <th className=" border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Gender
              </th>
              <th className=" border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Age
              </th>
              <th className=" border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Payment
              </th>
              <th className=" border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Invoice
              </th>
            </tr>
          </thead>
          <tbody>
            {studentsData &&
              studentsData.map((student, index) => (
                <tr key={student.id || index} className="bg-white">
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {student.roll_no}
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {formatFullName(student)}
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {student.class_room}
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : student.gender}
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {student.age}
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                    <a href="#" className=" flex items-center justify-center">
                      {renderStatusIcon(student.payment_status)}
                    </a>
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                    <a href="#" className=" flex items-center justify-center">
                      <Image
                        alt="Download invoice"
                        src="/iconx/download.svg"
                        width={8}
                        height={8}
                        className={student.payment_status ? 'size-5 filter-light' : 'size-5 filter-gray'}
                      />
                    </a>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewAllAccounts;
