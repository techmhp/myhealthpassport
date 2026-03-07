'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import BreadcrumbsProfile from '../BreadcrumbsProfile';
import Link from 'next/link';
import nookies from 'nookies';
import { isValidUrl } from '@/helpers/utilities';

const ProfileHeader = ({ details, school }) => {
  const cookies = nookies.get();
  const [root, setRoot] = useState('');
  const [profile, setProfile] = useState({});

  const statuses = {
    registration_status: profile?.registration_status,
    dental_screening_status: profile?.dental_screening_status,
    eye_screening_status: profile?.eye_screening_status,
    behavioural_screening_status: profile?.behavioural_screening_status,
    nutrition_screening_status: profile?.nutrition_screening_status,
    smart_scale_status: profile?.smart_scale_status,
    nutrition_analysis_status: profile?.nutrition_analysis_status,
    psychological_analysis_status: profile?.psychological_analysis_status,
  };
  const allTrue = Object.values(statuses).every(Boolean);

  useEffect(() => {
    if (cookies.root && cookies.root !== 'undefined') {
      setRoot(cookies.root);
    }
    if (details.status === true) {
      setProfile(details.data.student_details || '');
    }
  }, [cookies]);

  const baseUrlMap = {
    parent: `/parent/home/children/${profile.id}`,
    admin: `/admin/roster/${school?.school_id}/student/${profile.id}/profile`,
    'school-admin': `/school-admin/students/${profile.id}/profile`,
    teacher: `/teacher/roster/student/${profile.id}`,
    screening: `/screening/roster/${school?.school_id}/student/${profile.id}/profile`,
    analyst: `/analyst/roster/${school?.school_id}/student/${profile.id}/profile`,
    expert: `/expert/patients/${profile.id}`,
  };

  const href = baseUrlMap[root] || '/';
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-full space-y-4 sm:space-y-6">
      <ul role="list" className="w-full space-y-4">
        {details?.status === true ? (
          <li className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-y-3 gap-x-4 md:gap-x-6 w-full">
              {/* Profile Image */}
              <Image
                alt="profile"
                src={isValidUrl(profile.image) ? profile.image : '/iconx/profile-image.svg'}
                className="size-16 sm:size-20 md:size-24 rounded-full mx-auto sm:mx-0"
                width={102}
                height={102}
              />
              {/* Name and breadcrumbs */}
              <div className="flex flex-col gap-y-1.5 text-center sm:text-left w-full">
                <span className="text-sm sm:text-base font-semibold tracking-tight text-gray-900">{`${profile.first_name} ${profile.middle_name} ${profile.last_name}`}</span>
                <BreadcrumbsProfile profile={profile} />
                {(pathname.startsWith('/parent/health-records') ||
                  (pathname.startsWith('/school-admin') && !pathname.includes('profile')) ||
                  pathname.startsWith('/admin')) && (
                  <Link href={href} className="font-medium text-xs sm:text-sm text-[#363AF5]">
                    View Full Profile
                  </Link>
                )}
              </div>

              {/* Partial Report Badge */}
              {(pathname.startsWith('/parent/health-records') ||
                (pathname.startsWith('/school-admin') && !pathname.includes('profile')) ||
                pathname.startsWith('/admin')) && (
                <div className="flex justify-center sm:justify-end sm:ml-auto w-full">
                  {allTrue === true ? (
                    <div className="flex items-center bg-[#F0FDF4] border border-[#4ADE80] gap-1 rounded-[6px] p-[4px] px-[8px]">
                      <img src="/health-records/right-symbol.svg" alt="Report Completed" className="w-4 h-4" />
                      <span className="font-normal text-xs leading-[22px] text-[#16A34A]">Report Completed</span>
                    </div>
                  ) : (
                    <div className="flex items-center bg-[#FEFCE8] border border-[#FB923C] gap-1 rounded-[6px] p-[4px] px-[8px]">
                      <img src="/iconx/warning-icon.svg" alt="Partial Report" className="w-4 h-4" />
                      <span className="font-normal text-xs leading-[22px] text-[#CA8A04]">Partial Report</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </li>
        ) : (
          ''
        )}
      </ul>
    </div>
  );
};

export default ProfileHeader;
