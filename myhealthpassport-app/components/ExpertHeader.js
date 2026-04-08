'use client';

import { formatFullName, isValidUrl } from '@/helpers/utilities';
import Image from 'next/image';

const ProfileHeader = ({ expertDetails }) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-x-2 sm:gap-x-4 md:gap-x-6">
        <Image alt="profile" src={isValidUrl(expertDetails?.profile_image_url) ? expertDetails?.profile_image_url : "/iconx/profile-image.svg"} className="size-12 sm:size-14 md:size-16 rounded-full" width={102} height={102} unoptimized={isValidUrl(expertDetails?.profile_image_url)} />
        <div className="flex flex-col gap-y-1.5 whitespace-nowrap">
          <span className="text-sm sm:text-base font-semibold tracking-tight text-gray-900">{formatFullName(expertDetails)}</span>
          <span className="text-xs font-[500] tracking-tight text-gray-900">{expertDetails?.education}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
