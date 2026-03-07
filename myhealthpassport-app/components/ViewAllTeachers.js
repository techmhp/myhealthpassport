import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { teachersList } from '@/services/secureApis';
import InlineSpinner from '@/components/UI/InlineSpinner';
import FilterSection from './FilterSection';

const ViewAllTeachers = () => {
  const { schoolid } = useParams();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch Teachers List
        const teachersResponse = await teachersList(schoolid);
        const teachersResults = JSON.parse(teachersResponse);
        if (teachersResults.status === true) {
          setTeachers(teachersResults.data.teachers_list);
        } else {
          setError('Failed to fetch teachers: ' + teachersResults.message);
        }
      } catch (error) {
        setError('Error fetching teachers data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="w-full mx-auto py-8">
        <InlineSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="mb-[33px]">
        <FilterSection />
      </div>
      <div className="w-full flex flex-col gap-8 ">
        <div className="w-full overflow-x-auto">
          {Object.keys(teachers).length > 0 ? (
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
                    Username
                  </th>
                  <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                    Full Name
                  </th>
                  <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                    Class
                  </th>
                  <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                    Section
                  </th>
                  <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                    Class Strength
                  </th>
                  <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                    Questionnaire Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher, index) => (
                  <tr key={teacher.id || index} className="bg-white">
                    <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                      <a href={`/school-admin/teachers/${teacher.id}`}>{teacher.username}</a>
                    </td>
                    <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                      {`${teacher.first_name}${teacher.middle_name ? ` ${teacher.middle_name}` : ''} ${teacher.last_name}`}
                    </td>
                    <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                      {/* {teacher.class_room?.split('')[0] || '-'} */}
                      {teacher.class_room}
                    </td>
                    <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                      {teacher.section}
                    </td>
                    <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                      {teacher?.class_strength || '-'}
                    </td>
                    <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                      <div className="flex items-center justify-center">
                        {teacher.teacher_answer_status ? (
                          <Image alt="Active" src="/iconx/check-circle.svg" width={20} height={20} />
                        ) : (
                          <Image alt="Inactive" src="/iconx/minus-circle.svg" width={20} height={20} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-red-500"> No teachers data available </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ViewAllTeachers;
