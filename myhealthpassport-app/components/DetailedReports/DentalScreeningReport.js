import Image from 'next/image';
import { useState, useEffect } from 'react';
import CommentsModal from '@/components/UI/CommentsModal';
import nookies from 'nookies';
import { updateMedicalReportStatus } from '@/services/secureApis';
import { stringToArray, toastMessage } from '@/helpers/utilities';
import { useParams, useRouter } from 'next/navigation';

// Tooth data from Dentist component for consistency
const upperTeeth = [
  { number: '18', image: '/teeths/teeth-18.svg' },
  { number: '17', image: '/teeths/teeth-17.svg' },
  { number: '16', image: '/teeths/teeth-16.svg' },
  { number: '15', image: '/teeths/teeth-15.svg' },
  { number: '14', image: '/teeths/teeth-14.svg' },
  { number: '13', image: '/teeths/teeth-13.svg' },
  { number: '12', image: '/teeths/teeth-12.svg' },
  { number: '11', image: '/teeths/teeth-11.svg' },
  { number: '21', image: '/teeths/teeth-21.svg' },
  { number: '22', image: '/teeths/teeth-22.svg' },
  { number: '23', image: '/teeths/teeth-23.svg' },
  { number: '24', image: '/teeths/teeth-24.svg' },
  { number: '25', image: '/teeths/teeth-25.svg' },
  { number: '26', image: '/teeths/teeth-26.svg' },
  { number: '27', image: '/teeths/teeth-27.svg' },
  { number: '28', image: '/teeths/teeth-28.svg' },
];

const lowerTeeth = [
  { number: '48', image: '/teeths/teeth-48.svg' },
  { number: '47', image: '/teeths/teeth-47.svg' },
  { number: '46', image: '/teeths/teeth-46.svg' },
  { number: '45', image: '/teeths/teeth-45.svg' },
  { number: '44', image: '/teeths/teeth-44.svg' },
  { number: '43', image: '/teeths/teeth-43.svg' },
  { number: '42', image: '/teeths/teeth-42.svg' },
  { number: '41', image: '/teeths/teeth-41.svg' },
  { number: '31', image: '/teeths/teeth-31.svg' },
  { number: '32', image: '/teeths/teeth-32.svg' },
  { number: '33', image: '/teeths/teeth-33.svg' },
  { number: '34', image: '/teeths/teeth-34.svg' },
  { number: '35', image: '/teeths/teeth-35.svg' },
  { number: '36', image: '/teeths/teeth-36.svg' },
  { number: '37', image: '/teeths/teeth-37.svg' },
  { number: '38', image: '/teeths/teeth-38.svg' },
];

