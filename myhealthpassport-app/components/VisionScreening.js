// components/VisionTestChart.jsx
import { useState, useEffect } from 'react';
import { getEyeScreeningReport } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { useParams } from 'next/navigation';
import InlineSpinner from './UI/InlineSpinner';


export default function VisionScreening() {
  const { id } = useParams();
  // console.log('studentId in VisionScreening:', id);
  const [existingReport, setExistingReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEyeScreeningReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getEyeScreeningReport(id);
        const responseData = await JSON.parse(response);
        // console.log('response eye screening report:', responseData);

        if (responseData.status && responseData.data && responseData.data.eye_screening) {
          const eyeScreeningData = responseData.data.eye_screening;
          setExistingReport(eyeScreeningData);
        } else {
          setError(responseData.message || 'No eye screening report found.');
          // toastMessage(responseData.message || 'No eye screening report found.', 'error');
        }
      } catch (err) {
        // console.error('error in getEyeScreeningReport:', err);
        const errorMessage = err.message || 'An error occurred while fetching data.';
        setError(errorMessage);
        toastMessage(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchEyeScreeningReport();
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full mx-auto py-8">
        <InlineSpinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full flex flex-col gap-5 sm:gap-8 lg:gap-10 p-4 sm:p-6 lg:pt-8 lg:pr-8 lg:pb-8 lg:pl-8 rounded-bl-lg rounded-br-lg border-t-0 border-r border-b border-l border-solid border-[#DCDCDC]">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-5 sm:gap-8 lg:gap-10 p-4 sm:p-6 lg:pt-8 lg:pr-8 lg:pb-8 lg:pl-8 rounded-bl-lg rounded-br-lg border-t-0 border-r border-b border-l border-solid border-[#DCDCDC]">
      <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
        {/* Patient Concern Section */}
        <div className="w-full space-y-4 sm:space-y-5 lg:space-y-[30px]">
          <div className="flex flex-col sm:flex-row sm:justify-between">
            <h1 className="w-full sm:w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#000000] mb-2 sm:mb-0">Patient Concern</h1>
            <p className="flex-1 font-normal text-[14px] leading-[24px] tracking-[0%] text-[#000000]">
              {existingReport.patient_concern && existingReport.patient_concern.length > 0
                ? existingReport.patient_concern.join(', ')
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
                    {existingReport.vision_lefteye_res?.sph || '-'}
                  </td>
                  <td className="border border-gray-300 py-4 sm:py-6 px-2 sm:px-4 font-normal text-xs sm:text-sm text-center">
                    {existingReport.vision_lefteye_res?.cyl || '-'}
                  </td>
                  <td className="border border-gray-300 py-4 sm:py-6 px-2 sm:px-4 font-normal text-xs sm:text-sm text-center">
                    {existingReport.vision_lefteye_res?.axis || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 py-4 sm:py-6 px-2 sm:px-4 font-normal text-xs sm:text-sm">Right Eye (OS)</td>
                  <td className="border border-gray-300 py-4 sm:py-6 px-2 sm:px-4 font-normal text-xs sm:text-sm text-center">
                    {existingReport.vision_righteye_res?.sph || '-'}
                  </td>
                  <td className="border border-gray-300 py-4 sm:py-6 px-2 sm:px-4 font-normal text-xs sm:text-sm text-center">
                    {existingReport.vision_righteye_res?.cyl || '-'}
                  </td>
                  <td className="border border-gray-300 py-4 sm:py-6 px-2 sm:px-4 font-normal text-xs sm:text-sm text-center">
                    {existingReport.vision_righteye_res?.axis || '-'}
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
            {existingReport.recommendations && existingReport.recommendations.length > 0 ? (
              existingReport.recommendations.map((recommendation, index) => (
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#363AF5" className="size-4 sm:size-5 mt-1 mr-2">
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-normal">
                  We recommend visiting an Ophthalmologist/ Eye Specialist for detailed investigations for further clinical correlation of the AR report
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Report Summary Section - Moved to last as requested */}
        {existingReport.report_summary && (
          <>
            <hr className="border-t border-[#B7B7B7]" />
            <div className="w-full space-y-4 sm:space-y-5 lg:space-y-[30px]">
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <h1 className="w-full sm:w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#000000] mb-2 sm:mb-0">Report Summary</h1>
                <p className="flex-1 font-normal text-[14px] leading-[24px] tracking-[0%] text-[#000000]">{existingReport.report_summary}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
