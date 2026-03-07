'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import nookies from 'nookies';
import { useState, useEffect } from 'react';
import { loginWithPassword } from '@/services/authApi';
import { RoleBasedRouting } from '@/helpers/roleBasedRouting';
import Spinner from '@/components/UI/Spinner';
import { toastMessage } from '@/helpers/utilities';

export default function Login() {
  const router = useRouter();
  const cookies = nookies.get();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ role_type: 'SCHOOL_STAFF', username: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (cookies.root && cookies.root !== 'undefined') {
      router.push(`/${cookies.root}/home`);
    }
  }, []);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = async e => {
    setError(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginWithPassword(formData);
      if (response.status === true) {
        toastMessage(response.message, 'success');
        // Store access token in nookies
        nookies.set(null, 'access_token', response.data.access_token, {
          path: '/',
          sameSite: true,
          secure: true,
          maxAge: 86400, // one day
        });

        nookies.set(null, 'role', response.data.user_role, {
          path: '/',
          sameSite: true,
          secure: true,
          maxAge: 86400, // one day
        });

        // Store user info in localStorage
        const userInfo = response.data;
        localStorage.setItem('user_info', btoa(JSON.stringify(userInfo)));
        RoleBasedRouting(response.data.role_type, response.data.user_role);
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.log(err);

      setError(err.message || 'An error occurred during login. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={classNames(loading ? 'opacity-20' : '', 'w-full min-h-full flex flex-col justify-center px-6 md:px-2 py-12 lg:px-8')}>
        <div className="text-center justify-center flex">
          <Image alt="company logo" src="/iconx/primary-logo.svg" className="h-60px w-180px" width={180} height={60} />
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-[35px] text-center text-xl/6 font-semibold tracking-tight text-gray-900">Hi, Welcome to My Health Passport!</h2>
        </div>
        <div className="mt-[35px] sm:mx-auto sm:w-full sm:max-w-sm">
          <form action="#" method="POST" className="flex flex-col gap-[24px]" onSubmit={handleSubmit}>
            <div className="max-w-sm">
              <input
                id="username"
                name="username"
                type="text"
                required
                onChange={handleChange}
                placeholder="UserName/Phone Number"
                className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
            </div>
            <div className="max-w-sm mb-5">
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  required
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility()}
                  className="absolute text-sm inset-y-0 end-0 flex items-center z-20 px-3 cursor-pointer text-gray-400 rounded-e-md focus:outline-hidden focus:text-blue-600"
                >
                  {showPassword ? 'hide' : 'show'}
                </button>
              </div>
            </div>
            {error ? <p className="text-red-500 text-sm m-0">{error}</p> : ''}
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              disabled={loading}
            >
              {' '}
              Login
            </button>
            <div className="text-sm text-center">
              <a href="/forgot-password?role_type=SCHOOL_STAFF" className="font-semibold underline text-indigo-600 hover:text-indigo-500 text-center">
                Forgot password?
              </a>
            </div>
          </form>
        </div>
      </div>
      {loading && <Spinner status={loading} />}
    </>
  );
}
