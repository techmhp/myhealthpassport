'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import StaffMemberForm from '@/components/StaffMemberForm';
import Header from '@/components/Header';

function StaffMember() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/')[3];

  return (
    <>
      <Header />
      <div className="p-4 sm:p-6 md:p-[26px] md:px-12 lg:px-18">
        <Breadcrumbs items={[{ name: 'Add Staff Member', href: '#' }]} homeLabel="Staff" homeHref="/admin/staff" />
        <StaffMemberForm />
      </div>
    </>
  );
}

export default StaffMember;
