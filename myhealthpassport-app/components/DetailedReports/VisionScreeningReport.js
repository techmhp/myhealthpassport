// components/VisionTestChart.jsx
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import CommentsModal from '@/components/UI/CommentsModal';
import nookies from 'nookies'
import { updateMedicalReportStatus } from '@/services/secureApis';
import { stringToArray, toastMessage } from '@/helpers/utilities';
import { useParams, useRouter } from 'next/navigation';


export default function VisionScreeningReport({ data, medical_data = {} }) {

  const router = useRouter();
  const cookies = nookies.get();
  const results = data ? data : {};
  const medicalResults = medical_data ? medical_data : {};
  const { schoolid, studentId } = useParams();
  const [userRole, setUserRole] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remarks, setRemarks] = useState(medicalResults?.remarks || '');

  useEffect(() => {
    setUserRole(cookies.role);
  }, []);

  // Medical Officer add remarks section start
  const handleModelOpenAction = () => {
    setIsModalOpen(true);
  };

  // Close the modal if cancelled
  const handleCancelAction = () => {
    setIsModalOpen(false);
  };

  const saveAndVerifyAction = async (e) => {
    e.preventDefault();
    const status = 'verified';
    updateMedicalReport(status);
  }

  const handleConfirmAction = async (e) => {
    const status = 'remarks';
    updateMedicalReport(status);
  }

  const updateMedicalReport = async (status) => {
    setIsSubmitting(true);

    const postObj = {
      student_id: parseInt(studentId),
      school_id: parseInt(schoolid),
      medical_screening_statuses: {
        medical_officer_status_type: 'vision_screening_status',
        status: status,
        remarks: status === 'remarks' ? remarks : '',
      }
    }
    try {
      const response = await updateMedicalReportStatus(JSON.stringify(postObj));
      // console.log(response);
      if (response.status === true) {
        toastMessage(response.message, 'success');
      } else if (response.status === false) {
        toastMessage(response.message, 'error');
      }
    } catch (err) {
      toastMessage(err.message || 'An error occurred while updating data', 'error');
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
      router.refresh();
    }
  };
  // Medical Officer add remarks section end

  return (
    <div className="w-full flex flex-col gap-5 sm:gap-8 lg:gap-10 p-4 sm:p-6 lg:pt-8 lg:pr-8 lg:pb-8 lg:pl-8 rounded-bl-lg rounded-br-lg border-t-0 border-r border-b border-l border-solid border-[#DCDCDC]">
      {Object.keys(results).length > 0 ?
        <>
          <div className="flex flex-col md:flex-row rounded-[10px] border border-white bg-[#E5FBFE] p-7">
            {/* Left container with fixed width */}
            <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
              <div>
                <svg width="30" height="30" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.25006 8.0121e-05C1.01632 8.0121e-05 8.04695e-05 1.01632 8.04695e-05 2.25006V3.75005C-0.00591948 4.16404 0.325824 4.50429 0.73982 4.51029C1.15382 4.51629 1.49407 4.1853 1.50007 3.77055V3.75005V2.25006C1.50007 1.82631 1.82631 1.50007 2.25006 1.50007H3.75005C4.16404 1.50607 4.50429 1.17432 4.51029 0.760327C4.51629 0.346331 4.1853 0.00608007 3.77055 8.0121e-05H3.75005H2.25006ZM14.25 8.0121e-05C13.836 -0.00591983 13.4957 0.325823 13.4897 0.73982C13.4837 1.15382 13.8147 1.49407 14.2294 1.50007H14.25H15.7499C16.1737 1.50007 16.4999 1.82631 16.4999 2.25006V3.75005C16.4939 4.16404 16.8257 4.50429 17.2397 4.51029C17.6537 4.51629 17.9939 4.1853 17.9999 3.77055V3.75005V2.25006C17.9999 1.01632 16.9837 8.0121e-05 15.7499 8.0121e-05H14.25ZM9.00147 3.74712C4.53901 3.74712 1.65218 8.57748 1.59968 8.66748C1.53218 8.76498 1.49421 8.87707 1.49421 8.99707C1.49421 9.09457 1.51641 9.19271 1.56891 9.28271H1.57624C1.58374 9.30521 4.00651 14.247 9.00147 14.247C13.9739 14.247 16.3894 9.35004 16.4194 9.29004C16.4269 9.29004 16.4267 9.28271 16.4267 9.28271C16.4792 9.19271 16.5087 9.09457 16.5087 8.99707C16.5087 8.87707 16.4708 8.76498 16.4033 8.66748C16.3733 8.62248 15.6394 7.39226 14.3569 6.17727C13.0744 4.95478 11.2289 3.74712 9.00147 3.74712ZM9.00147 5.32181C10.9364 5.32181 12.5039 6.96459 12.5039 8.99707C12.5039 11.0221 10.9364 12.6723 9.00147 12.6723C7.06648 12.6723 5.49905 11.0221 5.49905 8.99707C5.49905 6.96459 7.06648 5.32181 9.00147 5.32181ZM9 7.43996C8.17051 7.43996 7.49855 8.11191 7.49855 8.94141C7.49855 9.7709 8.17051 10.4429 9 10.4429C9.82949 10.4429 10.5015 9.7709 10.5015 8.94141C10.5015 8.11191 9.82949 7.43996 9 7.43996ZM0.738355 13.4897C0.324359 13.4965 -0.00591948 13.8367 8.04695e-05 14.25V15.7499C8.04695e-05 16.9837 1.01632 17.9999 2.25006 17.9999H3.75005C4.16404 18.0059 4.50429 17.6742 4.51029 17.2602C4.51629 16.8462 4.1853 16.5059 3.77055 16.4999H3.75005H2.25006C1.82631 16.4999 1.50007 16.1737 1.50007 15.7499V14.25C1.50607 13.836 1.17432 13.4957 0.760328 13.4897H0.738355ZM17.2382 13.4897C16.825 13.4965 16.4939 13.8367 16.4999 14.25V15.7499C16.4999 16.1737 16.1737 16.4999 15.7499 16.4999H14.25C13.836 16.4939 13.4957 16.8257 13.4897 17.2397C13.4837 17.6537 13.8154 17.9939 14.2294 17.9999H14.25H15.7499C16.9837 17.9999 17.9999 16.9837 17.9999 15.7499V14.25C18.0059 13.836 17.6742 13.4957 17.2602 13.4897H17.2382Z" fill="#0EE1FD" />
                </svg>

              </div>
              <p className="font-inter font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">Overall Summary</p>
            </div>

            {/* Divider with fixed position */}
            <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#0EE1FD]"></div>

            {/* Right container with badges and content */}
            <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
              {/* Badges */}
              <div className="flex flex-wrap gap-[20px]">
                {results.status !== null ?
                  results.status === "need_attention" ?
                    <div className="flex items-center gap-1 rounded-full border border-[#DC2626] bg-[#FEF2F2] px-2 py-1">
                      <Image src="/health-records/alert.svg" alt={results.status} width={16} height={16} />
                      <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#DC2626]">Need Attention</span>
                    </div>
                    : results.status === "all_good" ?
                      <div className="flex items-center gap-1 rounded-full border border-[#4ADE80] bg-[#F0FDF4] px-2 py-1">
                        <Image src="/health-records/right-symbol.svg" alt={results.status} width={16} height={16} />
                        <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#16A34A]">All Good</span>
                      </div>
                      : results.status === 'need_monitoring' ?
                        <div className="flex items-center gap-1 rounded-full border border-[#FB923C] bg-[#FEF2F2] px-2 py-1">
                          <Image src="/health-records/warning.svg" alt={results.status} width={16} height={16} />
                          <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#CA8A04]">Need Monitoring</span>
                        </div>
                        : ''
                  : ''
                }
              </div>
              {/* Content */}
              <div className='leading-[26px]'>
                {results.report_summary ?
                  stringToArray(results.report_summary).map((item, index) => (
                    <p key={index} className="font-inter font-normal text-[14px] tracking-[0%] mb-2">{item}.</p>
                  ))
                  : "N/A"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
            {/* Patient Concern Section */}
            <div className="w-full space-y-4 sm:space-y-5 lg:space-y-[30px]">
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <h1 className="w-full sm:w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#000000] mb-2 sm:mb-0">Patient Concern</h1>
                <p className="flex-1 font-normal text-[14px] leading-[24px] tracking-[0%] text-[#000000]">
                  {results.patient_concern && results.patient_concern.length > 0
                    ? results.patient_concern.join(', ')
                    : 'No specific concerns reported'}
                </p>
              </div>
              <hr className="border-t border-[#B7B7B7]" />
            </div>

            {/* AR Test Results Section */}
            <div className="w-full flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 lg:mb-5">
              <div className="w-full sm:w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#000000] mb-3 sm:mb-0">AR Test Results</div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full border-collapse min-w-[400px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 py-2 sm:py-3 px-2 sm:px-4 font-normal text-xs sm:text-sm"></th>
                      <th className="border border-gray-300 py-2 sm:py-3 px-2 sm:px-4 font-normal text-xs sm:text-sm text-center">
                        <div>SPH</div>
                        <div>Spherical</div>
                      </th>
                      <th className="border border-gray-300 py-2 sm:py-3 px-2 sm:px-4 font-normal text-xs sm:text-sm text-center">
                        <div>CYL</div>
                        <div>Cyclical</div>
                      </th>
                      <th className="border border-gray-300 py-2 sm:py-3 px-2 sm:px-4 font-normal text-xs sm:text-sm text-center">Axis</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 py-4 sm:py-6 px-2 sm:px-4 font-normal text-xs sm:text-sm">Left Eye (OD)</td>
                      <td className="border border-gray-300 py-4 sm:py-6 px-2 sm:px-4 font-normal text-xs sm:text-sm text-center">
                        {results.vision_lefteye_res?.sph || '-'}
                      </td>
                      <td className="border border-gray-300 py-4 sm:py-6 px-2 sm:px-4 font-normal text-xs sm:text-sm text-center">
                        {results.vision_lefteye_res?.cyl || '-'}
                      </td>
                      <td className="border border-gray-300 py-4 sm:py-6 px-2 sm:px-4 font-normal text-xs sm:text-sm text-center">
                        {results.vision_lefteye_res?.axis || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 py-4 sm:py-6 px-2 sm:px-4 font-normal text-xs sm:text-sm">Right Eye (OS)</td>
                      <td className="border border-gray-300 py-4 sm:py-6 px-2 sm:px-4 font-normal text-xs sm:text-sm text-center">
                        {results.vision_righteye_res?.sph || '-'}
                      </td>
                      <td className="border border-gray-300 py-4 sm:py-6 px-2 sm:px-4 font-normal text-xs sm:text-sm text-center">
                        {results.vision_righteye_res?.cyl || '-'}
                      </td>
                      <td className="border border-gray-300 py-4 sm:py-6 px-2 sm:px-4 font-normal text-xs sm:text-sm text-center">
                        {results.vision_righteye_res?.axis || '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <hr className="border-t border-[#B7B7B7]" />

            {/* Recommendations Section */}
            <div className="w-full flex flex-col sm:flex-row sm:items-start">
              <div className="w-full sm:w-[35%] mb-3 sm:mb-0">
                <span className="bg-[#88D993] px-3 py-1 text-white font-semibold text-[14px]">Recommendations</span>
              </div>
              <div className="flex-1 font-normal text-[14px] leading-[24px] tracking-[0%] text-[#000000]">
                {results.recommendations && results.recommendations.length > 0 ? (
                  results.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#363AF5" className="size-4 sm:size-5 mt-1 mr-2 flex-shrink-0">
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-normal">{recommendation}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start">
                    <span className="font-normal">No recommendations provided.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Report Summary Section - Moved to last as requested */}
            {results.report_summary && (
              <>
                <hr className="border-t border-[#B7B7B7]" />
                <div className="w-full space-y-4 sm:space-y-5 lg:space-y-[30px]">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <h1 className="w-full sm:w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#000000] mb-2 sm:mb-0">Report Summary</h1>
                    <p className="flex-1 font-normal text-[14px] leading-[24px] tracking-[0%] text-[#000000]">{results.report_summary}</p>
                  </div>
                </div>
                <hr className="border-t border-[#B7B7B7]" />
              </>
            )}
          </div>
        </>
        : <div className='text-center text-gray-500'>There is no vision screening report.</div>
      }
      {remarks && (
        <div className="w-full space-y-5 sm:space-y-7.5 pl-5 py-5 bg-[#FFF3E5] rounded-[8px]">
          <div className='flex gap-5'>
            <h3 className="font-semibold text-sm text-gray-900">Medical Officer Remarks:</h3>
            <span className='text-red-500 text-sm font-normal'>{remarks}</span>
          </div>
        </div>
      )}
      {userRole === 'MEDICAL_OFFICER' ?
        <>
          <div className="mb-5 mt-5 flex justify-center items-center gap-5">
            <button
              type="button"
              onClick={handleModelOpenAction}
              className="font-normal cursor-pointer py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap disabled:opacity-50"
            >
              Add Remarks
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={saveAndVerifyAction}
              className="rounded-[5px] cursor-pointer bg-indigo-500 px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isSubmitting ? 'Submitting...' : 'Verify & Save'}
            </button>
          </div>
          <CommentsModal
            isOpen={isModalOpen}
            onClose={handleCancelAction} // Use cancel handler for closing from overlay/X button
            onConfirm={handleConfirmAction}
            title="Add Remarks"
            remarks={remarks}
            setRemarks={setRemarks}
            confirmText="Sumbit"
            cancelText="Close"
          />
        </>
        : ''}
    </div>
  );
}
