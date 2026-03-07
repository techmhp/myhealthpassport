import Link from 'next/link';
import nookies from 'nookies';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import InlineSpinner from './UI/InlineSpinner';

const ViewAllStudents = ({ studentsData = [] }) => {
  const cookies = nookies.get();
  const { schoolid, id } = useParams();
  const [root, setRoot] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cookies.root && cookies.root !== 'undefined') {
      setRoot(cookies.root);
    }
    setLoading(false);
  }, [cookies]);

  const generateDynamicUrl = studentId => {
    const baseUrlTemplates = {
      admin: `/admin/roster/${schoolid}/student/${studentId}`,
      'school-admin': `/school-admin/students/${studentId}`,
      screening: `/screening/roster/${schoolid}/class/${id}/child-profile`,
      analyst: `/analyst/roster/${schoolid}/class/${id}/child-profile`,
      teacher: `/teacher/students/${studentId}`,
      parent: `/parent/view/class/${id}`,
      onground: `/onground/roster/${schoolid}/class/${id}/child-profile/1`,
      expert: `/expert/patients/1`,
    };

    return baseUrlTemplates[root] || `/`;
  };

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

  if (loading) {
    return <InlineSpinner />;
  }

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
                Screening Status
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Payment Status
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {studentsData.map((student, index) => (
              <tr key={student.id || index} className="bg-white">
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {student.roll_no || '-'}
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {formatFullName(student)}
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {student.class_room || '-'}
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {student.section || '-'}
                </td>
                <td className="bg-white justify-center border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  <Link href="#" className="text-center justify-center flex">
                    {renderStatusIcon(student.screening_status)}
                  </Link>
                </td>
                <td className="bg-white justify-center border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  <Link href="#" className="text-center justify-center flex">
                    {renderStatusIcon(student.payment_status)}
                  </Link>
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%]">
                  <Link href={generateDynamicUrl(student.id)} className="text-center justify-center flex">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#B5CCFF" className="size-5">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM6.75 9.25a.75.75 0 0 0 0 1.5h4.59l-2.1 1.95a.75.75 0 0 0 1.02 1.1l3.5-3.25a.75.75 0 0 0 0-1.1l-3.5-3.25a.75.75 0 1 0-1.02 1.1l2.1 1.95H6.75Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewAllStudents;
