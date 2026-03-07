'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import Header from '@/components/Header';
import { getProfile, studentListByClassAndSection, schoolDetails } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import Spinner from '@/components/UI/Spinner';
import SchoolClassRoomStudentsList from '@/components/SchoolClassRoomStudentsList';

const Accounts = () => {
  const [school_info, setSchoolProfile] = useState({});
  const [teacher_info, setTeacherProfile] = useState({});
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function GetDetails() {
      try {
        const base64User = localStorage.getItem('user_info');
        if (!base64User || base64User === 'undefined') {
          toastMessage('Invalid school login found', 'error');
          return;
        }
        const user_info = JSON.parse(atob(base64User));
        const GetProfile = await getProfile();
        const GetProfileResults = JSON.parse(GetProfile);
        const fetchSchoolDetails = await schoolDetails(user_info.school_id);
        const GetSchoolDetailsResults = await JSON.parse(fetchSchoolDetails);
        if (GetSchoolDetailsResults.status === true) {
          setSchoolProfile(GetSchoolDetailsResults.data.school);
        }

        if (GetProfileResults.status === true) {
          setTeacherProfile(GetProfileResults.data);
          const fetchStudentsDetails = await studentListByClassAndSection(user_info.school_id, GetProfileResults.data.class_room, GetProfileResults.data.section, '');
          const studentsResults = JSON.parse(fetchStudentsDetails);
          if (studentsResults.status === true) {
            setStudents(studentsResults.data.students_list);
          } else {
            toastMessage(studentsResults.message || 'Failed to fetch all students', 'error');
          }
        }
      } catch (err) {
        toastMessage(err || 'An error occurred while fetching data.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    GetDetails();
  }, []);

  if (isLoading) return (
    <Spinner status={isLoading} />
  )

  return (
    <>
      <Header />
      <div className="p-4 px-[80px]">
        <div className="">
          <Breadcrumbs
            items={[
              {
                name: 'All Students',
                href: '#',
                current: true,
              },
            ]}
            homeLabel="Accounts"
            homeHref="/teacher/accounts"
          />
        </div>
        <div className="w-full flex items-center justify-center pb-4">
          <div className="w-[80%] flex gap-[60px] items-center justify-center">
            <div className="w-full flex gap-5 items-center">
              <div className="flex flex-1 gap-[10px]">
                <div className="w-full grid grid-cols-1">
                  <input
                    id="search"
                    name="search"
                    type="search"
                    placeholder="search"
                    className="w-full col-start-1 row-start-1 block rounded-[5px] p-[10px] bg-white pr-3 text-base text-gray-900 outline-1 -outline-offset-1 border-[#B5CCFF] outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:pl-9 sm:text-sm/6"
                  />
                  <Image
                    alt="search"
                    src="/iconx/search.svg"
                    width={16}
                    height={16}
                    className="pointer-events-none col-start-1 row-start-1 ml-3 size-4 self-center text-gray-400 sm:size-4"
                  />
                </div>
              </div>
              <div>
                <Image alt="search" src="/iconx/bars-arrow-down.svg" width={24} height={24} className="size-5" />
              </div>
              <div>
                <Image alt="filter" src="/iconx/filter.svg" width={24} height={24} className="size-5" />
              </div>
              <div>
                <Link href="#" className="cursor-pointer">
                  <Image alt="download" src="/iconx/download.svg" width={24} height={24} className="size-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg pt-2">
          <SchoolClassRoomStudentsList school={school_info} students={students} page='accounts' />
        </div>
      </div>
    </>
  );
};
export default Accounts;
