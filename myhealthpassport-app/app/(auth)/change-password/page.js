'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import nookies from 'nookies';
import Header from '@/components/Header';
import { changePassword } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';

export default function ChangePassword() {
  const router = useRouter();
  const cookies = nookies.get();
  const [userInfo, setUserInfo] = useState({});
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');

  // State to manage password visibility for each field
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    if (!cookies.role) {
      router.push('/');
    }
    if (localStorage.getItem('user_info')) {
      const userJson = JSON.parse(atob(localStorage.getItem('user_info')));
      setUserInfo(userJson);
    }
  }, []);

  // Helper function to toggle password visibility for a specific field
  const togglePasswordVisibility = field => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmNewPassword(!showConfirmNewPassword);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);

    // --- Client-side validation ---
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm new password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    try {
      const postData = JSON.stringify({
        old_password: currentPassword,
        new_password: newPassword,
      });
      const response = await changePassword(postData);
      if (response.status === true) {
        toastMessage(response.message, 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setError(response.message || 'Failed to change password. Please try again.');
      }
    } catch (err) {
      setError(err || 'An unexpected error occurred. Please try again later.');
    }
  };

  return (
    <>
      <Header />
      <div className="flex flex-col justify-center px-[72px] py-10">
        <div className="mt-[35px] sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-5 mb-5">Change Password</h2>
          <form action="#" method="POST" onSubmit={handleSubmit} className="flex flex-col gap-[24px]">
            <div className="max-w-sm">
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Please Enter Current Password"
                  className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 disabled:opacity-50 disabled:pointer-events-none"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute text-sm inset-y-0 end-0 flex items-center z-20 px-3 cursor-pointer text-gray-400 rounded-e-md focus:outline-hidden focus:text-blue-600"
                >
                  {showCurrentPassword ? 'hide' : 'show'}
                </button>
              </div>
            </div>
            <div className="max-w-sm">
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder="Please Enter New Password"
                  className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute text-sm inset-y-0 end-0 flex items-center z-20 px-3 cursor-pointer text-gray-400 rounded-e-md focus:outline-hidden focus:text-blue-600"
                >
                  {showNewPassword ? 'hide' : 'show'}
                </button>
              </div>
            </div>
            <div className="max-w-sm">
              <div className="relative">
                <input
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  required
                  placeholder="Please Enter Confirm New Password"
                  className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute text-sm inset-y-0 end-0 flex items-center z-20 px-3 cursor-pointer text-gray-400 rounded-e-md focus:outline-hidden focus:text-blue-600"
                >
                  {showConfirmNewPassword ? 'hide' : 'show'}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 mt-5 text-sm">{error}</p>}
            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
