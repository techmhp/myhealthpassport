'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatString } from '@/helpers/utilities';

const StaffCardView = ({ user }) => {
  return (
    <Link href={`/admin/staff/${user.id}?role_type=${user.role_type}`}>
      <div className="flex flex-col rounded-[10px] p-[15px] gap-[15px] border-2 border-[#DCDCDC] cursor-pointer hover:border-[#5389FF]">
        <div className="rounded-[10px] p-[20px] gap-[10px] bg-[#F3F7FA]">
          <div className="flex gap-[26px] items-center">
            <Image
              src={user.profile_image ? user.profile_image : '/iconx/profile-image.svg'}
              alt="profile"
              className="size-12 sm:size-14 md:size-16 w-[52px] h-[52px] rounded-full"
              width={52}
              height={52}
            />
            <div className="flex flex-col gap-2">
              <h1 className="font-inter font-semibold text-[14px] leading-[100%] tracking-[0%] text-gray-900">
                {`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Staff Member'}
              </h1>
              <p className="font-inter font-normal text-[10px] leading-[100%] tracking-[0%]">{formatString(user.user_role)}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <div className="flex flex-col gap-[5px]">
            <p className="font-inter font-normal text-[10px] leading-[100%] tracking-[0]">Location</p>
            <h1 className="font-inter font-medium text-[12px] leading-[100%] tracking-[0]"> {user.location || 'NA'}</h1>
          </div>
          <div className="flex flex-col gap-[5px]">
            <p className="font-inter font-normal text-[10px] leading-[100%] tracking-[0]">Experience</p>
            <h1 className="font-inter font-medium text-[12px] leading-[100%] tracking-[0]">{user.experience || 'NA'}</h1>
          </div>
          <div className="flex flex-col gap-[5px]">
            <p className="font-inter font-normal text-[10px] leading-[100%] tracking-[0]">Assignment Status</p>
            {/* <h1 className="font-inter font-medium text-[12px] leading-[100%] tracking-[0]">{user.is_completed || 'NA'}</h1> */}
            {user?.is_completed == true ? (
              <Image alt="Active" src="/iconx/check-circle.svg" width={20} height={20} />
            ) : (
              <Image alt="Inactive" src="/iconx/minus-circle.svg" width={20} height={20} />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default StaffCardView;
