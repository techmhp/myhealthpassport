'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { updateSchool } from '@/services/secureApis';
import nookies from 'nookies';
import { toastMessage, isValidUrl } from '@/helpers/utilities';

const initialSchoolData = {
  school_id: '',
  school_name: '',
  school_full_name: '',
  school_code: '',
  registration_no: '',
  country_code: '',
  phone: '',
  location: '',
  address_line1: '',
  address_line2: '',
  landmark: '',
  school_location_link: '',
  street: '',
  state: '',
  pincode: '',
  country: '',
  primary_contact_fullname: '',
  primary_contact_email: '',
  primary_contact_phone: '',
  admin_contact_fullname: '',
  admin_contact_email: '',
  admin_contact_phone: '',
};

export default function SchoolUpdateForm({ schoolProfile }) {
  const router = useRouter();
  const cookies = nookies.get();
  const fileInputRef = useRef(null);
  const [root, setRoot] = useState(null);
  const [base64Image, setBase64Image] = useState('');
  const [file, setFile] = useState(null);
  const [school, setSchool] = useState(initialSchoolData);

  useEffect(() => {
    setRoot(cookies.root);
    if (schoolProfile.status && schoolProfile.data) {
      const school_details = schoolProfile.data.school;
      setFile(school_details.school_logo);
      const { school_logo, ...restOfData } = school_details;
      setSchool(prevSchool => ({
        ...prevSchool,
        ...restOfData,
      }));
    }
  }, [schoolProfile]);

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      const sizeInKB = (file.size / 1024).toFixed(2);
      if (sizeInKB > 500) {
        toastMessage('The upload file size must be less than or equal to 500KB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result); // base64 string with prefix (data:image/jpeg;base64,...)
        setSchool(s => ({ ...s, ['school_logo']: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = async e => {
    const { name, value } = e.target;
    setSchool(s => ({ ...s, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const response = await updateSchool(school.school_id, JSON.stringify(school));
      if (response.status === true) {
        toastMessage(response.message, 'success');
        router.push(`/${root}/schools`);
      } else if (response.status === false) {
        toastMessage(response.message, 'error');
      }
    } catch (err) {
      toastMessage(err || 'School Update failed', 'error');
    }
  };

  return (
    <form method="PUT" onSubmit={handleSubmit} encType="multipart/form-data">
      <input type="hidden" name="school_id" value={school.school_id} />
      <div className="px-0 sm:px-1">
        <div className="w-full flex justify-between items-center">
          <div className="flex gap-[70px] items-center">
            <div onClick={handleImageClick} className="flex cursor-pointer items-center justify-center rounded-[10px] bg-[#F3F7FA] w-[100px] h-[85px]">
              {base64Image || file ? (
                <img src={base64Image ? base64Image : isValidUrl(file) ? file : ''} alt="Profile" className="w-full h-full rounded-[10px]" />
              ) : (
                <Plus className="w-6 h-6 text-gray-500" />
              )}
              <input type="file" name="school_logo" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
            </div>
            <div className="flex flex-col gap-[15px] items-start mb-5">
              <h3 className="font-semibold text-[14px] leading-[100%] tracking-[0]">
                {school.school_full_name ? school.school_full_name : school.school_name}
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="flex flex-col items-start">
                  <p className="font-normal text-[12px] leading-[100%] tracking-[0]">Location</p>
                  <p className="mb-0 font-medium text-[14px] leading-[100%] tracking-[0]">{school.location}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-normal text-[12px] leading-[100%] tracking-[0]">Strength</p>
                  <p className="mb-0 font-medium text-[14px] leading-[100%] tracking-[0] text-center">
                    {school.school_students_strength ? school.school_students_strength : 0}
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-normal text-[12px] leading-[100%] tracking-[0]">Onboarding</p>
                </div>
              </div>
            </div>
          </div>
          <a
            href={`/admin/schools/${school.school_id}/schoolinfo`}
            className="rounded-[5px] pt-[10px] pr-[20px] pb-[10px] pl-[20px] bg-[#5465FF] text-[#FFFFFF] whitespace-nowrap"
          >
            View Student List
          </a>
        </div>
      </div>
      <div className="flex justify-center items-center mt-4 sm:mt-[22px]">
        <div className="w-full">
          <div className="bg-white rounded-lg">
            <div className="space-y-12">
              <div className="border-b border-gray-900/10 pb-[30px]">
                <div className="float-right">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                    <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                  </svg>
                </div>
                <h2 className="text-base/7 font-semibold text-gray-900">Basic Details</h2>
                <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
                  {/* School Name */}
                  <div className="max-w-sm">
                    <label htmlFor="school_name" className="block text-xs/4 font-normal text-[#656565]">
                      School Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="school_name"
                        name="school_name"
                        type="text"
                        value={school.school_name}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        required
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="school_full_name" className="block text-xs/4 font-normal text-[#656565]">
                      School Full Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="school_full_name"
                        name="school_full_name"
                        type="text"
                        value={school.school_full_name}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="school_code" className="block text-xs/4 font-normal text-[#656565]">
                      School Code
                    </label>
                    <div className="mt-2">
                      <input
                        id="school_code"
                        name="school_code"
                        type="text"
                        value={school.school_code}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="registration_no" className="block text-xs/4 font-normal text-[#656565]">
                      Registration Number
                    </label>
                    <div className="mt-2">
                      <input
                        id="registration_no"
                        name="registration_no"
                        type="text"
                        value={school.registration_no}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  {/* Google Map Location Link */}
                  <div className="max-w-sm">
                    <label htmlFor="school_location_link" className="block text-xs/4 font-normal text-[#656565]">
                      Google Map Location Link
                    </label>
                    <div className="mt-2">
                      <input
                        id="school_location_link"
                        name="school_location_link"
                        type="text"
                        value={school.school_location_link}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-900/10 pb-[30px] mt">
                <h2 className="text-base/7 font-semibold text-gray-900">Contact Details</h2>
                <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
                  {/* Primary Contact Full Name */}
                  <div className="max-w-sm">
                    <label htmlFor="primary_contact_fullname" className="block text-xs/4 font-normal text-[#656565]">
                      Primary Contact Full Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="primary_contact_fullname"
                        name="primary_contact_fullname"
                        type="text"
                        value={school.primary_contact_fullname}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  {/* Primary Contact Email */}
                  <div className="max-w-sm">
                    <label htmlFor="primary_contact_email" className="block text-xs/4 font-normal text-[#656565]">
                      Primary Contact Email
                    </label>
                    <div className="mt-2">
                      <input
                        id="primary_contact_email"
                        name="primary_contact_email"
                        type="email"
                        value={school.primary_contact_email}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        required
                      />
                    </div>
                  </div>

                  {/* Primary Contact Phone Number */}
                  <div className="max-w-sm">
                    <label htmlFor="primary_contact_phone" className="block text-xs/4 font-normal text-[#656565]">
                      Primary Contact Phone Number
                    </label>
                    <div className="mt-2">
                      <input
                        id="primary_contact_phone"
                        name="primary_contact_phone"
                        type="text"
                        value={school.primary_contact_phone}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        required
                      />
                    </div>
                  </div>

                  {/* Administrator Contact Full Name */}
                  <div className="max-w-sm">
                    <label htmlFor="admin_contact_fullname" className="block text-xs/4 font-normal text-[#656565]">
                      Administrator Contact Full Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="admin_contact_fullname"
                        name="admin_contact_fullname"
                        type="text"
                        value={school.admin_contact_fullname}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  {/* Administrator Contact Email */}
                  <div className="max-w-sm">
                    <label htmlFor="admin_contact_email" className="block text-xs/4 font-normal text-[#656565]">
                      Administrator Contact Email
                    </label>
                    <div className="mt-2">
                      <input
                        id="admin_contact_email"
                        name="admin_contact_email"
                        type="email"
                        value={school.admin_contact_email}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  {/* Administrator Contact Phone Number */}
                  <div className="max-w-sm">
                    <label htmlFor="admin_contact_phone" className="block text-xs/4 font-normal text-[#656565]">
                      Administrator Contact Phone Number
                    </label>
                    <div className="mt-2">
                      <input
                        id="admin_contact_phone"
                        name="admin_contact_phone"
                        type="text"
                        value={school.admin_contact_phone}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-b border-gray-900/10 pb-[30px] mt">
                <h2 className="text-base/7 font-semibold text-gray-900">Correspondence Details</h2>
                {/* Updated grid: 1 column on small screens, 2 on medium, 3 on large */}
                <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
                  <div className="max-w-sm">
                    <label htmlFor="address_line1" className="block text-xs/4 font-normal text-[#656565]">
                      Address Line 1
                    </label>
                    <div className="mt-2">
                      <input
                        id="address_line1"
                        name="address_line1"
                        type="text"
                        value={school.address_line1}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="address_line2" className="block text-xs/4 font-normal text-[#656565]">
                      Address Line 2
                    </label>
                    <div className="mt-2">
                      <input
                        id="address_line2"
                        name="address_line2"
                        type="text"
                        value={school.address_line2}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="landmark" className="block text-xs/4 font-normal text-[#656565]">
                      Landmark
                    </label>
                    <div className="mt-2">
                      <input
                        id="landmark"
                        name="landmark"
                        type="text"
                        value={school.landmark}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="street" className="block text-xs/4 font-normal text-[#656565]">
                      Street Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="street"
                        name="street"
                        type="text"
                        value={school.street}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="location" className="block text-xs/4 font-normal text-[#656565]">
                      Location
                    </label>
                    <div className="mt-2">
                      <input
                        id="location"
                        name="location"
                        type="text"
                        value={school.location}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="state" className="block text-xs/4 font-normal text-[#656565]">
                      State
                    </label>
                    <div className="mt-2">
                      <input
                        id="state"
                        name="state"
                        type="text"
                        value={school.state}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="pincode" className="block text-xs/4 font-normal text-[#656565]">
                      Pincode
                    </label>
                    <div className="mt-2">
                      <input
                        id="pincode"
                        name="pincode"
                        type="text"
                        value={school.pincode}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="country_code" className="block text-xs/4 font-normal text-[#656565]">
                      Country Calling Code
                    </label>
                    <div className="mt-2">
                      <input
                        id="country_code"
                        name="country_code"
                        type="text"
                        value={school.country_code}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="phone" className="block text-xs/4 font-normal text-[#656565]">
                      Phone
                    </label>
                    <div className="mt-2">
                      <input
                        id="phone"
                        name="phone"
                        type="text"
                        value={school.phone}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="country" className="block text-xs/4 font-normal text-[#656565]">
                      Country
                    </label>
                    <div className="mt-2">
                      <input
                        id="country"
                        name="country"
                        type="text"
                        value={school.country}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
                <button onClick={() => router.back()} className="font-normal py-2 px-5  border border-[#5465FF]  rounded-[5px] whitespace-nowrap">
                  Close
                </button>
                <button
                  type="submit"
                  name="submit"
                  className="rounded-[5px] bg-indigo-500  px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 whitespace-nowrap"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
