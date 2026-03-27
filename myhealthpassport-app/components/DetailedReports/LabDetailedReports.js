import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import CommentsModal from '@/components/UI/CommentsModal';
import nookies from 'nookies';
import { updateMedicalReportStatus } from '@/services/secureApis';
import { stringToArray, toastMessage } from '@/helpers/utilities';
import { useParams, useRouter } from 'next/navigation';

const LabDetailedReport = ({ data, medical_data = {} }) => {
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

  const saveAndVerifyAction = async e => {
    e.preventDefault();
    const status = 'verified';
    updateMedicalReport(status);
  };

  const handleConfirmAction = async e => {
    const status = 'remarks';
    updateMedicalReport(status);
  };

  const updateMedicalReport = async status => {
    setIsSubmitting(true);

    const postObj = {
      student_id: parseInt(studentId),
      school_id: parseInt(schoolid),
      medical_screening_statuses: {
        medical_officer_status_type: 'lab_report_status',
        status: status,
        remarks: status === 'remarks' ? remarks : '',
      },
    };
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

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'check':
        return (
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#5389FF" className="size-4.5">
              <path
                fillRule="evenodd"
                d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case 'warning':
        return <Image src="/health-records/warning.svg" alt="warning" width={16} height={16} />;
      case 'star':
        return (
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#88D993" className="size-4  mr-2">
              <path
                fillRule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 sm:gap-8 md:gap-10 pt-4 sm:pt-6 md:pt-8 px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 rounded-bl-lg rounded-br-lg border-t-0 border-r border-b border-l border-solid border-[#DCDCDC]">
      {Object.keys(results).length > 0 ? (
        <div className="space-y-10">
          <div className="flex flex-col mt-5 md:flex-row rounded-[10px] border border-white bg-[#EEFBF1] p-7">
            {/* Left container with fixed width */}
            <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
              <div>
                <svg width="30" height="27" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M10 0.5C9.38842 0.5 8.80189 0.737053 8.36944 1.15901C7.93699 1.58097 7.69404 2.15326 7.69404 2.75C7.69404 3.34674 7.93699 3.91903 8.36944 4.34099C8.80189 4.76295 9.38842 5 10 5C10.6116 5 11.1981 4.76295 11.6306 4.34099C12.063 3.91903 12.306 3.34674 12.306 2.75C12.306 2.15326 12.063 1.58097 11.6306 1.15901C11.1981 0.737053 10.6116 0.5 10 0.5ZM10 5L1.55532 4.98975C0.705962 4.989 0.0165526 5.65953 0.0150153 6.48828L2.57408e-06 14.7383C-0.00153473 15.5663 0.685713 16.2382 1.53431 16.2397L7.69404 16.2471V8.98291C7.69404 8.58016 7.25985 8.31662 6.88936 8.49512L3.42591 10.1709C3.04466 10.3569 2.58439 10.2052 2.39454 9.83545C2.20468 9.46495 2.35861 9.01435 2.73833 8.8291L6.86384 6.81641C7.29121 6.60791 7.76017 6.5 8.2375 6.5H11.7595C12.2376 6.5 12.7095 6.60937 13.1377 6.81787L17.2617 8.8291C17.6414 9.01435 17.7953 9.46495 17.6055 9.83545C17.4702 10.0972 17.1985 10.25 16.9164 10.25C16.8011 10.25 16.684 10.2241 16.5741 10.1709L13.1106 8.49658C12.7402 8.31808 12.306 8.58016 12.306 8.98291V16.2529L18.4447 16.2603C19.294 16.261 19.9834 15.5912 19.985 14.7632L20 6.51318C20.0015 5.68443 19.3143 5.011 18.4657 5.01025L10 5ZM12.306 16.2529L10.6155 16.2515L10.7191 17.7764C10.7468 18.1836 11.0936 18.5 11.5118 18.5C11.9499 18.5 12.306 18.1526 12.306 17.7251V16.2529ZM10.6155 16.2515L10.3828 12.8486C10.3682 12.6529 10.2022 12.5 10 12.5C9.79784 12.5 9.63101 12.6536 9.61718 12.8501L9.38448 16.2485L10.6155 16.2515ZM9.38448 16.2485L7.69404 16.2471V17.7251C7.69404 18.1526 8.05008 18.5 8.48822 18.5C8.90636 18.5 9.25322 18.1829 9.28089 17.7764L9.38448 16.2485Z"
                    fill="#97E6A6"
                  />
                </svg>
              </div>
              <p className="font-inter font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">Overall Summary</p>
            </div>

            {/* Divider with fixed position */}
            <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#97E6A6]"></div>

            {/* Right container with badges and content */}
            <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
              {/* Badges */}
              <div className="flex flex-wrap gap-[20px]">
                {results.lab_status !== null ? (
                  results.lab_status === 'need_attention' ? (
                    <div className="flex items-center gap-1 rounded-full border border-[#DC2626] bg-[#FEF2F2] px-2 py-1">
                      <Image src="/health-records/alert.svg" alt={results.lab_status} width={16} height={16} />
                      <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#DC2626]">Need Attention</span>
                    </div>
                  ) : results.lab_status === 'all_good' ? (
                    <div className="flex items-center gap-1 rounded-full border border-[#4ADE80] bg-[#F0FDF4] px-2 py-1">
                      <Image src="/health-records/right-symbol.svg" alt={results.lab_status} width={16} height={16} />
                      <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#16A34A]">All Good</span>
                    </div>
                  ) : results.lab_status === 'need_monitoring' ? (
                    <div className="flex items-center gap-1 rounded-full border border-[#FB923C] bg-[#FEF2F2] px-2 py-1">
                      <Image src="/health-records/warning.svg" alt={results.lab_status} width={16} height={16} />
                      <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#CA8A04]">Need Monitoring</span>
                    </div>
                  ) : (
                    ''
                  )
                ) : (
                  ''
                )}
              </div>
              {/* Content */}
              <div className="leading-[26px]">
                {results.lab_reports_summary
                  ? stringToArray(results.lab_reports_summary).map((item, index) => (
                      <p key={index} className="font-inter font-normal text-[14px] tracking-[0%] mb-2">
                        {item}.
                      </p>
                    ))
                  : 'N/A'}
              </div>
            </div>
          </div>
          <div className="space-y-5 sm:space-y-7.5">
            {Object.keys(results.strengths).length > 0 ? (
              <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                <div className="w-full sm:w-2/5 flex flex-col gap-3 sm:gap-5 m-5">
                  <div>
                    <Image src="/detailed-reports-icons/physical-screening-analysis.svg" alt="nutritional" width={22} height={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">Strengths</h3>
                  </div>
                </div>
                <div className="w-full sm:w-3/5">
                  <div className="flex flex-col gap-3">
                    {results.strengths.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start sm:items-center justify-start gap-3">
                        <StatusIcon status="check" />
                        <div>
                          <span className="text-sm font-normal">{item}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="test-center">N/A</div>
            )}
            <hr className="border-t border-[#B7B7B7]" />
            {Object.keys(results.needs_attention).length > 0 ? (
              <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                <div className="w-full sm:w-2/5 flex flex-col gap-3 sm:gap-5 m-5">
                  <div>
                    <Image src="/detailed-reports-icons/physical-screening-attantion.svg" alt="nutritional" width={22} height={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">Need Attention</h3>
                  </div>
                </div>
                <div className="w-full sm:w-3/5">
                  <div className="flex flex-col gap-3">
                    {results.needs_attention.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start sm:items-center justify-start gap-3">
                        <StatusIcon status="warning" />
                        <div>
                          <span className="text-sm font-normal">{item}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="test-center">N/A</div>
            )}
            <hr className="border-t border-[#B7B7B7]" />
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">There is no lab reports.</div>
      )}
      {remarks && (
        <div className="w-full space-y-5 sm:space-y-7.5 pl-5 py-5 bg-[#FFF3E5] rounded-[8px]">
          <div className="flex gap-5">
            <h3 className="font-semibold text-sm text-gray-900">Medical Officer Remarks:</h3>
            <span className="text-red-500 text-sm font-normal">{remarks}</span>
          </div>
        </div>
      )}
      {userRole === 'MEDICAL_OFFICER' ? (
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
      ) : (
        ''
      )}
    </div>
  );
};

export default LabDetailedReport;
