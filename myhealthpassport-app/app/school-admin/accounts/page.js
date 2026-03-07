'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchoolStudentsList from '@/components/SchoolStudentsList';
import { toastMessage } from '@/helpers/utilities';
import { schoolDetails } from '@/services/secureApis';


const Students = () => {
  const [school, setSchool] = useState({});

  useEffect(() => {
    const base64User = localStorage.getItem('user_info');
    if (!base64User || base64User === 'undefined') {
      toastMessage('Invalid school login found', 'error');
      return;
    }
    const user_info = JSON.parse(atob(base64User));
    schoolDetails(user_info.school_id).then(response => {
      const result = JSON.parse(response);
      if (result.status === true) {
        setSchool(result.data.school);
      }
    });
  }, []);

  return (
    <>
      <Header />
      <div className="p-6.5 px-[146px]">
        <div className="">
          <Breadcrumbs
            items={[
              {
                name: 'Accounts',
                href: '#',
                current: true,
              },
            ]}
            homeLabel="Home"
            homeHref="/school-admin/home"
          />
        </div>
        <div className="bg-white rounded-lg mt-[17px]">
          {Object.keys(school).length > 0 ? <SchoolStudentsList school={school} page='accounts' /> : ''}
        </div>
      </div>
    </>
  );
};

export default Students;
