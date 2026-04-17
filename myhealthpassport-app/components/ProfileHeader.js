'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import BreadcrumbsProfile from './BreadcrumbsProfile';
import Link from 'next/link';
import nookies from 'nookies';
import { isValidUrl } from '@/helpers/utilities';

const ProfileHeader = ({ details }) => {
  const cookies = nookies.get();
  const [root, setRoot] = useState('');
  const [profile, setProfile] = useState({});

  useEffect(() => {
    if (cookies.root && cookies.root !== 'undefined') {
      setRoot(cookies.root);
    }
    if (details?.status === true) {
      setProfile(details.data || '');
    }
  }, [cookies]);

  const baseUrlMap = {
    admin: `/admin/expert/${profile.id}`,
    expert: `/expert/${profile.id}`
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
                src={isValidUrl(profile.profile_image_url) ? profile.profile_image_url : '/iconx/profile-image.svg'}
                className="size-16 sm:size-20 md:size-24 rounded-full mx-auto sm:mx-0"
                width={102}
                height={102}
                unoptimized={isValidUrl(profile.profile_image_url)}
              />
              {/* Name and breadcrumbs */}
              <div className="flex flex-col gap-y-1.5 text-center sm:text-left w-full">
                <span className="text-sm sm:text-base font-semibold tracking-tight text-gray-900">{`${profile?.first_name} ${profile?.middle_name} ${profile?.last_name}`}</span>
                <BreadcrumbsProfile profile={profile} />
              </div>
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
