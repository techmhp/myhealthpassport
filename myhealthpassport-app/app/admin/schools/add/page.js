'use client';

import Breadcrumbs from '@/components/Breadcrumbs';
import SchoolProfileForm from '@/components/School/SchoolProfileForm';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';



function AddSchool() {
  const router = useRouter();

  return (
    <>
      <Header />
      <div className="p-4 sm:p-6 md:p-[26px] md:px-12 lg:px-18">
        <div className="px-2 sm:px-6 md:px-10 lg:px-14 grid gap-4 md:gap-8 lg:gap-13">
          <Breadcrumbs
            items={[
              {
                name: 'Add New School',
                href: '#',
                current: true,
              },
            ]}
            homeLabel="Schools"
            homeHref="/admin/schools"
          />
          <SchoolProfileForm />
        </div>
      </div>
    </>
  );
}

export default AddSchool;
