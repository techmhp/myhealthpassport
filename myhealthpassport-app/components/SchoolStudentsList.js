'use client';

import Link from 'next/link';
import Image from 'next/image';
import nookies from 'nookies';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ROLE_COLUMNS from '@/helpers/roleBasedTableColumns';
import InlineSpinner from '@/components/UI/InlineSpinner';
import { studentList, updateOverallScreeningStatus, updatePaymentStatus } from '@/services/secureApis';
import { toastMessage, formatFullName, renderStatusIcon, renderMedicalOfficerStatus } from '@/helpers/utilities';
import ConfirmModal from './UI/ConfirmModal';
import FilterSection from './FilterSection';

const SchoolStudentsList = ({ school, page = null, onStudentClick = null }) => {
  const router = useRouter();
  const cookies = nookies.get();
  const { schoolid, id } = useParams();
  const [root, setRoot] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [columnKey, setColumnKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  // For onground attendance
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStudentsData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!school) {
        setError('Invalid school found');
        return;
      }
      const allStudentsResponse = await studentList(school.school_id, searchQuery);
      const allStudentsResults = JSON.parse(allStudentsResponse);
      console.log('allStudentsResults', allStudentsResults);
      if (allStudentsResults.status === true) {
        setAllStudents(allStudentsResults.data.students_list);
      } else if (allStudentsResults.status === false) {
        setError('Failed to fetch students: ' + allStudentsResults.message);
      }
    } catch (err) {
      setError('Error fetching students data');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = value => {
    setSearchQuery(value);
  };

  // Initial data fetch
  useEffect(() => {
    if (cookies.role && cookies.root !== 'undefined') {
      setRole(cookies.role);
      setRoot(cookies.root);
    }
    fetchStudentsData();
  }, []);

  // Filter the student list based on the search term
  const filteredStudents = allStudents.filter(student => {
    // Convert search term to lowercase for case-insensitive search
    const lowerCaseSearchTerm = searchQuery.toLowerCase();

    // Check if the search term is found in any of the relevant fields
    return (
      student.roll_no.toLowerCase().includes(lowerCaseSearchTerm) ||
      formatFullName(student).toLowerCase().includes(lowerCaseSearchTerm) ||
      student.gender.toLowerCase().includes(lowerCaseSearchTerm) ||
      student.age.toLowerCase().includes(lowerCaseSearchTerm) ||
      student.phone.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const columns = ROLE_COLUMNS(root, role, page) || ROLE_COLUMNS('SCHOOL_STAFF', 'SCHOOL_ADMIN');

  const generateDynamicUrl = studentId => {
    const baseUrlTemplates = {
      admin: `/admin/schools/${schoolid}/student/${studentId}`,
      'school-admin': `/school-admin/students/${studentId}`,
      screening: `/screening/roster/${schoolid}/student/${studentId}`,
      analyst: `/analyst/roster/${schoolid}/student/${studentId}`,
      teacher: `/teacher/students/${studentId}`,
      parent: `/parent/view/class/${id}`,
      onground: role !== 'CAMP_COORDINATOR' ? `/onground/roster/${schoolid}/student/${studentId}` : '#',
      expert: `/expert/patients/1`,
      'health-buddy': `/health-buddy/roster/${schoolid}/student/${studentId}`,
    };

    return baseUrlTemplates[root] || `/`;
  };

  // ONGround Actions Start
  const handleConfirmClick = (data, key) => {
    setStudentInfo(data);
    setColumnKey(key);
    if (role !== 'SCHOOL_ADMIN') {
      setIsModalOpen(true);
    }
  };

  const handleCancelAction = () => {
    // Close the modal if cancelled
    setIsModalOpen(false);
  };

  const handleConfirmAction = async () => {
    setLoading(true);
    if (columnKey === 'completed_status') {
      updateOverallScreening();
    } else if (columnKey === 'school_payment_status') {
      handlePaymentStatus();
    }
  };

  const handlePaymentStatus = async () => {
    try {
      const payload = {
        student_id: studentInfo.id,
        is_paid: true,
      };
      const response = await updatePaymentStatus(JSON.stringify(payload));
      if (response.status === true) {
        toastMessage(response.message || 'Payment status updated successfully', 'success');

        setAllStudents(prevStudents => prevStudents.map(student => (student.id === studentInfo.id ? { ...student, payment_status: true } : student)));

        // Close modal and reset
        setIsModalOpen(false);
        setStudentInfo(null);
        setColumnKey(null);
        window.location.reload();
      } else {
        toastMessage(response.message || 'Failed to update payment status', 'error');
      }
    } catch (err) {
      toastMessage(err.message || 'An error occurred while updating payment status', 'error');
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  const updateOverallScreening = async () => {
    try {
      const obj = {
        registration_status: true,
        dental_screening_status: true,
        eye_screening_status: true,
        behavioural_screening_status: true,
        nutrition_screening_status: true,
        smart_scale_status: true,
      };
      const response = await updateOverallScreeningStatus(studentInfo.id, schoolid, JSON.stringify(obj));
      // console.log(response);
      if (response.status === true) {
        toastMessage(response.message, 'success');
      } else if (response.status === false) {
        toastMessage(response.message, 'error');
      }
    } catch (err) {
      toastMessage(err.message || 'An error occurred while updating data', 'error');
    } finally {
      setStudentInfo({});
      setLoading(false);
      setIsModalOpen(false);
      if (window !== 'undefined') {
        window.location.reload();
      }
      router.refresh();
    }
  };
  // OnGround Actions End

  // Function to format phone number
  const formatPhoneNumber = student => {
    const countryCode = student.country_code || '91';
    const phone = student.phone || '';
    return phone ? `+${countryCode} ${phone}` : '-';
  };

  // Function to render cell content based on column type
  const renderCellContent = (student, column, index) => {
    const { key, type } = column;

    switch (type) {
      case 'text':
        return student[key] || '-';

      case 'fullName':
        return (
          <Link href={generateDynamicUrl(student.id)} className="flex">
            {formatFullName(student)}
          </Link>
        );

      case 'phone':
        return formatPhoneNumber(student);

      case 'serial':
        return index + 1;

      case 'status':
        return (
          <Link href="#" className="text-center justify-center flex">
            {renderStatusIcon(student[key])}
          </Link>
        );

      case 'medical_officer_status':
        return (
          <Link href="#" className="text-center justify-center flex">
            {renderMedicalOfficerStatus(student)}
          </Link>
        );

      case 'all_completed_status':
        return (
          <Link href="#" className="text-center justify-center flex" onClick={() => setExpanded(expanded === index ? null : index)}>
            {renderStatusIcon(student[key])}
          </Link>
        );

      case 'action':
        return (
          <Link href={generateDynamicUrl(student.id)} className="text-center justify-center flex">
            <svg xmlns="https://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#B5CCFF" className="size-5">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM6.75 9.25a.75.75 0 0 0 0 1.5h4.59l-2.1 1.95a.75.75 0 0 0 1.02 1.1l3.5-3.25a.75.75 0 0 0 0-1.1l-3.5-3.25a.75.75 0 1 0-1.02 1.1l2.1 1.95H6.75Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        );

      case 'complete_status':
        return (
          <Link href="#" onClick={() => handleConfirmClick(student, key)} className="text-center justify-center flex">
            {renderStatusIcon(student[key])}
          </Link>
        );

      case 'invoice':
        return (
          // <Link href={generateDynamicUrl(student.id)} className="text-center justify-center flex">
          <a href="#" className=" flex items-center justify-center">
            <Image alt="Download invoice" src="/iconx/download.svg" width={20} height={20} className="size-5 filter-light" />
          </a>
          // </Link>
        );

      default:
        return student[key] || '-';
    }
  };

  const renderCompleteStatus = student => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border-t border-l border-solid border-[#B5CCFF] font-inter font-normal text-sm text-black">
        <div className="row-span-4 m-3">
          <h3 className="font-semibold float-left text-gray-700 mb-3">Completion Status</h3>
        </div>
        {completionStatuses.map((group, idx) => (
          <div key={idx} className="row-span-3 m-3 float-right text-gray-700 space-y-2">
            <div className="items-center gap-4 mb-1">
              {group.map((status, i) => (
                <div key={i} className="leading-7 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={status.value}
                    checked={student[status.value] ? student[status.value] : false}
                    className="w-4 h-4 border-[#5389FF] rounded"
                    readOnly
                  />
                  <label htmlFor="registration_status" className="text-xm font-normal">
                    {status.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const completionStatuses = [
    [
      { label: 'Physical Screening', value: 'smart_scale_status' },
      { label: 'Nutrition Screening', value: 'nutrition_screening_status' },
      { label: 'Emotional Screening', value: 'behavioural_screening_status' },
      { label: 'Dental Screening', value: 'dental_screening_status' },
      { label: 'Ophthalmological Screening', value: 'eye_screening_status' },
      { label: 'Lab Test', value: 'lab_test_status' },
      // { label: 'Health Officer', value: 'health_officer_status' },
    ],
    [
      // { label: 'Physical Analysis', value: 'Physical_analysis_status' },
      { label: 'Nutrition Analysis', value: 'nutrition_analysis_status' },
      { label: 'Emotional Analysis', value: 'psychological_analysis_status' },
      // { label: 'Dental Analysis', value: 'dental_analysis_status' },
      // { label: 'Ophthalmologist Analysis', value: 'eye_analysis_status' },
      { label: 'Medical Officer', value: 'medical_officer_analysis_status' },
      // { label: 'Final Report Generation', value: 'final_report_generation' },
    ],
  ];

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="mb-[33px]">
        <FilterSection searchQuery={searchQuery} onSearchChange={handleSearchChange} />
      </div>
      {loading === true ? (
        <div className="w-full mx-auto py-8">
          <InlineSpinner />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-gray-500">{searchQuery ? `No students found matching "${searchQuery}"` : 'No students found for this section.'}</div>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          {Object.keys(filteredStudents).length > 0 ? (
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
                  {columns.map((column, index) => (
                    <th
                      key={column.key || index}
                      className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]"
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <>
                    <tr
                      key={index}
                      className={`bg-white ${onStudentClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => onStudentClick && onStudentClick(student)}
                    >
                      {columns.map((column, colIndex) => (
                        <td
                          key={`${index}-${column.key || colIndex}`}
                          className={`bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black ${
                            column.type === 'status' ? 'justify-center' : ''
                          }`}
                        >
                          {renderCellContent(student, column, index)}
                        </td>
                      ))}
                    </tr>
                    {/* Expanded Row */}
                    {expanded === index && (
                      <tr className="w-full p-3">
                        <td colSpan={10} className="bg-gray-50">
                          {renderCompleteStatus(student)}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-red-500"> No student data available </div>
          )}
        </div>
      )}
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={handleCancelAction} // Use cancel handler for closing from overlay/X button
        onConfirm={handleConfirmAction}
        type={columnKey}
        data={studentInfo}
      />
    </div>
  );
};
export default SchoolStudentsList;
