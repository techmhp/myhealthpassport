'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import 'react-circular-progressbar/dist/styles.css';
import Header from '@/components/Header';
import CircularProgress from '@/components/CircularProgress';
import { formatString, isValidUrl } from '@/helpers/utilities';
import { getProfile, teacherQuestionnaireStatus } from '@/services/secureApis';
import Spinner from '@/components/UI/Spinner';

export default function Home() {
  const [userInfo, setUserInfo] = useState({});
  const [reportOptions, setReportOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({});

  useEffect(() => {
    const base64_user = localStorage.getItem('user_info');
    if (base64_user) {
      const userJson = JSON.parse(atob(base64_user));
      setUserData(userJson);
    }
    getProfile()
      .then(res => {
        const response = JSON.parse(res);
        setUserInfo(response.data);
      })
      .catch(error => {
        // console.error('Error loading user info:', error);
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
    teacherQuestionnaireStatus()
      .then(res => {
        const response = JSON.parse(res);
        setReportOptions(response.data);
      })
      .catch(error => {
        // console.error('Error loading students info:', error);
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner status={loading} />;

  return (
    <div className="min-h-screen w-full flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 home background-container flex">
        {/* Full height container that ensures centering */}
        <div className="w-full flex items-center justify-center gap-10">
          <div className="p-10 gap-[26px] flex flex-col items-center border-r border-[#B3CBFF]">
            <Image
              alt="company logo"
              src={isValidUrl(userData.school_logo) ? userData.school_logo : '/brand-logos/school-logo.svg'}
              className="h-93px w-93px"
              width={93}
              height={93}
            />
            <div className="space-y-[10px]">
              <h1 className="font-inter font-semibold text-[20px] leading-[25px] tracking-[0%] text-center">
                Hi {formatString(`${userInfo.first_name} ${userInfo.last_name}`?.toLowerCase())}!
              </h1>
              <p className="font-inter font-normal text-[14px] leading-[100%] tracking-[0%] text-center">
                Teacher Class <strong>{`${userInfo.class_room}-${userInfo.section}`}</strong>
              </p>
            </div>
          </div>
          <div className="gap-5">
            <div className="flex">
              <CircularProgress percentage={reportOptions?.completed ? reportOptions?.completed : 0} />
              <div className="flex-column p-4">
                <h1 className="font-bold text-xl">
                  {reportOptions.answered_students}/{reportOptions.total_students}
                </h1>
                <p>Student Profiles Completed</p>
              </div>
            </div>
            <Link href={'/teacher/students'}>
              <div className="flex gap-[10px] px-[20px] py-[10px] rounded-[5px] bg-[#5465FF] items-center justify-center whitespace-nowrap">
                <div className="font-normal text-[14px] leading-[100%] tracking-[0%] text-white">Fill Questionnaries</div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#FFFFFF" className="size-5">
                  <path
                    fillRule="evenodd"
                    d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