export default function DentalScreeningReport({ data, medical_data = {} }) {
  const router = useRouter();
  const cookies = nookies.get();
  const results = data ? data : {};
  const medicalResults = medical_data ? medical_data : {};
  const { schoolid, studentId } = useParams();
  const [checkedTeeth, setCheckedTeeth] = useState([]);
  const [userRole, setUserRole] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remarks, setRemarks] = useState(medicalResults?.remarks || '');

  useEffect(() => {
    setUserRole(cookies.role);
    if (Object.keys(results).length > 0) {
      const teeth = results.oral_examination?.flatMap(exam => exam.tooth_numbers.toString()) || [];
      setCheckedTeeth(teeth);
    }
  }, [results]);

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
        medical_officer_status_type: 'dental_screening_status',
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

  if (Object.keys(results).length === 0) {
    return (
      <div className="w-full flex justify-center items-center pt-8 pr-4 pb-8 pl-4 sm:pr-8 sm:pl-8 text-gray-500">
        <p>No dental screening report available.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 sm:gap-10 pt-4 pr-4 pb-4 pl-4 sm:pt-8 sm:pr-8 sm:pb-8 sm:pl-8 rounded-bl-lg rounded-br-lg border-t-0 border-r border-b border-l border-solid border-[#DCDCDC]">
      {/* Report Summary start */}
      <div className="flex flex-col lg:flex-row rounded-[10px] border border-white bg-[#E8F5FF] p-4 sm:p-7">
        {/* Left container with fixed width */}
        <div className="flex flex-col lg:w-[200px] items-start justify-center gap-[15px]">
          <div>
            <svg width="30" height="30" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.72727 0.5C3.88636 0.5 2.40155 1.2198 1.43342 2.30895C0.465284 3.3981 0 4.81818 0 6.22727C0 8.33758 0.377138 9.68142 0.783026 10.6634C1.18891 11.6453 1.5425 12.1973 1.64435 12.891V12.8926C1.78727 13.8642 1.97256 15.13 2.38263 16.2372C2.58767 16.7908 2.84619 17.3136 3.24716 17.7441C3.64813 18.1746 4.24503 18.5 4.90909 18.5C5.93992 18.5 6.77543 17.9383 7.24538 17.2456C7.71534 16.5528 7.9335 15.7587 8.12269 15.0211C8.31189 14.2835 8.47161 13.5899 8.65323 13.1818C8.74404 12.9778 8.83599 12.8575 8.88494 12.8143C8.9339 12.7711 8.91904 12.7727 9 12.7727C9.08096 12.7727 9.0661 12.7711 9.11506 12.8143C9.16402 12.8575 9.25596 12.9778 9.34677 13.1818C9.52839 13.5899 9.68811 14.2835 9.87731 15.0211C10.0665 15.7587 10.2847 16.5528 10.7546 17.2456C11.2246 17.9383 12.0601 18.5 13.0909 18.5C13.755 18.5 14.3519 18.1746 14.7528 17.7441C15.1538 17.3136 15.4123 16.7908 15.6174 16.2372C16.0274 15.13 16.2127 13.8642 16.3556 12.8926V12.891C16.4575 12.1973 16.8111 11.6453 17.217 10.6634C17.6229 9.68146 18 8.33758 18 6.22727C18 4.81818 17.5347 3.3981 16.5666 2.30895C15.5985 1.2198 14.1136 0.5 12.2727 0.5C10.9545 0.5 10.0284 0.721759 9.41229 0.968217C9.20078 1.05282 9.02935 1.14548 8.88015 1.23509C8.05059 0.815287 7.00739 0.5 5.72727 0.5ZM5.72727 2.13636C8.82406 2.13636 9.92844 4.18342 9.92844 4.18342C9.98236 4.27642 10.0541 4.35788 10.1395 4.42317C10.2249 4.48845 10.3223 4.53627 10.4262 4.56389C10.5301 4.59151 10.6384 4.5984 10.7449 4.58415C10.8515 4.56991 10.9542 4.53481 11.0472 4.48087C11.1402 4.42692 11.2216 4.35519 11.2869 4.26976C11.3521 4.18434 11.3999 4.08689 11.4275 3.983C11.4551 3.8791 11.4619 3.77079 11.4477 3.66424C11.4334 3.55769 11.3983 3.45501 11.3443 3.36204C11.3443 3.36204 11.048 2.89755 10.4606 2.3457C10.8817 2.23255 11.465 2.13636 12.2727 2.13636C13.7045 2.13636 14.6743 2.64384 15.3425 3.3956C16.0107 4.14736 16.3636 5.18182 16.3636 6.22727C16.3636 8.15142 16.0527 9.19796 15.7053 10.0385C15.3578 10.8791 14.8928 11.5817 14.7353 12.6545C14.5935 13.6184 14.4029 14.8054 14.0833 15.6683C13.9234 16.1 13.729 16.4412 13.5543 16.6287C13.3797 16.8162 13.2794 16.8636 13.0909 16.8636C12.5602 16.8636 12.3682 16.7094 12.1097 16.3283C11.8512 15.9472 11.6406 15.3095 11.4625 14.6152C11.2845 13.921 11.1388 13.1828 10.8425 12.517C10.6944 12.1842 10.5046 11.857 10.1985 11.587C9.9312 11.3512 9.55848 11.1911 9.16939 11.1523C9.11364 11.1411 9.05686 11.1358 9 11.1364C8.9426 11.1357 8.88529 11.141 8.82901 11.1523C8.44049 11.1914 8.06844 11.3515 7.80149 11.587C7.49537 11.857 7.30563 12.1842 7.15749 12.517C6.86122 13.1828 6.71553 13.921 6.53746 14.6152C6.3594 15.3095 6.14878 15.9472 5.89027 16.3283C5.63176 16.7094 5.43976 16.8636 4.90909 16.8636C4.7206 16.8636 4.62029 16.8162 4.44567 16.6287C4.27105 16.4412 4.0766 16.1 3.91673 15.6683C3.59715 14.8054 3.40653 13.6184 3.26474 12.6545V12.6529C3.10698 11.5811 2.64201 10.8786 2.29474 10.0385C1.94729 9.19796 1.63636 8.15142 1.63636 6.22727C1.63636 5.18182 1.98926 4.14736 2.65749 3.3956C3.32572 2.64384 4.29545 2.13636 5.72727 2.13636Z"
                fill="#78C5FF"
              />
            </svg>
          </div>
          <p className="font-inter font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">Overall Summary</p>
        </div>

        {/* Divider with fixed position */}
        <div className="w-full h-[1.5px] lg:h-auto lg:w-[1.5px] my-4 lg:my-0 bg-[#78C5FF]"></div>

        {/* Right container with badges and content */}
        <div className="flex flex-col gap-[15px] mt-4 lg:mt-0 lg:pl-6 lg:flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-[20px]">
            {results.status !== null ? (
              results.status === 'need_attention' ? (
                <div className="flex items-center gap-1 rounded-full border border-[#DC2626] bg-[#FEF2F2] px-2 py-1">
                  <Image src="/health-records/alert.svg" alt={results.status} width={16} height={16} />
                  <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#DC2626]">Need Attention</span>
                </div>
              ) : results.status === 'all_good' ? (
                <div className="flex items-center gap-1 rounded-full border border-[#4ADE80] bg-[#F0FDF4] px-2 py-1">
                  <Image src="/health-records/right-symbol.svg" alt={results.status} width={16} height={16} />
                  <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#16A34A]">All Good</span>
                </div>
              ) : results.status === 'need_monitoring' ? (
                <div className="flex items-center gap-1 rounded-full border border-[#FB923C] bg-[#FEF2F2] px-2 py-1">
                  <Image src="/health-records/warning.svg" alt={results.status} width={16} height={16} />
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
          <div className='leading-[26px]'>
            {results.report_summary ?
              stringToArray(results.report_summary).map((item, index) => (
                <p key={index} className="font-inter font-normal text-[14px] tracking-[0%] mb-2">{item}.</p>
              ))
              : "N/A"}
          </div>
        </div>
      </div>
      {/* Report Summary end */}

      <div className="flex flex-col gap-6 sm:gap-8">
        {/* Patient Concern Section */}
        <div className="w-full space-y-[11px]">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
            <h1 className="w-full sm:w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Patient Concern</h1>
            <p className="w-full sm:flex-1 font-normal text-[14px] leading-[24px] tracking-[0%]">
              {results.patient_concern?.length > 0 ? results.patient_concern.join(', ') : 'No concerns reported.'}
            </p>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Oral Examination Findings */}
        <div className="w-full space-y-[11px]">
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
              <h1 className="w-full sm:w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Oral Examination Findings</h1>
              <div className="w-full sm:flex-1">
                {results.oral_examination?.length > 0 ? (
                  <p className="font-Inter font-[600] text-sm leading-6 tracking-normal">
                    {results.oral_examination.map((exam, index) => (
                      <span key={index}>
                        Tooth {exam.tooth_numbers.join(', ')}: <span className="font-normal">{exam.remarks}</span>
                        <br />
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="font-normal text-[14px] leading-[24px] tracking-[0%] text-gray-500">No oral examination findings reported.</p>
                )}
              </div>
            </div>
            <div className="space-y-8 sm:space-y-18 px-2 sm:px-10">
              {/* Upper Teeth */}
              <div className="overflow-x-auto">
                <div className="grid grid-cols-16 gap-1 min-w-[800px] sm:min-w-0">
                  {upperTeeth.map(tooth => (
                    <div key={tooth.number} className="flex flex-col items-center gap-1 sm:gap-3">
                      <div className="w-8 h-16 sm:w-11 sm:h-24">
                        <Image src={tooth.image} alt={`tooth ${tooth.number}`} className="w-full h-full object-contain" height={96} width={44} />
                      </div>
                      <p className="text-xs sm:text-sm font-medium leading-4 sm:leading-6 tracking-normal text-center mb-0">{tooth.number}</p>
                      <input
                        type="checkbox"
                        className="mt-1 w-3 h-3 sm:w-4 sm:h-4 border-2 border-[#526077]"
                        checked={checkedTeeth.includes(tooth.number)}
                        readOnly
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* Lower Teeth */}
              <div className="overflow-x-auto">
                <div className="grid grid-cols-16 gap-1 min-w-[800px] sm:min-w-0">
                  {lowerTeeth.map(tooth => (
                    <div key={tooth.number} className="flex flex-col items-center gap-1 sm:gap-3">
                      <input
                        type="checkbox"
                        className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-[#526077]"
                        checked={checkedTeeth.includes(tooth.number)}
                        readOnly
                      />
                      <p className="text-xs sm:text-sm font-medium leading-4 sm:leading-6 tracking-normal text-center mb-0">{tooth.number}</p>
                      <div className="w-8 h-16 sm:w-11 sm:h-24">
                        <Image src={tooth.image} alt={`tooth ${tooth.number}`} className="w-full h-full object-contain" height={96} width={44} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>
      </div>

      {/* General Observations */}
      <div className="w-full space-y-[11px]">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
          <h1 className="w-full sm:w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">General Observations</h1>
          <div className="w-full sm:flex-1 font-normal text-[14px] leading-[24px] tracking-[0%]">
            <p className="font-Inter font-[600] text-sm leading-6 tracking-normal">
              Examination Note: <span className="font-normal">{results.examination_note || 'No observations noted.'}</span>
            </p>
          </div>
        </div>
        <hr className="border-t border-[#B7B7B7]" />
      </div>

      {/* Diagnosis */}
      <div className="w-full space-y-[11px]">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
          <h1 className="w-full sm:w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Diagnosis</h1>
          <div className="w-full sm:flex-1">
            {results.diagnosis?.length > 0 ? (
              results.diagnosis.map((diag, index) => (
                <p key={index} className="font-normal text-[14px] leading-[24px] tracking-[0%]">
                  {diag}
                </p>
              ))
            ) : (
              <p className="font-normal text-[14px] leading-[24px] tracking-[0%]">No diagnosis reported.</p>
            )}
          </div>
        </div>
        <hr className="border-t border-[#B7B7B7]" />
      </div>

      {/* Recommendations */}
      <div className="w-full space-y-[11px]">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
          <div className="w-full sm:w-[35%]">
            <span className="bg-green-300 px-3 py-1 font-semibold text-[14px] leading-[100%] tracking-[0%] text-white rounded">Recommendations</span>
          </div>
          <div className="w-full sm:flex-1">
            {results.treatment_recommendations?.length > 0 ? (
              results.treatment_recommendations.map((rec, index) => (
                <div key={index} className="flex items-start mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#363AF5" className="size-4 mr-2 mt-0.5 flex-shrink-0">
                    <path
                      fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-[14px] leading-[24px]">{rec}</span>
                </div>
              ))
            ) : (
              <p className="font-normal text-[14px] leading-[24px] tracking-[0%] text-gray-500">No recommendations provided.</p>
            )}
          </div>
        </div>
        <hr className="border-t border-[#B7B7B7]" />
      </div>
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
          <div className="mb-5 mt-5 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={handleModelOpenAction}
              className="w-full sm:w-auto font-normal cursor-pointer py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap disabled:opacity-50"
            >
              Add Remarks
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={saveAndVerifyAction}
              className="w-full sm:w-auto rounded-[5px] cursor-pointer bg-indigo-500 px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
