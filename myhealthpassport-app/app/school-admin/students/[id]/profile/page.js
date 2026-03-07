'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import Breadcrumbs from '@/components/Breadcrumbs';
import ProfileHeader from '@/components/Student/ProfileHeader';
import StudentProfileForm from '@/components/Student/StudentProfileForm';
import Header from '@/components/Header';
import { studentDetails } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';

function Profile() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/')[3];

  const tabs = [
    { name: 'Profile', href: '#', id: 'Profile' },
    {
      name: 'Nutritional Questionnaire',
      href: '#',
      id: 'Nutritional-Questionnaire',
    },
    {
      name: 'Behavioural Questionnaire',
      href: '#',
      id: 'Behavioural-Questionnaire',
    },
  ];

  const [activeTab, setActiveTab] = useState('Profile');
  const [student_details, setStudent_details] = useState({});

  useEffect(() => {
    studentDetails(id)
      .then(res => {
        const response = JSON.parse(res);
        if (response.status === true) {
          setStudent_details(response);
        }
      })
      .catch(err => {
        toastMessage(err, 'error');
      });
  }, []);

  return (
    <>
      <Header />
      <div className="p-4 sm:p-6 md:p-[26px] md:px-12 lg:px-18">
        <div className="px-2 sm:px-6 md:px-10 lg:px-14 grid gap-4 md:gap-8 lg:gap-13">
          <Breadcrumbs
            items={[
              {
                name: 'View All Students',
                href: '/school-admin/students',
              },
              {
                name: `${student_details?.data?.student_details.identity_details.class_room}${student_details?.data?.student_details.identity_details.section}`,
                href: `/school-admin/students/class/${student_details?.data?.student_details.identity_details.class_room}-${student_details?.data?.student_details.identity_details.section}`,
              },
              {
                name: `${student_details?.data?.student_details.first_name} ${student_details?.data?.student_details.last_name}`,
                href: `/school-admin/students/${student_details?.data?.student_details.id}`,
              },
              {
                name: 'View Full Profile',
                href: '#',
                current: true,
              },
            ]}
            homeLabel="Students"
            homeHref="/school-admin/students"
          />
          <div className="px-0 sm:px-1">
            <ProfileHeader details={student_details} />
          </div>
        </div>
        <div className="flex justify-center items-center mt-4 sm:mt-[22px]">
          <div className="w-full">
            <div className="relative flex items-center justify-center mb-[30px] sm:mb-[18px]">
              {/* Edit Icon - Absolutely positioned to the right */}
              {/* <div className="absolute right-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                  <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                </svg>
              </div> */}
            </div>
            <div className="bg-white rounded-lg">{student_details.status === true ? <StudentProfileForm details={student_details} /> : ''}</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
