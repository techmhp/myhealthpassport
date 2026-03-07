import { useState, useEffect } from 'react';
import Image from 'next/image';
import { importTeachersData, importTeachersDataConfirm } from '@/services/secureApis';
import nookies from 'nookies';
import { getAge } from '@/helpers/utilities';
import { useRouter } from 'next/navigation';
import { toastMessage } from '@/helpers/utilities';
import Spinner from '@/components/UI/Spinner';

const BulkImport = () => {
  const cookies = nookies.get();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [root, setRoot] = useState(null);
  const [file, setFile] = useState(null);
  const [transactionNo, setTransactionNo] = useState(null);
  const [results, setResults] = useState({});
  const [showErrorMessage, setShowErrorMessage] = useState('Please upload a csv file');

  useEffect(() => {
    setRoot(cookies.root);
  }, []);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const handleFileChange = async event => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true);

    try {
      const response = await importTeachersData(selectedFile);
      if (response.status === true) {
        setShowErrorMessage(response.message);
        setTransactionNo(response.data.transaction_no);
        setResults(response);
        toastMessage(response.message || 'Teachers imported successfully', 'success');
      } else if (response.status === false) {
        setShowErrorMessage(response.message);
        // toastMessage(response.message || 'Failed to import teachers', 'error');
        toastMessage(response.errors?.message, 'error');
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setShowErrorMessage(err.message || 'Something went wrong');
      toastMessage(err.message || 'Something went wrong', 'error');
    }
  };

  const StudentDataConfirm = async () => {
    let data = {
      transaction_no: transactionNo,
      confirm: true,
    };
    setLoading(true);
    try {
      const response = await importTeachersDataConfirm(JSON.stringify(data));
      if (response.status === true) {
        toastMessage(response.message || 'Teachers imported successfully', 'success');
      }
      router.push(`/${root}/teachers`);
    } catch (err) {
      setLoading(false);
      setShowErrorMessage(err.message || 'Confirmation failed');
      toastMessage(err.message || 'Confirmation failed', 'error');
    }
  };

  return (
    <>
      <div className={classNames(loading ? "opacity-20" : "", "w-full space-y-10")}>
        <div className="w-full flex gap-20 items-center">
          <div className="flex flex-col gap-[12px] w-1/2">
            <span className="font-medium text-sm">Step 1</span>
            <span className="font-medium text-xs leading-6">Please download the csv file below and fill out all the teachers information.</span>
            <div className="rounded-[10px] border border-[#BDD2FF] p-[10px] gap-[16px] bg-[#FAFBFF] flex items-center">
              <Image src="/iconx/document.svg" alt="document" width={24} height={24} className="size-6" />
              <span className="font-medium text-[14px] leading-6">
                <a href="/Bulk Import - Teachers.csv">Bulk Import - Teachers.csv</a>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-[12px] w-1/2">
            <span className="font-medium text-sm">Step 2</span>
            <span className="font-medium text-xs leading-6">Please download the csv file below and fill out all the teachers information.</span>
            <input id="fileInput" type="file" className="hidden" onChange={handleFileChange} />
            <label htmlFor="fileInput" className="cursor-pointer rounded-[10px] border border-[#BDD2FF] p-[10px] gap-[16px] flex justify-center items-center">
              <Image src="/iconx/upload.svg" alt="document" width={30} height={30} className="size-6" />
              <span className="font-medium text-[14px] leading-6 text-[#5389FF]">{file ? file.name : 'Upload CSV file'}</span>
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-[12px]">
          <span className="font-medium text-sm">Step 3</span>
          <span className="font-medium text-xs leading-6">Please preview all the teachers details</span>
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
                    First Name
                  </th>
                  <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                    Middle Name
                  </th>
                  <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                    Last Name
                  </th>
                  <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                    Country Code
                  </th>
                  <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                    Phone Number
                  </th>
                  <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                    Email
                  </th>
                  <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                    Class
                  </th>
                  <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                    Section
                  </th>
                  <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                    Date of Birth
                  </th>
                  <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                    Age
                  </th>
                  <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                    Gender
                  </th>
                </tr>
              </thead>
              <tbody>
                {results?.status && results.status === true ? (
                  results.data.teachers_list.map((teacher, index) => (
                    <tr key={index} className="bg-white">
                      <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                        {teacher.first_name}
                      </td>
                      <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                        {teacher.middle_name}
                      </td>
                      <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                        {teacher.last_name}
                      </td>
                      <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                        {teacher.country_calling_code}
                      </td>
                      <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                        {teacher.phone}
                      </td>
                      <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                        {teacher.email}
                      </td>
                      <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                        {teacher.class_room}
                      </td>
                      <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                        {teacher.section}
                      </td>
                      <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                        {teacher.dob}
                      </td>
                      <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                        {teacher.dob ? getAge(teacher.dob) : ''}
                      </td>
                      <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                        {teacher.gender}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="bg-white">
                    <td colSpan={12} className="text-center p-2 text-red-500">
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
            > Close </button>
            <button
              type="button"
              onClick={StudentDataConfirm}
              disabled={!transactionNo}
              className={`rounded-[5px] px-5 py-2 text-sm font-normal whitespace-nowrap shadow-xs bg-indigo-500 text-white 
    ${transactionNo ? ' hover:bg-indigo-400 cursor-pointer' : 'cursor-not-allowed'}
  `} > Confirm & Upload </button>
          </div>
        </div>
      </div>
      {loading ? <Spinner status={loading} /> : ''}
    </>
  );
};

export default BulkImport;
