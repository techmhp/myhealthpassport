'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProfileHeader from '@/components/ProfileHeader';
import Breadcrumbs from '@/components/Breadcrumbs';
import UpdateExpertForm from '@/components/Expert/UpdateExpertForm';
import Header from '@/components/Header';
import { getExpertDetails } from '@/services/secureApis';
import InlineSpinner from '@/components/UI/InlineSpinner';

function EditExpert() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({});

  useEffect(() => {
    getExpertDetails(id)
      .then(res => {
        const response = JSON.parse(res);
        setProfile(response);
      })
      .catch(err => {})
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <InlineSpinner />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="p-4 sm:p-6 md:p-[26px] md:px-12 lg:px-18">
        <div className="px-2 sm:px-6 md:px-10 lg:px-14 grid gap-4 md:gap-8 lg:gap-13">
          <Breadcrumbs items={[{ name: 'Update Expert', href: '#' }]} homeLabel="Experts" homeHref="/admin/experts" />
        </div>
        <div className="flex justify-center items-center mt-4 sm:mt-[22px]">
          <div className="w-full">
            <div className="bg-white rounded-lg">
              <UpdateExpertForm data={profile.data} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditExpert;
