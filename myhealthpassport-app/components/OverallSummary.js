'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { screeningOverallSummary, mhbWellnessScore } from '@/services/secureApis';
import InlineSpinner from './UI/InlineSpinner';
import { useParams, useRouter } from 'next/navigation';
import { stringToArray } from '@/helpers/utilities';

const OverallSummary = ({ academicYear = null }) => {
  const { id, studentId } = useParams();
  const router = useRouter();
  const recordId = id || studentId;
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mhbScore, setMhbScore] = useState(null);

  useEffect(() => {
    screeningOverallSummary(recordId, academicYear)
      .then(res => {
        const response = JSON.parse(res);
        setResults(response);
      })
      .catch(error => {
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });

    // Fetch MHB nutrition wellness score (non-blocking)
    mhbWellnessScore(recordId)
      .then(res => {
        const response = typeof res === 'string' ? JSON.parse(res) : res;
        if (response?.status === true && response?.data) {
          setMhbScore(response.data);
        }
      })
      .catch(() => {
        // MHB integration is optional — silently fail
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

          {/* ── MHB AI Nutrition Score ────────────────────── */}
          {mhbScore && (
            <div className="mt-3 rounded-[8px] border border-[#E0E7FF] bg-[#F8FAFF] p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex items-center justify-center w-[48px] h-[48px] rounded-full text-white font-bold text-[16px] ${
                  mhbScore.traffic_light === 'green' ? 'bg-[#16A34A]' :
                  mhbScore.traffic_light === 'amber' ? 'bg-[#F59E0B]' :
                  mhbScore.traffic_light === 'red' ? 'bg-[#DC2626]' : 'bg-[#9CA3AF]'
                }`}>
                  {mhbScore.score}
                </div>
                <div>
                  <p className="font-semibold text-[14px] leading-[18px] text-[#1E293B]">
                    AI Nutrition Wellness Score
                  </p>
                  <p className="font-normal text-[12px] leading-[16px] text-[#64748B]">
                    Based on {mhbScore.meals_analysed || 0} meal{mhbScore.meals_analysed !== 1 ? 's' : ''} analysed
                    {mhbScore.confidence ? ` · ${mhbScore.confidence} confidence` : ''}
                  </p>
                </div>
              </div>
              <p className="font-normal text-[11px] text-[#94A3B8]">
                Powered by My Health Buddy · AI-powered meal analysis
              </p>

              {/* Talk to Priya CTA */}
              <div className="mt-3 pt-3 border-t border-[#E0E7FF]">
                <button
                  onClick={() => router.push(`/parent/nutrition/${recordId}/talk-to-priya`)}
                  className="w-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1D4ED8] hover:to-[#6D28D9] text-white font-semibold text-[13px] py-2.5 rounded-[8px] transition flex items-center justify-center gap-2"
                >
                  <span>🎙️</span> Talk to Priya — AI Nutrition Companion
                </button>
              </div>
            </div>
          )}
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
    <div className="w-full py-8">
      <div className="text-gray-500 text-center text-md font-medium mb-6">
        {results?.message || 'Screening or summary data not available for the student'}
      </div>

      {/* ── MHB AI Nutrition Score (shown even without screening data) ── */}
      {mhbScore && (
        <div className="max-w-xl mx-auto rounded-[10px] border border-[#BDD2FF] bg-white p-7">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Score Circle */}
            <div className={`flex items-center justify-center w-[72px] h-[72px] rounded-full text-white font-bold text-[24px] shrink-0 ${
              mhbScore.traffic_light === 'green' ? 'bg-[#16A34A]' :
              mhbScore.traffic_light === 'amber' ? 'bg-[#F59E0B]' :
              mhbScore.traffic_light === 'red' ? 'bg-[#DC2626]' : 'bg-[#9CA3AF]'
            }`}>
              {mhbScore.score}
            </div>

            {/* Details */}
            <div className="flex-1 text-center md:text-left">
              <p className="font-semibold text-[16px] leading-[22px] text-[#1E293B] mb-1">
                AI Nutrition Wellness Score
              </p>
              <p className="font-normal text-[13px] leading-[18px] text-[#64748B] mb-2">
                Based on {mhbScore.meals_analysed || 0} meal{mhbScore.meals_analysed !== 1 ? 's' : ''} analysed
                {mhbScore.confidence ? ` · ${mhbScore.confidence} confidence` : ''}
              </p>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <div className={`w-2 h-2 rounded-full ${
                  mhbScore.traffic_light === 'green' ? 'bg-[#16A34A]' :
                  mhbScore.traffic_light === 'amber' ? 'bg-[#F59E0B]' :
                  mhbScore.traffic_light === 'red' ? 'bg-[#DC2626]' : 'bg-[#9CA3AF]'
                }`} />
                <span className="text-[12px] font-medium text-[#64748B] capitalize">
                  {mhbScore.traffic_light === 'green' ? 'Good nutrition habits' :
                   mhbScore.traffic_light === 'amber' ? 'Needs improvement' :
                   mhbScore.traffic_light === 'red' ? 'Needs attention' : 'Not enough data'}
                </span>
              </div>
              <p className="font-normal text-[11px] text-[#94A3B8] mt-3">
                Powered by My Health Buddy · AI-powered meal analysis
              </p>
            </div>
          </div>

          {/* Talk to Priya CTA */}
          <div className="mt-5 pt-5 border-t border-[#E2E8F0]">
            <button
              onClick={() => router.push(`/parent/nutrition/${recordId}/talk-to-priya`)}
              className="w-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1D4ED8] hover:to-[#6D28D9] text-white font-semibold text-[14px] py-3 rounded-[8px] transition flex items-center justify-center gap-2 shadow-lg shadow-[#2563EB]/20"
            >
              <span>🎙️</span> Talk to Priya — AI Nutrition Companion
            </button>
            <p className="text-[11px] text-[#94A3B8] text-center mt-2">
              Log meals, get nutrition advice, plan your week — all by voice
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverallSummary;
