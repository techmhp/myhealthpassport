'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { screeningOverallSummary } from '@/services/secureApis';
import InlineSpinner from './UI/InlineSpinner';
import { useParams } from 'next/navigation';
import { stringToArray } from '@/helpers/utilities';

const OverallSummary = ({ academicYear = null }) => {
  const { id, studentId } = useParams();
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const recordId = id ? id : studentId ? studentId : 0;
    screeningOverallSummary(recordId, academicYear)
      .then(res => {
        const response = JSON.parse(res);
        setResults(response);
      })
      .catch(error => {
        // console.error('Error loading user info:', error);
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [academicYear]);

  // Function to render status icon
  const renderSummaryStatus = status => {
    if (status === 'all_good') {
      return (
        <div className="flex items-center gap-1 rounded-full border border-[#4ADE80] bg-[#F0FDF4] px-2 py-1">
          <Image src="/health-records/right-symbol.svg" alt={status} width={16} height={16} />
          <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#16A34A]">All Good</span>
        </div>
      );
    } else if (status === 'need_attention') {
      return (
        <div className="flex items-center gap-1 rounded-full border border-[#DC2626] bg-[#FEF2F2] px-2 py-1">
          <Image src="/health-records/alert.svg" alt={status} width={16} height={16} />
          <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#DC2626]">Need Attention</span>
        </div>
      );
    } else if (status === 'need_monitoring') {
      return (
        <div className="flex items-center gap-1 rounded-full border border-[#FB923C] bg-[#FEF2F2] px-2 py-1">
          <Image src="/health-records/warning.svg" alt={status} width={16} height={16} />
          <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#CA8A04]">Need Monitoring</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="w-full mx-auto py-8">
        <InlineSpinner />
      </div>
    );
  }

  return Object.keys(results).length > 0 && results?.status === true ? (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-col md:flex-row rounded-[10px] border border-[#BDD2FF] bg-white p-7">
        {/* Left container with fixed width */}
        <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
          <div>
            <Image src="/detailed-reports-icons/physical-screening.svg" alt="phy" width={30} height={27} />
          </div>
          <p className="font-inter font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">Physical Screening</p>
        </div>

        {/* Divider with fixed position */}
        <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#BDD2FF]"></div>

        {/* Right container with badges and content */}
        <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-[20px]">
            {results.data.physical_screening.status !== null ? renderSummaryStatus(results.data.physical_screening.status) : ''}
          </div>
          {/* Content */}
          <div className="leading-[26px]">
            {results.data.physical_screening.summary
              ? stringToArray(results.data.physical_screening.summary).map((item, index) => (
                  <p key={index} className="font-inter font-normal text-[14px] tracking-[0%] mb-2">
                    {item}.
                  </p>
                ))
              : 'N/A'}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row rounded-[10px] border border-[#BDD2FF] bg-white p-7">
        {/* Left container with fixed width */}
        <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
          <div>
            <Image src="/detailed-reports-icons/apple.svg" alt="nutrition" width={30} height={30} />
          </div>
          <p className="font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">Nutritional Report</p>
        </div>

        {/* Divider with fixed position */}
        <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#BDD2FF]"></div>

        {/* Right container with badges and content */}
        <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-[20px]">
            {results.data.nutritional_summary.status !== null ? renderSummaryStatus(results.data.nutritional_summary.status) : ''}
          </div>

          {/* Content */}
          <div className="leading-[26px]">
            {results.data.nutritional_summary.summary
              ? stringToArray(results.data.nutritional_summary.summary).map((item, index) => (
                  <p key={index} className="font-inter font-normal text-[14px] tracking-[0%] mb-2">
                    {item}.
                  </p>
                ))
              : 'N/A'}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row rounded-[10px] border border-[#BDD2FF] bg-white p-7">
        {/* Left container with fixed width */}
        <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
          <div>
            <Image src="/detailed-reports-icons/imoji-face.svg" alt="emotional" width={30} height={30} />
          </div>
          <p className="font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">
            Developmental & <br /> Emotional Assessment
          </p>
        </div>

        {/* Divider with fixed position */}
        <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#BDD2FF]"></div>

        {/* Right container with badges and content */}
        <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-[20px]">
            {results.data.emotional_developmental.status !== null ? renderSummaryStatus(results.data.emotional_developmental.status) : ''}
          </div>

          {/* Content */}
          <div className="leading-[26px]">
            {results.data.emotional_developmental.summary
              ? stringToArray(results.data.emotional_developmental.summary).map((item, index) => (
                  <p key={index} className="font-inter font-normal text-[14px] tracking-[0%] mb-2">
                    {item}.
                  </p>
                ))
              : 'N/A'}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row rounded-[10px] border border-[#BDD2FF] bg-white p-7">
        {/* Left container with fixed width */}
        <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
          <div>
            <Image src="/detailed-reports-icons/vision.svg" alt="vision" width={30} height={30} />
          </div>
          <p className="font-inter font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">Vision Screening</p>
        </div>

        {/* Divider with fixed position */}
        <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#BDD2FF]"></div>

        {/* Right container with badges and content */}
        <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-[20px]">
            {results.data.eye_screening.status !== null ? renderSummaryStatus(results.data.eye_screening.status) : ''}
          </div>

          {/* Content */}
          <div className="leading-[26px]">
            {results.data.eye_screening.summary
              ? stringToArray(results.data.eye_screening.summary).map((item, index) => (
                  <p key={index} className="font-inter font-normal text-[14px] tracking-[0%] mb-2">
                    {item}.
                  </p>
                ))
              : 'N/A'}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row rounded-[10px] border border-[#BDD2FF] bg-white p-7">
        {/* Left container with fixed width */}
        <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
          <div>
            <Image src="/detailed-reports-icons/teeth.svg" alt="dental" width={30} height={30} />
          </div>
          <p className="font-inter font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">Dental Screening</p>
        </div>

        {/* Divider with fixed position */}
        <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#BDD2FF]"></div>

        {/* Right container with badges and content */}
        <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-[20px]">
            {results.data.dental_screening.status !== null ? renderSummaryStatus(results.data.dental_screening.status) : ''}
          </div>

          {/* Content */}
          <div className="leading-[26px]">
            {results.data.dental_screening.summary
              ? stringToArray(results.data.dental_screening.summary).map((item, index) => (
                  <p key={index} className="font-inter font-normal text-[14px] tracking-[0%] mb-2">
                    {item}.
                  </p>
                ))
              : 'N/A'}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row rounded-[10px] border border-[#BDD2FF] bg-white p-7">
        {/* Left container with fixed width */}
        <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
          <div>
            <Image src="/detailed-reports-icons/microscope.svg" alt="lab" width={30} height={30} />
          </div>
          <p className="font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">Lab Reports</p>
        </div>

        {/* Divider with fixed position */}
        <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#BDD2FF]"></div>

        {/* Right container with badges and content */}
        <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-[20px]">
            {results.data?.lab_reports?.status !== null ? renderSummaryStatus(results.data?.lab_reports?.status) : ''}
          </div>

          {/* Content */}
          <div className="leading-[26px]">
            {results.data.lab_reports.summary
              ? stringToArray(results.data.lab_reports.summary).map((item, index) => (
                  <p key={index} className="font-inter font-normal text-[14px] tracking-[0%] mb-2">
                    {item}.
                  </p>
                ))
              : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="w-full py-8 items-center justify-center text-gray-500 text-center text-md font-medium">
      {results?.message || 'Screening or summary data not available for the student'}
    </div>
  );
};

export default OverallSummary;
