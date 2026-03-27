'use client';

import React, { useState } from 'react';
// Third-Party Library Imports (UI Components & Utilities)
import { DatePicker } from 'antd'; // Ant Design UI Component
import dayjs from 'dayjs'; // Date Handling Library
import duration from 'dayjs/plugin/duration'; // Day.js plugin for duration calculations
dayjs.extend(duration);

// Third-Party Icon Imports (UI Enhancements)
import { ChevronDownIcon, CalendarIcon } from '@heroicons/react/16/solid';
import { useRouter } from 'next/navigation';


export default function ExpertForm() {
  const router = useRouter();
  const [age, setAge] = useState('');

  const calculateAge = date => {
    if (!date) {
      setAge(''); // Reset age if no date is selected
      return;
    }
    const birthDate = dayjs(date);
    const today = dayjs();
    const years = today.diff(birthDate, 'year');
    const months = today.diff(birthDate.add(years, 'year'), 'month');
    setAge(`${years} Years ${months} Months`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  }

  return (
    <form method='POST' onSubmit={handleSubmit}>
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-[30px]">
          <h2 className="text-base/7 font-semibold text-gray-900">Basic Details</h2>
          {/* Updated grid: 1 column on small screens, 2 on medium, 3 on large */}
          <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="">
              <label htmlFor="first-name" className="block text-xs/4 font-normal text-[#656565]">
                First Name
              </label>
              <div className="mt-2">
                <input
                  id="first-name"
                  name="first-name"
                  type="text"
                  autoComplete="first-name"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="middle-name" className="block text-xs/4 font-normal text-[#656565]">
                Middle Name
              </label>
              <div className="mt-2">
                <input
                  id="middle-name"
                  name="middle-name"
                  type="text"
                  autoComplete="middle-name"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="last-name" className="block text-xs/4 font-normal text-[#656565]">
                Last Name (Family Name)
              </label>
              <div className="mt-2">
                <input
                  id="last-name"
                  name="last-name"
                  type="text"
                  autoComplete="last-name"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="gender" className="block text-xs/4 font-normal text-[#656565]">
                Gender
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="gender"
                  name="gender"
                  autoComplete="gender"
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Others</option>
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
              </div>
            </div>

            <div>
              <label htmlFor="date-of-birth" className="block text-xs/4 font-normal text-[#656565]">
                Date of Birth
              </label>
              <div className="mt-2">
                <DatePicker
                  id="date-of-birth"
                  name="date-of-birth"
                  format="DD/MM/YYYY"
                  placeholder="DD/MM/YYYY"
                  onChange={date => calculateAge(date)}
                  suffixIcon={<CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
                  className="custom-datepicker block w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-base text-gray-900 
                                            outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 
                                            focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>
            {/* Age Display */}
            <div>
              <label className="block text-xs/4 font-normal text-[#656565]">Age</label>
              <div className="mt-2 text-gray-900 text-base px-3 py-1.5 sm:text-sm/6">{age || '--'}</div>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-900/10 pb-[30px] mt">
          <h2 className="text-base/7 font-semibold text-gray-900">Correspondence Details</h2>
          {/* Updated grid: 1 column on small screens, 2 on medium, 3 on large */}
          <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="">
              <label htmlFor="address-line-1" className="block text-xs/4 font-normal text-[#656565]">
                Address Line 1
              </label>
              <div className="mt-2">
                <input
                  id="address-line-1"
                  name="address-line-1"
                  type="text"
                  autoComplete="address-line-1"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="address-line-2" className="block text-xs/4 font-normal text-[#656565]">
                Address Line 2
              </label>
              <div className="mt-2">
                <input
                  id="address-line-2"
                  name="address-line-2"
                  type="text"
                  autoComplete="address-line-2"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="landmark" className="block text-xs/4 font-normal text-[#656565]">
                Landmark
              </label>
              <div className="mt-2">
                <input
                  id="landmark"
                  name="landmark"
                  type="text"
                  autoComplete="landmark"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="street-name" className="block text-xs/4 font-normal text-[#656565]">
                Street Name
              </label>
              <div className="mt-2">
                <input
                  id="street-name"
                  name="street-name"
                  type="text"
                  autoComplete="street-name"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="state" className="block text-xs/4 font-normal text-[#656565]">
                State
              </label>
              <div className="mt-2">
                <input
                  id="state"
                  name="state"
                  type="text"
                  autoComplete="state"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="pincode" className="block text-xs/4 font-normal text-[#656565]">
                Pincode
              </label>
              <div className="mt-2">
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  autoComplete="pincode"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="country-code" className="block text-xs/4 font-normal text-[#656565]">
                Country Calling Code
              </label>
              <div className="mt-2">
                <input
                  id="country-code"
                  name="country-code"
                  type="text"
                  autoComplete="country-code"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="phone" className="block text-xs/4 font-normal text-[#656565]">
                Phone
              </label>
              <div className="mt-2">
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  autoComplete="phone"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="country" className="block text-xs/4 font-normal text-[#656565]">
                Country
              </label>
              <div className="mt-2">
                <input
                  id="country"
                  name="country"
                  type="text"
                  autoComplete="country"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
          <button onClick={() => router.back()} className="cursor-pointer font-normal w-[78px] h-[37px] py-2 px-5  border border-[#5465FF]  rounded-[5px] whitespace-nowrap">Close</button>
          <button
            type="submit"
            name='submit'
            className="cursor-pointer rounded-[5px] bg-indigo-500 h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 whitespace-nowrap"
          >
            Save changes
          </button>
        </div>
      </div>
    </form>
  );
}
