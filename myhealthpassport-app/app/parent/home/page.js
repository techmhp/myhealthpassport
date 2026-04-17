'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { childrenList } from '@/services/secureApis';
import { isValidUrl } from '@/helpers/utilities';

export default function Home() {
  const [results, setResults] = useState({});

  useEffect(() => {
    childrenList()
      .then(res => {
        const response = JSON.parse(res);
        if (response.status === true) {
          setResults(response);
        }
      })
      .catch(err => {
        alert(err);
      });
  }, []);

  const defaultRoute = child => {
    if (child.nutrition_screening_status && child.behavioural_screening_status) {
      return `/parent/health-records/${child.student_id}`;
    }
    return `/parent/home/children/${child.student_id}`;
  };

  return (
    <>
      <div className="min-h-screen w-full flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 home background-container">
          <div className="flex flex-col justify-center items-center w-full mt-[80px]">
            <div className="mb-13 text-center flex flex-col gap-3">
              <h1 className="font-semibold text-[20px] leading-[25px] tracking-[0%]">Hi Parent!</h1>
              <p className="font-medium text-[14px] leading-[100%] tracking-[0%]">Select a Child to View Their Profile</p>
            </div>
            <div className={`grid grid-cols-1 gap-6 lg:grid-cols-${results?.data?.childrens.length > 4 ? 4 : results?.data?.childrens.length} mb-10`}>
              {results.status === true
                ? results.data.childrens.map((child, index) => (
                    <div key={index} className="rounded-[10px] border border-[#DCDCDC] bg-white shadow-[0px_4px_4px_0px_#2537D733] overflow-hidden">
                      <Link href={defaultRoute(child)} passHref>
                        <div className="flex flex-col gap-[20px] p-[15px]">
                          <div className="flex flex-col p-[20px] rounded-[10px] bg-[#F3F7FA]">
                            <div className="flex flex-col gap-[26px] items-center">
                              <Image
                                src={isValidUrl(child.image) ? child.image : '/iconx/profile-image.svg'}
                                alt={child.first_name}
                                className="rounded-full border-2 border-gray-300"
                                width={102}
                                height={102}
                              />
                              <h3 className="font-semibold text-[18px] leading-[100%] tracking-[0%] text-center mt-3">{`${child.first_name} ${child.middle_name}  ${child.last_name}`}</h3>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 justify-items-stretch gap-2 text-center text-sm ">
                            <div className="space-y-1">
                              <h1 className="font-medium text-sm"> {child.gender} </h1>
                              <p className="text-xs font-normal mb-0">Gender</p>
                            </div>
                            <div className="space-y-1">
                              <h1 className="font-medium text-sm">{child.blood_group}</h1>
                              <p className="text-xs font-normal  mb-0">Blood Group</p>
                            </div>
                            <div className="space-y-1">
                              <h1 className="font-medium text-sm">{child.age}</h1>
                              <p className="text-xs font-normal  mb-0">Age</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                      <div className="px-[15px] pb-[15px]">
                        <Link
                          href={`/parent/nutrition/${child.student_id}/talk-to-priya`}
                          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1D4ED8] hover:to-[#6D28D9] text-white font-semibold text-[13px] py-2.5 rounded-[8px] transition shadow-md"
                        >
                          <span>🎙️</span> Talk to Priya
                        </Link>
                      </div>
                    </div>
                  ))
                : ''}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
