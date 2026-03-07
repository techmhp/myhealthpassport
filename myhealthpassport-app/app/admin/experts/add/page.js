'use client';

import { useRouter } from 'next/navigation';
import ProfileHeader from '@/components/ProfileHeader';
import Breadcrumbs from '@/components/Breadcrumbs';
import AddExpertForm from '@/components/Expert/AddExpertForm';
import Header from '@/components/Header';


function AddExpert() {
  const router = useRouter();

  return (
    <>
      <Header />
      <div className="p-4 sm:p-6 md:p-[26px] md:px-12 lg:px-18">
        <div className="px-2 sm:px-6 md:px-10 lg:px-14 grid gap-4 md:gap-8 lg:gap-13">
          <Breadcrumbs items={[{ name: 'Add Expert', href: '#' }]} homeLabel="Experts" homeHref="/admin/experts" />
          <div className="px-0 sm:px-1">
            <ProfileHeader />
          </div>
        </div>
        <div className="flex justify-center items-center mt-4 sm:mt-[22px]">
          <div className="w-full">
            <div className="bg-white rounded-lg">
              <AddExpertForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddExpert;
