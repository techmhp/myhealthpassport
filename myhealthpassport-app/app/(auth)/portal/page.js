'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import nookies from 'nookies';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import InlineSpinner from '@/components/UI/InlineSpinner';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const cookies = nookies.get();

  useEffect(() => {
    if (cookies.root && cookies.root !== 'undefined') {
      router.push(`/${cookies.root}/home`);
    }
  }, []);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  if (loading)
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <InlineSpinner />
      </div>
    );

  return (
    <div className={classNames(loading ? 'opacity-20' : '', 'w-full min-h-full flex flex-col justify-center px-6 md:px-2 py-12 lg:px-8')}>
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="text-center justify-center flex">
          <Image alt="Site logo" src="/iconx/primary-logo.svg" className="" width={225} height={99} />
        </div>
        <h2 className="mt-[35px] text-center text-xl/6 font-semibold tracking-tight text-gray-900">Hi, Welcome to My Health Passport!</h2>
      </div>
      <div className="mt-[35px]">
        <div className="grid lg:grid-cols-4 lg:gap-4 md:gap-4 sm:gap-1 md:grid-cols-4 sm:grid-cols-1">
          <div className="text-center p-2">
            <div className="bg-white h-60 rounded-lg px-6 py-8 ring shadow-xl ring-gray-900/5 hover:bg-[#ECF2FF]">
              <h3 className="text-gray-900 mt-5 text-base font-medium tracking-tight ">Parent's Login</h3>
              <p className="text-gray-500 mt-2 text-sm ">In this login section, parents can access their home.</p>
              <Link href="/parent-login">
                <button onClick={() => setLoading(true)} className="inline-flex float-right mt-5 cursor-pointer" disabled={loading}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#4f46e5" className="h-8 w-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
          <div className="text-center p-2">
            <div className="bg-white h-60 rounded-lg px-6 py-8 ring shadow-xl ring-gray-900/5 hover:bg-[#ECF2FF]">
              <h3 className="text-gray-900 mt-5 text-base font-medium tracking-tight ">School Login</h3>
              <p className="text-gray-500 mt-2 text-sm">In this login section, school-admin and teachers can access their home.</p>
              <Link href="/school-login" legacyBehavior>
                <button onClick={() => setLoading(true)} className="inline-flex float-right mt-2 cursor-pointer" disabled={loading}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#4f46e5" className="h-8 w-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
          <div className="text-center p-2">
            <div className="bg-white h-60 rounded-lg px-6 py-8 ring shadow-xl ring-gray-900/5 hover:bg-[#ECF2FF]">
              <h3 className="text-gray-900 mt-5 text-base font-medium tracking-tight ">Admin & Staff Login</h3>
              <p className="text-gray-500 mt-2 text-sm ">In this login section, super-admins and staff members can access their home.</p>
              <Link href="/login" legacyBehavior>
                <button onClick={() => setLoading(true)} className="inline-flex float-right mt-2 cursor-pointer" disabled={loading}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#4f46e5" className="h-8 w-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
          <div className="text-center p-2">
            <div className="bg-white h-60 rounded-lg px-6 py-8 ring shadow-xl ring-gray-900/5 hover:bg-[#ECF2FF]">
              <h3 className="text-gray-900 mt-5 text-base font-medium tracking-tight ">Expert Login</h3>
              <p className="text-gray-500 mt-2 text-sm ">In this login section, experts can access their home.</p>
              <Link href="/expert-login" legacyBehavior>
                <button onClick={() => setLoading(true)} className="inline-flex float-right mt-5 cursor-pointer" disabled={loading}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#4f46e5" className="h-8 w-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
