import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getDentalScreeningReport } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { useParams } from 'next/navigation';
import InlineSpinner from './UI/InlineSpinner';

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

export default function DentalScreening() {
  const { id, studentId } = useParams();
  const [existingReport, setExistingReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkedTeeth, setCheckedTeeth] = useState([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const recordId = id ? id : studentId ? studentId : null;
        const response = await getDentalScreeningReport(recordId);
        const responseData = await JSON.parse(response);
        if (responseData.status && responseData.data && responseData.data.dental_screening) {
          const dentalScreeningData = responseData.data.dental_screening;
          setExistingReport(dentalScreeningData);
          // Extract checked teeth from oral_examination
          const teeth = dentalScreeningData.oral_examination?.flatMap(exam => exam.tooth_numbers.toString()) || [];
          setCheckedTeeth(teeth);
        } else {
          setError(responseData.message || 'No screening report found.');
          // toastMessage(responseData.message || 'No screening report found.', 'error');
        }
      } catch (err) {
        // console.error('Error in getDentalScreeningReport:', err);
        const errorMessage = err.message || 'An error occurred while fetching data.';
        setError(errorMessage);
        toastMessage(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="w-full mx-auto py-8">
        <InlineSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex justify-center items-center pt-8 pr-8 pb-8 pl-8">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!existingReport) {
    return (
      <div className="w-full flex justify-center items-center pt-8 pr-8 pb-8 pl-8">
        <p>No dental screening report available.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-10 pt-8 pr-8 pb-8 pl-8 rounded-bl-lg rounded-br-lg border-t-0 border-r border-b border-l border-solid border-[#DCDCDC]">
      <div className="flex flex-col gap-8">
        {/* Patient Concern Section */}
        <div className="w-full space-y-[11px]">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Patient Concern</h1>
            <p className="flex-1 font-normal text-[14px] leading-[24px] tracking-[0%]">
              {existingReport.patient_concern?.length > 0 ? existingReport.patient_concern.join(', ') : 'No concerns reported.'}
            </p>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Oral Examination Findings */}
        <div className="w-full space-y-[11px]">
          <div className="space-y-5">
            <div className="flex justify-between">
              <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Oral Examination Findings</h1>
              <div className="flex-1">
                {existingReport.oral_examination?.length > 0 ? (
                  <p className="font-Inter font-[600] text-sm leading-6 tracking-normal">
                    {existingReport.oral_examination.map((exam, index) => (
                      <span key={index}>
                        Tooth {exam.tooth_numbers.join(', ')}: <span className="font-normal">{exam.remarks}</span>
                        <br />
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="font-normal text-[14px] leading-[24px] tracking-[0%]">No oral examination findings reported.</p>
                )}
              </div>
            </div>
            <div className="space-y-18 px-10">
              {/* Upper Teeth */}
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
              {/* Lower Teeth */}
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
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>
      </div>

      {/* General Observations */}
      <div className="w-full space-y-[11px]">
        <div className="flex justify-between">
          <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">General Observations</h1>
          <div className="flex-1 font-normal text-[14px] leading-[24px] tracking-[0%]">
            <p className="font-Inter font-[600] text-sm leading-6 tracking-normal">
              Examination Note: <span className="font-normal">{existingReport.examination_note || 'No observations noted.'}</span>
            </p>
          </div>
        </div>
        <hr className="border-t border-[#B7B7B7]" />
      </div>

      {/* Diagnosis */}
      <div className="w-full space-y-[11px]">
        <div className="flex justify-between">
          <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Diagnosis</h1>
          <div className="flex-1">
            {existingReport.diagnosis?.length > 0 ? (
              existingReport.diagnosis.map((diag, index) => (
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
        <div className="flex justify-between">
          <div className="w-[35%]">
            <span className="bg-green-300 px-3 py-1 font-semibold text-[14px] leading-[100%] tracking-[0%] text-white">Recommendations</span>
          </div>
          <div className="flex-1">
            {existingReport.treatment_recommendations?.length > 0 ? (
              existingReport.treatment_recommendations.map((rec, index) => (
                <div key={index} className="flex items-start mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#363AF5" className="size-4 mr-2">
                    <path
                      fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{rec}</span>
                </div>
              ))
            ) : (
              <p className="font-normal text-[14px] leading-[24px] tracking-[0%]">No recommendations provided.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
