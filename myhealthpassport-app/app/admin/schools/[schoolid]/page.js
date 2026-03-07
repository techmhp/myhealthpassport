'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchoolUpdateForm from '@/components/School/SchoolUpdateForm';
import Header from '@/components/Header';
import { schoolDetails } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import Spinner from '@/components/UI/Spinner';


function Profile() {
  const { schoolid } = useParams();
  const [loading, setLoading] = useState(true);
  const [schoolProfile, setSchoolProfile] = useState([]);

  // Function to simulate fetching data from your API
  const fetchSchoolDetails = async () => {
    try {
      const response = await schoolDetails(schoolid);
      const results = await JSON.parse(response);
      if (results.status === true) {
        setSchoolProfile(results);
      } else {
        toastMessage(results.message || 'Failed to fetch school details.', 'error');
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toastMessage(err || 'An error occurred while fetching data.', 'error');
    }
  };

  useEffect(() => {
    fetchSchoolDetails();
  }, []);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <>
      <Header />
      <div className={classNames(loading ? 'opacity-20' : '', 'p-4 sm:p-6 md:p-[26px] md:px-12 lg:px-18')}>
        <div className="px-2 sm:px-6 md:px-10 lg:px-14 grid gap-4 md:gap-8 lg:gap-13">
          <Breadcrumbs
            items={[
              { name: schoolProfile?.data?.school.school_full_name ? schoolProfile?.data?.school.school_full_name : schoolProfile?.data?.school.school_name, href: '#' },
              { name: 'Profile', current: true },
            ]}
            homeLabel="Schools"
            homeHref="/admin/schools"
          />
          <div className="flex justify-center items-center mt-4 sm:mt-[22px]">
            <div className="w-full">
              <div className="relative flex items-center justify-center mb-[30px] sm:mb-[18px]"></div>
              <div className="bg-white rounded-lg">
                <SchoolUpdateForm schoolProfile={schoolProfile} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {loading ? <Spinner status={loading} /> : ''}
    </>
  );
}

export default Profile;
