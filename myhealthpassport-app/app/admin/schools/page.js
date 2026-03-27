'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Image from 'next/image';
import Link from 'next/link';
import PlusButton from '@/components/UI/PlusButton';
import { schoolList } from '@/services/secureApis';
import { toastMessage, isValidUrl } from '@/helpers/utilities';

// Isolated component so each card has its own imgFailed state
const SchoolLogo = ({ src }) => {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <Image
      src={!imgFailed && isValidUrl(src) ? src : '/iconx/school.svg'}
      alt="school logo"
      width={90}
      height={90}
      className="w-[90px] h-[90px]"
      onError={() => setImgFailed(true)}
    />
  );
};

const SchoolsGrid = () => {
  const [schools, setSchools] = useState([]);
  const [totalSchools, setTotalSchools] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSchools = async (page, itemsPerPage, search = '') => {
    try {
      const effectiveLimit = Number.isFinite(itemsPerPage) && itemsPerPage > 0 && itemsPerPage <= 100 ? itemsPerPage : 10;
      const effectivePage = Number.isFinite(page) && page > 0 ? page : 1;

      // When searching, fetch all schools (or a large limit)
      const fetchLimit = search.trim() ? 1000 : effectiveLimit;
      const skip = search.trim() ? 0 : (effectivePage - 1) * effectiveLimit;

      const response = await schoolList(fetchLimit, skip);
      const results = await JSON.parse(response);

      if (results.status === true) {
        let schoolsList = results.data.schools_list.items || [];

        // Filter schools if search query exists
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          schoolsList = schoolsList.filter(school => {
            const name = (school.school_name || '').toLowerCase();
            const admin = (school.school_admin_username || '').toLowerCase();
            const location = (school.location || '').toLowerCase();
            return name.includes(q) || admin.includes(q) || location.includes(q);
          });
        }

        setSchools(schoolsList);
        setTotalSchools(search.trim() ? schoolsList.length : results.data.schools_list.total || 0);
        setLimit(effectiveLimit);
        setCurrentPage(effectivePage);
      } else {
        toastMessage(results.message || 'Failed to fetch schools.', 'error');
      }
    } catch (err) {
      toastMessage(err || 'An error occurred while fetching data.', 'error');
    }
  };

  // Fetch schools when component mounts, page changes, or search changes
  useEffect(() => {
    fetchSchools(currentPage, limit, searchQuery);
  }, [currentPage, limit, searchQuery]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setCurrentPage(1);
    }
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(totalSchools / (searchQuery.trim() ? schools.length || 1 : limit)));

  const handlePageChange = pageNumber => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <>
      <Header />
      <div className="w-full px-12">
        <div className="mt-10 w-full flex items-center justify-center">
          <div className=" flex gap-[70px] items-center justify-center w-[50%]">
            <div className="w-full flex gap-5 items-center">
              <div className="flex flex-1 gap-[10px]">
                <div className="w-full grid grid-cols-1">
                  <input
                    id="search"
                    name="search"
                    type="search"
                    placeholder="search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full col-start-1 row-start-1 block rounded-[5px] p-[10px] bg-white pr-3 text-base text-gray-900 outline-1 -outline-offset-1 border-[#B5CCFF] outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:pl-9 sm:text-sm/6"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="#5389FF"
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 ml-3 size-4 self-center text-gray-400 sm:size-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-7">
          {schools.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 mt-6">
              {searchQuery.trim() ? `No schools found matching "${searchQuery.trim()}".` : 'No schools available.'}
            </div>
          ) : (
            schools.map((school, index) => (
              <Link key={index} href={`/admin/schools/${school.school_id}`}>
                <div className="flex gap-[15px] cursor-pointer rounded-[10px] border border-[#DCDCDC] p-[15px] items-center">
                  <div className="flex items-center justify-center rounded-[10px] bg-[#F3F7FA] w-[100px] h-[90px]">
                    <SchoolLogo src={school.school_logo} />
                  </div>
                  <div className="flex-1 flex flex-col gap-4 items-start">
                    <h3 className="font-semibold text-[14px] leading-[100%] tracking-[0]">
                      {school.school_name} (<span className="font-normal text-[13px]">{school.school_admin_username}</span>)
                    </h3>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="flex flex-col items-start">
                        <p className="font-normal text-[12px] leading-[100%] tracking-[0]">Location</p>
                        <p className="mb-0 font-medium text-[14px] leading-[100%] tracking-[0]">{school.location}</p>
                      </div>

                      <div className="flex flex-col items-center">
                        <p className="font-normal text-[12px] leading-[100%] tracking-[0]">Strength</p>
                        <p className="mb-0 font-medium text-[14px] leading-[100%] tracking-[0] text-center">
                          {Number.isFinite(school.total_students) ? school.total_students.toLocaleString() : '-'}
                        </p>
                      </div>

                      <div className="flex flex-col items-center">
                        <p className="font-normal text-[12px] leading-[100%] tracking-[0]">Onboarding</p>
                        {school.school_id ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#89E382" className="size-5">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <span className="text-red-500">Not Onboarding</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
        <div className="flex items-center justify-end gap-4 mt-2 pb-6 text-sm text-gray-700">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded border ${
              currentPage === 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <span>
            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-3 py-1 rounded border ${
              currentPage === totalPages || totalPages === 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
      </div>
      <Link href="schools/add">
        <PlusButton />
      </Link>
    </>
  );
};
export default SchoolsGrid;
