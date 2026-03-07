import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getDentalPrescription } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { useParams } from 'next/navigation';
import InlineSpinner from '@/components/UI/InlineSpinner';

const Dentist = ({ academicYear = null }) => {
  const { id } = useParams();

  // State Management
  const [dentalData, setDentalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API
  useEffect(() => {
    const fetchDentalData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getDentalPrescription(id, academicYear);
        const responseData = JSON.parse(response);
        if (responseData.status === true && responseData.data) {
          setDentalData(responseData.data);
        } else {
          setError(responseData.message || 'Failed to fetch dental data');
          // toastMessage('Failed to fetch dental data', 'error');
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
      fetchDentalData();
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
  if (!dentalData) {
    return (
      <div className="w-full pt-[35px] pr-[34px] pb-[60px] pl-[34px] flex justify-center items-center">
        <div className="text-center text-gray-500">
          <p>No dental data found</p>
        </div>
      </div>
    );
  }

  // Dental chart data
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

  // Get checked teeth from oral examination
  const getCheckedTeeth = () => {
    if (!dentalData.oral_examination || dentalData.oral_examination.length === 0) {
      return [];
    }
    return dentalData.oral_examination.flatMap(exam => exam.tooth_numbers || []);
  };

  const checkedTeeth = getCheckedTeeth();

  return (
    <div className="w-full flex flex-col gap-10 pt-8 pr-8 pb-8 pl-8 rounded-bl-lg rounded-br-lg border-t-0 border-r border-b border-l border-solid border-[#DCDCDC]">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="w-full space-y-[11px]">
          <div className="flex justify-between">
            <div className="flex left">
              <Image src="/iconx/school.svg" alt="school logo" width={36} height={36} className="flex-col" />
              <span className="leading-[24px] p-4 flex-col font-semibold text-[14px]">{dentalData.clinic_name || 'Dental Clinic'}</span>
            </div>
            <div className="flex right">
              <Image src="/iconx/profile-image.svg" alt="doctor profile" width={36} height={36} className="size-10 sm:size-12 md:size-14 rounded-full" />
              <div className="flex-col p-2">
                <span className="leading-[10px] font-semibold text-[14px]">{dentalData?.full_name || 'Student Name'}</span>
                <br />
                <span className="leading-[10px] text-[14px]">
                  {dentalData?.age || 'Age'} | {dentalData?.gender || 'Gender'}
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
              {dentalData.patient_concern && dentalData.patient_concern.length > 0 ? (
                dentalData.patient_concern.map((concern, index) => (
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

        {/* Oral Examination Findings */}
        <div className="w-full space-y-[11px]">
          <div className="w-full pt-[30px] pb-[60px] flex flex-col gap-10">
            <div className="flex flex-col gap-10">
              <div className="w-full flex flex-col gap-5">
                <div className="flex justify-between">
                  <h1 className="w-[40%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Oral Examination Findings</h1>
                  <div className="flex-1 flex flex-col gap-7">
                    <div className="w-full flex items-center justify-between">
                      <div className="flex flex-col gap-1 items-start">
                        {dentalData.oral_examination && dentalData.oral_examination.length > 0 ? (
                          dentalData.oral_examination.map((exam, index) => (
                            <p key={index} className="mb-0 font-normal text-sm leading-6">
                              <span className="font-medium text-sm leading-6">Tooth {exam.tooth_numbers ? exam.tooth_numbers.join(', ') : 'Unknown'}:</span>{' '}
                              {exam.remarks || 'No remarks'}
                            </p>
                          ))
                        ) : (
                          <p className="mb-0 font-normal text-sm leading-6 text-gray-500">No oral examination findings recorded</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dental Chart */}
                <div className="space-y-18 px-10">
                  {/* Upper teeth */}
                  <div className="grid grid-cols-8 md:grid-cols-16 gap-1">
                    {upperTeeth.map(tooth => (
                      <div key={tooth.number} className="flex flex-col items-center gap-3">
                        <div className="w-11 h-24">
                          <Image src={tooth.image} alt={`tooth ${tooth.number}`} className="w-full h-full object-contain" height={96} width={44} />
                        </div>
                        <p className="text-sm font-medium leading-6 tracking-normal text-center mb-0">{tooth.number}</p>
                        <input type="checkbox" className="mt-1 w-4 h-4 border-2 border-[#526077]" checked={checkedTeeth.includes(tooth.number)} readOnly />
                      </div>
                    ))}
                  </div>

                  {/* Lower teeth */}
                  <div className="grid grid-cols-8 md:grid-cols-16 gap-1">
                    {lowerTeeth.map(tooth => (
                      <div key={tooth.number} className="flex flex-col items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 border-2 border-[#526077]" checked={checkedTeeth.includes(tooth.number)} readOnly />
                        <p className="text-sm font-medium leading-6 tracking-normal text-center mb-0">{tooth.number}</p>
                        <div className="w-11 h-24">
                          <Image src={tooth.image} alt={`tooth ${tooth.number}`} className="w-full h-full object-contain" height={96} width={44} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <hr className="border-t border-[#B7B7B7]" />
              </div>

              {/* Diagnosis */}
              <div className="w-full flex flex-col gap-5">
                <div className="flex justify-between">
                  <h1 className="w-[40%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Diagnosis</h1>
                  <div className="flex-1 flex flex-col gap-4">
                    {dentalData.diagnosis && dentalData.diagnosis.length > 0 ? (
                      dentalData.diagnosis.map((diagnosis, index) => {
                        // Split diagnosis if it contains ": " to separate condition from details
                        const [condition, details] = diagnosis.split(': ');
                        return (
                          <div key={index} className="flex items-start gap-3">
                            <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                            <p className="mb-2 font-normal text-sm leading-6">
                              <span className="font-medium">{condition}:</span> {details || 'No additional details'}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="rounded-full w-[10px] h-[10px] bg-gray-400 mt-1.5"></div>
                        <p className="mb-2 font-normal text-sm leading-6 text-gray-500">No diagnosis recorded</p>
                      </div>
                    )}
                  </div>
                </div>
                <hr className="border-t border-[#B7B7B7]" />
              </div>

              {/* Treatment Plan */}
              <div className="w-full flex flex-col gap-5">
                <div className="flex justify-between">
                  <div className="w-[40%]">
                    <span className="bg-[#88D993] px-3 py-1 font-semibold text-[14px] leading-[100%] tracking-[0%] text-white">Treatment Plan</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    {dentalData.treatment_recommendations && dentalData.treatment_recommendations.length > 0 ? (
                      dentalData.treatment_recommendations.map((treatment, index) => {
                        // Split treatment if it contains ": " to separate treatment from details
                        const [treatmentType, details] = treatment.split(': ');
                        return (
                          <div key={index} className="flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#363AF5" className="size-5">
                              <path
                                fillRule="evenodd"
                                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <p className="mb-2 font-normal text-sm leading-6">
                              <span className="font-medium">{treatmentType}:</span> {details || 'Treatment recommended'}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-start gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#9CA3AF" className="size-5">
                          <path
                            fillRule="evenodd"
                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="mb-2 font-normal text-sm leading-6 text-gray-500">No treatment recommendations recorded</p>
                      </div>
                    )}
                  </div>
                </div>
                <hr className="border-t border-[#B7B7B7]" />
              </div>

              {/* Next Follow-Up Section */}
              <div className="w-full flex flex-col gap-5">
                <div className="flex justify-between">
                  <h1 className="w-[40%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Next Follow-Up</h1>
                  <div className="flex-1 flex flex-col gap-4">
                    <p className="mb-2 font-normal text-sm leading-6">{dentalData.next_followup || ''}</p>
                  </div>
                </div>
                <hr className="border-t border-[#B7B7B7]" />
              </div>

              {/* Doctor Signature */}
              <div className="w-full space-y-[11px]">
                <div className="flex pb-[11px]">
                  <div className="w-full">
                    <div className="flex-col p-2 float-right">
                      {/* <Image src="/iconx/signature.svg" width={100} height={100} alt="signature" /> */}
                      <span className="leading-[24px] font-semibold text-[14px]">Dr. {dentalData.consultant_full_name || 'Doctor Name'}</span>
                      <br />
                      <span className="leading-[24px] text-[14px]">
                        {dentalData.education || 'MBBS'} | {dentalData.specialty || 'Dental Specialist'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dentist;
