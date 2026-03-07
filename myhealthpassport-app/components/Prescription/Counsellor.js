import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getPsychologistPrescription } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { useParams } from 'next/navigation';
import InlineSpinner from '@/components/UI/InlineSpinner';

const Counsellor = ({ academicYear = null }) => {
  const { id } = useParams();

  // State Management
  const [psychologistData, setPsychologistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API
  useEffect(() => {
    const fetchPsychologistData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getPsychologistPrescription(id, academicYear);
        const responseData = JSON.parse(response);

        if (responseData.status === true && responseData.data) {
          setPsychologistData(responseData.data);
        } else {
          setError(responseData.message || 'Failed to fetch psychologist data');
          // toastMessage('Failed to fetch psychologist data', 'error');
        }
      } catch (err) {
        // console.error('Fetch Error:', err);
        setError(err.message || 'An error occurred while fetching data');
        // toastMessage('An error occurred while fetching data', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPsychologistData();
    }
  }, [id, academicYear]);

  // Loading state
  if (loading) {
    return <InlineSpinner />;
  }

  // Error state
  if (error) {
    return (
      <div className="w-full pt-[35px] pr-[34px] pb-[60px] pl-[34px] flex justify-center items-center">
        <div className="text-center text-red-500">
          <p className="text-gray-500 text-sm font-medium"> {error}</p>
          {/* <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Retry
          </button> */}
        </div>
      </div>
    );
  }

  // No data state
  if (!psychologistData) {
    return (
      <div className="w-full pt-[35px] pr-[34px] pb-[60px] pl-[34px] flex justify-center items-center">
        <div className="text-center text-gray-500">
          <p>No psychologist data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-10 pt-8 pr-8 pb-8 pl-8 rounded-bl-lg rounded-br-lg border-t-0 border-r border-b border-l border-solid border-[#DCDCDC]">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="w-full space-y-[11px]">
          <div className="flex justify-between">
            <div className="flex left">
              <Image src="/iconx/school.svg" alt="school logo" width={36} height={36} className="flex-col" />
              <span className="leading-[24px] p-4 flex-col font-semibold text-[14px]">{psychologistData.clinic_name || 'Psychology Clinic'}</span>
            </div>
            <div className="flex right">
              <Image src="/iconx/profile-image.svg" alt="student profile" width={36} height={36} className="size-10 sm:size-12 md:size-14 rounded-full" />
              <div className="flex-col p-2">
                <span className="leading-[10px] font-semibold text-[14px]">{psychologistData?.full_name || 'Student Name'}</span>
                <br />
                <span className="leading-[10px] text-[14px]">
                  {psychologistData?.age || 'Age'} | {psychologistData?.gender || 'Gender'}
                </span>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Patient Concern Section */}
        <div className="w-full space-y-[11px]">
          <div className="flex pb-[11px] justify-between">
            <label className="block text-sm/6 font-semibold text-gray-900 w-[40%]">Patient Concern</label>
            <div className="w-[60%] flex flex-col gap-2">
              {psychologistData.patient_concern && psychologistData.patient_concern.length > 0 ? (
                psychologistData.patient_concern.map((concern, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-4 h-4 flex-shrink-0 text-blue-500">
                      <Image src="/health-records/check.svg" width={18} height={18} alt="Check" className="w-full h-full object-contain" />
                    </div>
                    <p className="m-0 font-normal text-sm leading-6">
                      <span className="font-medium">{concern}</span>
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 flex-shrink-0 text-gray-400">
                    <Image src="/health-records/check.svg" width={18} height={18} alt="Check" className="w-full h-full object-contain opacity-50" />
                  </div>
                  <p className="m-0 font-normal text-sm leading-6 text-gray-500">No patient concerns recorded</p>
                </div>
              )}
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Findings Section */}
        <div className="w-full space-y-[11px]">
          <div className="flex pb-[11px] justify-between">
            <label className="block text-sm/6 font-semibold text-gray-900 w-[40%]">Findings</label>
            <div className="w-[60%] flex flex-col gap-4">
              {psychologistData.findings && psychologistData.findings.length > 0 ? (
                psychologistData.findings.map((finding, index) => {
                  // Split finding if it contains ": " to separate main finding from remarks
                  const parts = finding.split(': ');
                  const mainFinding = parts[0];
                  const remarks = parts.slice(1).join(': '); // In case there are multiple colons

                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF] mt-1.5 flex-shrink-0"></div>
                      <p className="mb-0 font-normal text-sm leading-6">
                        {remarks ? (
                          <>
                            <span className="font-medium">{mainFinding}:</span> {remarks}
                          </>
                        ) : (
                          <span className="font-medium">{mainFinding}</span>
                        )}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-start gap-3">
                  <div className="rounded-full w-[10px] h-[10px] bg-gray-400 mt-1.5 flex-shrink-0"></div>
                  <p className="mb-0 font-normal text-sm leading-6 text-gray-500">No findings recorded</p>
                </div>
              )}
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Recommendations Section */}
        <div className="w-full space-y-[11px]">
          <div className="flex pb-[11px] justify-between">
            <div className="w-[40%]">
              <span className="bg-[#88D993] px-3 py-1 font-semibold text-[14px] leading-[100%] tracking-[0%] text-white rounded">Recommendations</span>
            </div>
            <div className="w-[60%] flex flex-col gap-4">
              {psychologistData.treatment_recommendations && psychologistData.treatment_recommendations.length > 0 ? (
                psychologistData.treatment_recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#363AF5" className="size-5 flex-shrink-0">
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="mb-0 font-normal text-sm leading-6">{recommendation}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#9CA3AF" className="size-5 flex-shrink-0">
                    <path
                      fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="mb-0 font-normal text-sm leading-6 text-gray-500">No recommendations recorded</p>
                </div>
              )}
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Next Follow-Up Section */}
        <div className="w-full space-y-[11px]">
          <div className="flex pb-[11px] justify-between">
            <label className="block text-sm/6 font-semibold text-gray-900 w-[40%]">Next Follow-Up</label>
            <div className="w-[60%] flex flex-col gap-4">
              <p className="mb-0 font-normal text-sm leading-6">{psychologistData.next_followup || ''}</p>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Doctor Signature Section */}
        <div className="w-full space-y-[11px]">
          <div className="flex pb-[11px]">
            <div className="w-full">
              <div className="flex-col p-2 float-right">
                {/* <Image src="/iconx/signature.svg" width={100} height={100} alt="signature" /> */}
                <span className="leading-[24px] font-semibold text-[14px]">Dr. {psychologistData.consultant_full_name || 'Doctor Name'}</span>
                <br />
                <span className="leading-[24px] text-[14px]">
                  {psychologistData.education || 'MBBS'} | {psychologistData.specialty || 'Psychologist'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Counsellor;
