import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import CommentsModal from '@/components/UI/CommentsModal';
import nookies from 'nookies'
import { updateMedicalReportStatus } from '@/services/secureApis';
import { stringToArray, toastMessage } from '@/helpers/utilities';
import { useParams, useRouter } from 'next/navigation';


const NutritionalAssessmentReport = ({ data, medical_data = {} }) => {

  const router = useRouter();
  const cookies = nookies.get();
  const results = data ? data : {}
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
        medical_officer_status_type: 'nutritional_report_status',
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

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'check':
        return (
          <div className="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#5389FF" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="flex-shrink-0">
            <Image src="/health-records/warning.svg" width={16} height={16} alt="Warning" className="w-4 h-4" />
          </div>
        );
      case 'star':
        return (
          <div className="flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M3.59627 1.07022C3.74572 0.710907 4.25473 0.710907 4.40418 1.07022L5.09817 2.73879L6.89954 2.88321C7.28745 2.91431 7.44474 3.3984 7.14919 3.65157L5.77675 4.82722L6.19605 6.58504C6.28635 6.96358 5.87455 7.26277 5.54244 7.05992L4.00022 6.11794L2.45801 7.05992C2.1259 7.26277 1.7141 6.96358 1.8044 6.58504L2.2237 4.82722L0.851255 3.65157C0.555708 3.3984 0.712999 2.91431 1.10091 2.88321L2.90227 2.73879L3.59627 1.07022Z" fill="#363AF5" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col gap-10 p-4 sm:p-6 md:p-8 rounded-bl-lg rounded-br-lg border-t-0 border-r border-b border-l border-solid border-gray-200">
      {Object.keys(results).length > 0 ?
        <div className="space-y-10">
          <div className="flex flex-col mt-5 md:flex-row rounded-[10px] border border-white bg-[#FFF3E7] p-7">
            {/* Left container with fixed width */}
            <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
              <div>
                <Image src="/detailed-reports-icons/nutritional-screening-report-apple.svg" alt="nutritional" width={30} height={27} />
              </div>
              <p className="font-inter font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">Overall Summary</p>
            </div>

            {/* Divider with fixed position */}
            <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#FFBB70]"></div>

            {/* Right container with badges and content */}
            <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
              {/* Badges */}
              <div className="flex flex-wrap gap-[20px]">
                {results.common_status !== null ?
                  results.common_status === "need_attention" ?
                    <div className="flex items-center gap-1 rounded-full border border-[#DC2626] bg-[#FEF2F2] px-2 py-1">
                      <Image src="/health-records/alert.svg" alt={results.common_status} width={16} height={16} />
                      <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#DC2626]">Need Attention</span>
                    </div>
                    : results.common_status === "all_good" ?
                      <div className="flex items-center gap-1 rounded-full border border-[#4ADE80] bg-[#F0FDF4] px-2 py-1">
                        <Image src="/health-records/right-symbol.svg" alt={results.common_status} width={16} height={16} />
                        <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#16A34A]">All Good</span>
                      </div>
                      : results.common_status === 'need_monitoring' ?
                        <div className="flex items-center gap-1 rounded-full border border-[#FB923C] bg-[#FEF2F2] px-2 py-1">
                          <Image src="/health-records/warning.svg" alt={results.common_status} width={16} height={16} />
                          <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#CA8A04]">Need Monitoring</span>
                        </div>
                        : ''
                  : ''
                }
              </div>
              {/* Content */}
              <div className='leading-[26px]'>
                {results.common_summary ?
                  stringToArray(results.common_summary).map((item, index) => (
                    <p key={index} className="font-inter font-normal text-[14px] tracking-[0%] mb-2">{item}.</p>
                  ))
                  : "N/A"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-inter font-semibold text-[14px] sm:text-[16px] leading-[100%] tracking-[0%] text-[#5389FF]">A. Nutrition Questionnaire Analysis</span>
          </div>
          {results.nutritional_questionnaire_analysis && (
            <div className="space-y-5 sm:space-y-7.5">
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
                    {results.nutritional_questionnaire_analysis.strengths.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start sm:items-center justify-start gap-3">
                        <StatusIcon status='check' />
                        <div>
                          <span className="text-sm font-normal">{item}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <hr className="border-t border-[#B7B7B7]" />
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
                    {results.nutritional_questionnaire_analysis.needs_attention.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start sm:items-center justify-start gap-3">
                        <StatusIcon status='warning' />
                        <div>
                          <span className="text-sm font-normal">{item}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <hr className="border-t border-[#B7B7B7]" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="font-inter font-semibold text-[14px] sm:text-[16px] leading-[100%] tracking-[0%] text-[#5389FF]">B. Nutrition Screening Analysis</span>
          </div>
          {results.nutritional_screening_analysis && (
            <div className="space-y-5 sm:space-y-7.5">
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
                    {results.nutritional_screening_analysis.strengths.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start sm:items-center justify-start gap-3">
                        <StatusIcon status='check' />
                        <div>
                          <span className="text-sm font-normal">{item}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <hr className="border-t border-[#B7B7B7]" />
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
                    {results.nutritional_screening_analysis.needs_attention.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start sm:items-center justify-start gap-3">
                        <StatusIcon status='warning' />
                        <div>
                          <span className="text-sm font-normal">{item}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <hr className="border-t border-[#B7B7B7]" />
            </div>
          )}

          {results.recommendations && (
            <div className="space-y-5 sm:space-y-7.5">
              <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                <div className="sm:w-2/5 flex flex-col gap-3 sm:gap-5">
                  <div className="bg-[#88D993] w-fit pt-1 pl-2 pr-4 border border-white">
                    <h3 className="font-semibold text-sm text-gray-900 leading-10px text-white">Recommendations</h3>
                  </div>
                </div>
                <div className="w-full sm:w-3/5">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <StatusIcon status='star' />
                      <div>
                        <span className="text-sm font-normal">{results.recommendations}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <hr className="border-t border-[#B7B7B7]" />
            </div>
          )}
        </div>
        : <div className='text-center text-gray-500'>There is no nutritional assignment report.</div>
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
};

export default NutritionalAssessmentReport;
