'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import nookies from 'nookies';
import { formatFullName } from '@/helpers/utilities';

const ExpertCard = ({ expert, preferred }) => {
  const cookies = nookies.get();
  const { schoolid, studentId } = useParams();
  const [root, setRoot] = useState('');

  useEffect(() => {
    if (cookies.root && cookies.root !== 'undefined') {
      setRoot(cookies.root);
    }
  }, [cookies]);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const baseUrlMap = {
    admin: `/admin/experts/${expert.expert_id}`,
    parent: `/parent/book/expert-consultation/expert/${expert.expert_id}`,
    analysiscrew: `/analysiscrew/roster/class/1/appointment/book`,
    'health-buddy': `/health-buddy/roster/${schoolid}/student/${studentId}/book-appointment/experts/${expert.expert_id}`,
  };

  const href = baseUrlMap[root] || '/';
  const router = useRouter();

  return (
    <Link href={href}>
      <div
        className={classNames(preferred ? 'border-[#5389FF]' : 'border-[#DCDCDC]', 'flex flex-col rounded-[10px] p-[15px] gap-[15px] border-2 cursor-pointer')}
      >
        <div className="rounded-[10px] p-[20px] gap-[10px] bg-[#F3F7FA]">
          <div className="flex gap-[26px] items-center">
            <Image
              src={expert.profile_image_url}
              alt="profile"
              className="size-12 sm:size-14 md:size-16 w-[52px] h-[52px] rounded-full"
              width={52}
              height={52}
            />
            <div className="flex flex-col gap-1">
              <div>
                <h1 className="font-inter font-semibold text-[14px] leading-[100%] tracking-[0%] text-gray-900">{formatFullName(expert)}</h1>
                {root !== 'parent' && <p className="font-inter font-normal text-[10px] leading-[100%] tracking-[0%]">{expert.username}</p>}
              </div>
              <p className="font-inter font-normal text-[10px] leading-[100%] tracking-[0%]">{expert.education}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <div className="flex flex-col gap-[5px]">
            <p className="font-inter font-normal text-[10px] leading-[100%] tracking-[0]">Location</p>
            <h1 className="font-inter font-medium text-[12px] leading-[100%] tracking-[0]"> {expert.location}</h1>
          </div>
          <div className="flex flex-col gap-[5px]">
            <p className="font-inter font-normal text-[10px] leading-[100%] tracking-[0]">Experience</p>
            <h1 className="font-inter font-medium text-[12px] leading-[100%] tracking-[0]">{expert.experience}</h1>
          </div>
          <div className="flex flex-col gap-[5px]">
            <p className="font-inter font-normal text-[10px] leading-[100%] tracking-[0]">Onboarding</p>
            <h1 className="font-inter font-medium text-[12px] leading-[100%] tracking-[0]">{expert.availability}</h1>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ExpertCard;
