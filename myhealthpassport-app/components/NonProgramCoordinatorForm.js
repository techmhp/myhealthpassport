'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import nookies from 'nookies';
import { roleConstancts } from '@/services/generalApis';
import { createStaffMember } from '@/services/secureApis';
import { formatString } from '@/helpers/utilities';

export default function NonProgramCoordinatorForm() {
  const router = useRouter();
  const cookies = nookies.get();
  const [root, setRoot] = React.useState(null);
  const [roletypes, setRoleTpes] = useState({});
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    role_type: '',
    user_role: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    phone: '',
    primary_contact_full_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    administrator_contact_full_name: '',
    administrator_contact_email: '',
    administrator_contact_phone: '',
    aadhaar_number: '',
    mp_uhid: '',
    abha_id: '',
    class: '',
    section: '',
    roll_number: '',
    address_line_1: '',
    address_line_2: '',
    landmark: '',
    street_name: '',
    state: '',
    pincode: '',
    country_calling_code: '',
    country: '',
  });

  useEffect(() => {
    setRoot(cookies.root);
    roleConstancts()
      .then(res => {
        if (res.status === true) {
          setRoleTpes(res);
        }
      })
      .catch(err => {
        alert(err);
      });
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name.replace('-', '_')]: value });
    setErrors(prev => ({ ...prev, [name.replace('-', '_')]: '' }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.role_type) newErrors.role_type = 'Role Type is required';
    if (!formData.user_role) newErrors.user_role = 'User Role is required';
    if (!formData.first_name) newErrors.first_name = 'First Name is required';
    if (!formData.last_name) newErrors.last_name = 'Last Name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const submitData = {
      ...formData,
    };

    try {
      const response = await createStaffMember(submitData);
      if (response.status === true) {
        alert(response.message);
        router.push(`/${root}/staff`);
      }
    } catch (err) {
      alert(err);
    }
  };

  return (
    <form method="POST" onSubmit={handleSubmit}>
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-[30px]">
          <h2 className="text-base/7 font-semibold text-gray-900">Basic Details</h2>
          <div className="mt-[30px] grid grid-cols-1 md:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="">
              <label htmlFor="first-name" className="block text-xs/4 font-normal text-[#656565]">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="first-name"
                  name="first-name"
                  type="text"
                  autoComplete="first-name"
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  required
                />
                {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
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
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="last-name" className="block text-xs/4 font-normal text-[#656565]">
                Last Name <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="last-name"
                  name="last-name"
                  type="text"
                  autoComplete="last-name"
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  required
                />
                {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-[30px]">
          <h2 className="text-base/7 font-semibold text-gray-900">Contact Details</h2>
          <div className="mt-[30px] grid grid-cols-1 md:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="">
              <label htmlFor="primary-contact-full-name" className="block text-xs/4 font-normal text-[#656565]">
                Primary Contact Full Name
              </label>
              <div className="mt-2">
                <input
                  id="primary-contact-full-name"
                  name="primary-contact-full-name"
                  type="text"
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="primary-contact-email" className="block text-xs/4 font-normal text-[#656565]">
                Primary Contact Email
              </label>
              <div className="mt-2">
                <input
                  id="primary-contact-email"
                  name="primary-contact-email"
                  type="email"
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="primary-contact-phone" className="block text-xs/4 font-normal text-[#656565]">
                Primary Contact Phone Number
              </label>
              <div className="mt-2">
                <input
                  id="primary-contact-phone"
                  name="primary-contact-phone"
                  type="text"
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="administrator-contact-full-name" className="block text-xs/4 font-normal text-[#656565]">
                Administrator Contact Full Name
              </label>
              <div className="mt-2">
                <input
                  id="administrator-contact-full-name"
                  name="administrator-contact-full-name"
                  type="text"
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="administrator-contact-email" className="block text-xs/4 font-normal text-[#656565]">
                Administrator Contact Email
              </label>
              <div className="mt-2">
                <input
                  id="administrator-contact-email"
                  name="administrator-contact-email"
                  type="email"
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="administrator-contact-phone" className="block text-xs/4 font-normal text-[#656565]">
                Administrator Contact Phone Number
              </label>
              <div className="mt-2">
                <input
                  id="administrator-contact-phone"
                  name="administrator-contact-phone"
                  type="text"
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-[30px]">
          <h2 className="text-base/7 font-semibold text-gray-900">Identity Details</h2>
          <div className="mt-[30px] grid grid-cols-1 md:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="">
              <label htmlFor="aadhaar-number" className="block text-xs/4 font-normal text-[#656565]">
                Aadhaar Number
              </label>
              <div className="mt-2">
                <input
                  id="aadhaar-number"
                  name="aadhaar-number"
                  type="text"
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="mp-uhid" className="block text-xs/4 font-normal text-[#656565]">
                MP UHID
              </label>
              <div className="mt-2">
                <input
                  id="mp-uhid"
                  name="mp-uhid"
                  type="text"
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="abha-id" className="block text-xs/4 font-normal text-[#656565]">
                Abha ID
              </label>
              <div className="mt-2">
                <input
                  id="abha-id"
                  name="abha-id"
                  type="text"
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="class" className="block text-xs/4 font-normal text-[#656565]">
                Class
              </label>
              <div className="mt-2">
                <input
                  id="class"
                  name="class"
                  type="text"
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="section" className="block text-xs/4 font-normal text-[#656565]">
                Section
              </label>
              <div className="mt-2">
                <input
                  id="section"
                  name="section"
                  type="text"
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="roll-number" className="block text-xs/4 font-normal text-[#656565]">
                Roll Number
              </label>
              <div className="mt-2">
                <input
                  id="roll-number"
                  name="roll-number"
                  type="text"
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-[30px]">
          <h2 className="text-base/7 font-semibold text-gray-900">Correspondence Details</h2>
          <div className="mt-[30px] grid grid-cols-1 md:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="">
              <label htmlFor="address-line-1" className="block text-xs/4 font-normal text-[#656565]">
                Address Line 1
              </label>
              <div className="mt-2">
                <input
                  id="address-line-1"
                  name="address-line-1"
                  type="text"
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="">
              <label htmlFor="country-calling-code" className="block text-xs/4 font-normal text-[#656565]">
                Country Calling Code
              </label>
              <div className="mt-2">
                <input
                  id="country-calling-code"
                  name="country-calling-code"
                  type="text"
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
          <button onClick={() => router.back()} className="font-normal cursor-pointer py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap">
            Close
          </button>
          <button
            type="submit"
            className="rounded-[5px] cursor-pointer bg-indigo-500 px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 whitespace-nowrap"
          >
            Save Changes
          </button>
        </div>
      </div>
    </form>
  );
}
