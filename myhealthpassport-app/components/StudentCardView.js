'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import nookies from 'nookies';
import { useParams } from 'next/navigation';
import { isValidUrl } from '@/helpers/utilities';

const StudentCardView = ({ student }) => {
  const cookies = nookies.get();
  const { schoolid, id } = useParams();
  const [role, setRole] = useState(null);
  const [root, setRoot] = useState('');
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (cookies.role && cookies.root !== 'undefined') {
      setRole(cookies.role);
      setRoot(cookies.root);
    }
  }, [cookies]);

  // Map root to base URLs
  const baseUrlMap = {
    'school-admin': `/school-admin/students/${student.id}`,
    screening: `/screening/roster/${schoolid}/student/${student.id}`,
    analyst: `/analyst/roster/${schoolid}/student/${student.id}`,
    teacher: `/teacher/students/${student.id}`,
    parent: `/parent/view/class/${id}`,
    onground: role !== 'CAMP_COORDINATOR' ? `/onground/roster/${schoolid}/student/${student.id}` : '#',
    expert: `/expert/patients/${student.id}`,
    admin: `/admin/schools/${schoolid}/student/${student.id}`,
    'health-buddy': `/health-buddy/roster/${schoolid}/student/${student.id}`,
  };
  // Get base URL for the current root
  const href = baseUrlMap[root] || '/';

  return (
    <Link key={student.id} href={`${href}`} passHref>
      <div className="m-3 flex flex-col gap-[20px] p-[15px] rounded-[10px] border border-[#DCDCDC] bg-white shadow-[0px_4px_4px_0px_#2537D733]">
        {/* Profile Image */}
        <div className="flex flex-col p-[20px] rounded-[10px] bg-[#F3F7FA]">
          <div className="flex flex-col gap-[26px] items-center">
            <Image
              src={!imgFailed && isValidUrl(student?.profile_image) ? student.profile_image : '/iconx/profile-image.svg'}
              alt="Profile"
              className="rounded-full border-2 border-gray-300 w-[102px] h-[102px]"
              width={102}
              height={102}
              onError={() => setImgFailed(true)}
            />
            {/* Name */}
            <h3 className="font-semibold text-[18px] leading-[100%] tracking-[0%] text-center mt-3">
              {student.first_name} {student.last_name}
            </h3>
          </div>
        </div>
        {/* Info Section */}
        {/* Info Section */}
        {root === 'teacher' || root === 'screening' || root === 'analyst' || root === 'onground' ? (
          <div className="grid grid-cols-3 justify-items-stretch gap-2 text-center text-sm">
            <div className="space-y-1">
              <h1 className="font-medium text-sm">{student.gender}</h1>
              <p className="text-xs font-normal mb-0">Gender</p>
            </div>
            <div className="space-y-1">
              <h1 className="font-medium text-sm">{student.age}</h1>
              <p className="text-xs font-normal mb-0">Age</p>
            </div>
            <div className="space-y-1 flex flex-col items-center">
              <Image alt="Active" src="/iconx/check-circle.svg" width={20} height={20} />
              <p className="text-xs font-normal mb-0">Questionnaire</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 justify-items-stretch gap-2 text-center text-sm">
            <div className="space-y-1">
              <h1 className="font-medium text-sm">{student.gender}</h1>
              <p className="text-xs font-normal mb-0">Gender</p>
            </div>
            <div className="space-y-1">
              <h1 className="font-medium text-sm">{student.bloodGroup || 'O+'}</h1>
              <p className="text-xs font-normal mb-0">Blood Group</p>
            </div>
            <div className="space-y-1">
              <h1 className="font-medium text-sm">{student.age}</h1>
              <p className="text-xs font-normal mb-0">Age</p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default StudentCardView;
