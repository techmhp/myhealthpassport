import { useState, useEffect } from 'react';
import Link from 'next/link';
import { screeningStatus } from '@/services/secureApis';
import InlineSpinner from '../UI/InlineSpinner';
import { toastMessage } from '@/helpers/utilities';

const Overview = () => {
  const [progress, setProgress] = useState(82);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState({});

  useEffect(() => {
    screeningStatus()
      .then(res => {
        const response = JSON.parse(res);
        if (response.status === true) {
          setResults(response.data);
        }
      })
      .catch(err => {
        console.log('err', err);
        toastMessage(err, 'error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Helper function to determine the correct URL based on currently_reporting
  const getRosterUrl = schoolScreening => {
    const { school_id, assignment_id, currently_reporting } = schoolScreening;
    const baseSchoolId = school_id || 1;
    const eventId = assignment_id || 0;

    // Check if currently_reporting contains a single class-section pattern (e.g., "Class 12A", "Class 1A")
    const singleClassPattern = /^Class\s+(\d+)([A-Z])$/i;
    const match = currently_reporting?.match(singleClassPattern);

    if (match) {
      // Single class and section found - redirect to specific class/section
      const classNumber = match[1];
      const section = match[2];
      return `roster/${baseSchoolId}/class/${classNumber}-${section}?eventid=${eventId}`;
    } else {
      // Multiple classes/sections or no specific pattern - use previous flow
      return `roster/${baseSchoolId}?eventid=${eventId}`;
    }
  };

  if (isLoading)
    return (
      <div className="w-full mx-auto py-8">
        <InlineSpinner />
      </div>
    );

  return (
    <div className="w-full flex flex-col justify-between gap-10">
      {/* <p className="font-medium text-sm">Todays Progress | International School of Hyderabad</p> */}
      <p className="font-medium text-sm">Today's Progress</p>
      {Object.keys(results).length > 0 && results?.schools.length > 0 ? (
        results.schools.map((schoolScreening, index) => (
          <div key={index} className="w-full flex gap-24 items-center">
            {/* Circular Progress Indicator */}
            <div className="flex gap-16 items-center">
              <div className="flex items-center gap-7">
                <div className="w-19 h-19">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background Circle */}
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#E6EFFF" strokeWidth="12" />
                    {/* Progress Circle - gap at the top right */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#5389FF"
                      strokeWidth="12"
                      strokeDasharray={`${2 * Math.PI * 40 * (parseInt(schoolScreening.completed) / 100)} ${2 * Math.PI * 40}`}
                      strokeLinecap="round"
                      transform="rotate(0 50 50)"
                    />
                  </svg>
                </div>
                <div className="flex flex-col gap-2.5">
                  <p className="font-semibold text-[20px] leading-[25px] tracking-[0px] text-[#5389FF] mb-0">{parseInt(schoolScreening.completed)}%</p>
                  <span className="font-normal text-[14px] leading-[100%] tracking-[0px]">Completed</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <p className="font-semibold text-[20px] leading-[25px] tracking-[0px] mb-0">
                  <span className="text-[#5389FF]">{schoolScreening.screened_classes}</span>/{schoolScreening.total_classes}
                </p>
                <span className="font-normal text-[14px] leading-[100%] tracking-[0px]">Classes</span>
              </div>
              <div className="flex flex-col gap-2.5">
                <p className="font-semibold text-[20px] leading-[25px] tracking-[0px] mb-0">
                  <span className="text-[#5389FF]">{schoolScreening.screened_students}</span>/{schoolScreening.total_students}
                </p>
                <span className="font-normal text-[14px] leading-[100%] tracking-[0px]">Students</span>
              </div>
              <div className="flex flex-col gap-2.5">
                <p className="font-semibold text-[20px] leading-[25px] tracking-[0px] mb-0">{schoolScreening.currently_reporting}</p>
                <span className="font-normal text-[14px] leading-[100%] tracking-[0px]">Currently Reporting</span>
              </div>
            </div>
            <Link href={getRosterUrl(schoolScreening)} className="px-[20px] py-[10px] bg-[#5465FF] rounded-[5px] flex items-center gap-2.5">
              <span className="text-sm font-normal text-white">See Roster</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="size-5">
                <path
                  fillRule="evenodd"
                  d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500 text-sm font-medium"> No data available for today progress</div>
      )}
    </div>
  );
};

export default Overview;
