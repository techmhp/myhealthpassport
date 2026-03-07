'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Login() {
  const router = useRouter();

  return (
    <>
      <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-5 lg:px-8">
        <div className="flex lg:flex-1">
          <a href="#" className="-m-1.5 p-1.5">
            <Image alt="company logo" src="/iconx/company-logo.svg" className="h-8 w-auto" width={118} height={40} />
          </a>
        </div>
      </nav>
      <div className="flex flex-col justify-center px-6 md:px-2 lg:px-8 mt-[40px]">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm flex flex-col items-center gap-[24px]">
          <div>
            <Image alt="company logo" src="/brand-logos/school-logo.svg" className="h-120px w-120px" width={120} height={120} />
          </div>
          <h2 className="font-inter font-semibold text-[20px] leading-[25px] tracking-[0] text-gray-900">Hi, Welcome to My Health Passport!</h2>
        </div>
        <div className="mt-[35px] sm:mx-auto sm:w-full sm:max-w-sm">
          <form action="#" method="POST" className="flex flex-col gap-[24px]">
            <div className="">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="UserName/Phone Number"
                className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
            </div>
            <div className="">
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                required
                autoComplete="current-password"
                className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                onClick={() => {
                  router.push('/');
                }}
              >
                Login
              </button>
            </div>

            <div className="text-sm text-center">
              <a href="/forgot-password" className="font-semibold underline text-indigo-600 hover:text-indigo-500 text-center">
                Forgot password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
