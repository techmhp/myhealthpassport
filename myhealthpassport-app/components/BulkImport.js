import { useState, useEffect } from 'react';
import Image from 'next/image';
import { importStudentsData, importStudentsDataConfirm } from '@/services/secureApis';
import nookies from 'nookies';
import { getAge } from '@/helpers/utilities';
import { useRouter } from 'next/navigation';
import { toastMessage } from '@/helpers/utilities';
import { useParams } from 'next/navigation';

const BulkImport = () => {
  const { schoolid } = useParams();
  const cookies = nookies.get();
  const router = useRouter();
  const [root, setRoot] = useState(null);
  const [file, setFile] = useState(null);
  const [transactionNo, setTransactionNo] = useState(null);
  const [school_id, setSchool_id] = useState(schoolid);
  const [results, setResults] = useState({});
  const [showErrorMessage, setShowErrorMessage] = useState('Please upload a csv file');

  useEffect(() => {
    setRoot(cookies.root);
    if (typeof schoolid === 'undefined') {
      const base64User = localStorage.getItem('user_info');
      const user_info = JSON.parse(atob(base64User));
      if (user_info && user_info.school_id) {
        setSchool_id(user_info.school_id);
      }
    }
  }, [schoolid]);

  const handleFileChange = async event => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    try {
      const response = await importStudentsData(school_id, selectedFile);
      if (response.status === true) {
        if (response.errors?.details) {
          setShowErrorMessage(response.message);
          setTransactionNo(response.data.transaction_no);
          setResults(response);
          toastMessage(response.errors?.details, 'error');
        } else {
          setShowErrorMessage(response.message);
          setTransactionNo(response.data.transaction_no);
          setResults(response);
          toastMessage(response.message || 'Students imported successfully', 'success');
        }
      } else {
        setShowErrorMessage(response.message);
        toastMessage(response.message || 'Failed to import students', 'error');
      }
    } catch (err) {
      // console.log(err);
      setShowErrorMessage(err.message || 'Something went wrong');
      toastMessage(err.message || 'Something went wrong', 'error');
    }
  };

  const StudentDataConfirm = async () => {
    let data = {
      transaction_no: transactionNo,
      confirm: true,
    };
    try {
      // Use school_id (from state, resolved for school-admin users) rather than schoolid (from params)
      const response = await importStudentsDataConfirm(school_id, JSON.stringify(data));
      if (response.status === true) {
        toastMessage(response.message || 'Students imported successfully', 'success');
        if (root === 'admin') {
          router.back();
        } else {
          router.push(`/${root}/students`);
        }
      } else {
        toastMessage(response.message || 'Confirmation failed', 'error');
      }
    } catch (err) {
      toastMessage(err.message || 'Confirmation failed', 'error');
      setShowErrorMessage(err.message || 'Confirmation failed');
    }
  };

  return (
    <div className="w-full space-y-10">
      <div className="w-full flex gap-20 items-center">
        <div className="flex flex-col gap-[12px] w-1/2">
          <span className="font-medium text-sm">Step 1</span>
          <span className="font-medium text-xs leading-6">Please download the csv file below and fill out all the students information.</span>
          <div className="rounded-[10px] border border-[#BDD2FF] p-[10px] gap-[16px] bg-[#FAFBFF] flex items-center">
            <Image src="/iconx/document.svg" alt="document" width={24} height={24} className="size-6" />
            <span className="font-medium text-[14px] leading-6">
              <a href="/Bulk Import - Students.csv">Bulk Import - Students.csv</a>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-[12px] w-1/2">
          <span className="font-medium text-sm">Step 2</span>
          <span className="font-medium text-xs leading-6">Please download the csv file below and fill out all the students information.</span>
          <input id="fileInput" type="file" className="hidden" onChange={handleFileChange} />
          <label htmlFor="fileInput" className="cursor-pointer rounded-[10px] border border-[#BDD2FF] p-[10px] gap-[16px] flex justify-center items-center">
            <Image src="/iconx/upload.svg" alt="document" width={30} height={30} className="size-6" />
            <span className="font-medium text-[14px] leading-6 text-[#5389FF]">{file ? file.name : 'Upload CSV file'}</span>
          </label>
          <span className="font-medium text-xs leading-6">
            Note : Enter the data in student_class as follows: Use Nursery for Nursery Class, LKG for LKG or PP1 Class, and UKG for UKG or PP2 Class.
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-[12px]">
        <span className="font-medium text-sm">Step 3</span>
        <span className="font-medium text-xs leading-6">Please preview all the student details</span>
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
                  Phone Numbers
                </th>
              </tr>
            </thead>
            <tbody>
              {results?.status && results.status === true ? (
                results.data.students_data.map((student, index) => (
                  <tr key={index} className="bg-white">
                    <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                      {student.student_roll_no}
                    </td>
                    <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                      {`${student.student_first_name} ${student.student_middle_name} ${student.student_last_name}`}
                    </td>
                    <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                      {student.student_class}
                    </td>
                    <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                      {student.student_section}
                    </td>
                    <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                      {student.student_gender}
                    </td>
                    <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                      {getAge(student?.student_dob)}
                    </td>
                    <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                      {student.phone}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="bg-white">
                  <td colSpan={8} className="text-center p-2 text-red-500">
                    {showErrorMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
          <button
            onClick={() => {
              router.back();
            }}
            className="font-normal cursor-pointer py-2 px-5  border border-[#5465FF]  rounded-[5px] whitespace-nowrap"
          >
            Close
          </button>
          <button
            type="button"
            onClick={StudentDataConfirm}
            disabled={!transactionNo}
            className={`rounded-[5px] px-5 py-2 text-sm font-normal whitespace-nowrap shadow-xs bg-indigo-500 text-white 
    ${transactionNo ? ' hover:bg-indigo-400 cursor-pointer' : 'cursor-not-allowed'}
  `}
          >
            Confirm & Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkImport;
