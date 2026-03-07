'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import UpdateTeacherForm from '@/components/Teacher/UpdateTeacherForm';
import { getTeacherDetails } from '@/services/secureApis';

const EditTeacher = () => {
  const { id } = useParams();
  const [teacher, setTeacher] = useState({});

  useEffect(() => {
    getTeacherDetails(id).then(res => {
      const response = JSON.parse(res);
      // console.log(response);

      setTeacher(response);
    }).catch(err => {
      // console.log(err);
    })
  }, []);

  return (
    <>
      <Header />
      <div className="px-[90px] py-[27px]">
        <div className="">
          <Breadcrumbs
            items={[{ name: 'View All Teachers', name: 'Update Teacher', href: '#', current: true }]}
            homeLabel="Teachers"
            homeHref="/school-admin/teachers"
          />
        </div>
        <div className="bg-white rounded-lg">
          <UpdateTeacherForm details={teacher} />
        </div>
      </div>
    </>
  );
};

export default EditTeacher;
