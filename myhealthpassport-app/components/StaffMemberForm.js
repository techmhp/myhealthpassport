'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import nookies from 'nookies';
import { DatePicker } from 'antd'; // Ant Design UI Component
import dayjs from 'dayjs'; // Date Handling Library
import duration from 'dayjs/plugin/duration'; // Day.js plugin for duration calculations
dayjs.extend(duration);
import { ChevronDownIcon, CalendarIcon } from '@heroicons/react/16/solid';
import { roleConstancts } from '@/services/generalApis';
import { createStaffMember } from '@/services/secureApis';
import { formatString } from '@/helpers/utilities';
import { Plus } from 'lucide-react';
import { toastMessage } from '@/helpers/utilities';

export default function ProgramCoordinatorForm() {
  const router = useRouter();
  const cookies = nookies.get();
  const fileInputRef = useRef(null);
  const [root, setRoot] = React.useState(null);
  const [profileImg, setProfileImg] = useState(null);
  const [dob, setDob] = useState('');
  const [file, setFile] = useState(null);
  const [roletypes, setRoleTpes] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    role_type: '',
    user_role: '',
    employee_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    phone: '',
    email: '',
    dob: '',
    blood_group: '',
    aadhaar_number: '',
    pan_number: '',
    address_line_1: '',
    address_line_2: '',
    landmark: '',
    street_name: '',
    state: '',
    pincode: '',
    country_calling_code: '',
    country: '',
    profile_image: ''
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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = e => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeInKB = (file.size / 1024).toFixed(2);
      if (sizeInKB > 500) {
        toastMessage('The upload file size must be less than or equal to 500KB.', 'error');
        return;
      }
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImg(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, profile_image: '' }));
    }
  };

  const calculateAge = date => {
    if (!date) {
      setAge(''); // Reset age if no date is selected
      return;
    }
    const formattedDate = dayjs(date).format("YYYY-MM-DD");
    setDob(formattedDate);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.role_type) newErrors.role_type = 'Role Type is required';
    if (!formData.user_role) newErrors.user_role = 'User Role is required';
    if (!formData.first_name) newErrors.first_name = 'First Name is required';
    if (!formData.last_name) newErrors.last_name = 'Last Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!file) newErrors.profile_image = 'Profile image is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsSubmitting(true);
    const submitData = {
      ...formData,
      profile_image: profileImg,
      dob: dob,
    };

    try {
      const response = await createStaffMember(formData.role_type, JSON.stringify(submitData));
      // console.log('Staff Creation response', response);

      if (response.status === true) {
        toastMessage(response.message, 'success');
        router.push(`/${root}/staff`);
      } else {
        toastMessage(response.message, 'error');
      }
    } catch (err) {
      toastMessage(err.message, 'error');
      // console.log('Staff Creation failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form method="POST" onSubmit={handleSubmit} encType='multipart/form-data'>
      <div className="px-2 sm:px-6 md:px-10 lg:px-14 grid gap-4 md:gap-8 lg:gap-13">
        <div className="mb-7 flex flex-col sm:flex-row sm:items-center gap-y-3 gap-x-4 md:gap-x-6 w-full">
          <div
            onClick={handleImageClick}
            className="relative w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] bg-[#F3F7FA] rounded-full flex items-center justify-center cursor-pointer overflow-hidden"
          >
            {profileImg ? <img src={profileImg} alt="Profile" className="w-full h-full object-cover rounded-full" /> : <Plus className="w-6 h-6 text-gray-500" />}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
            {errors.profile_image && <p className="mt-1 text-xs text-red-500 absolute bottom-[-20px]">{errors.profile_image}</p>}
          </div>

          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">{formData.first_name !== '' ? `${formData.first_name} ${formData.last_name}` : '--'}</h2>
            <div className="flex flex-row gap-2">
              <p className="text-sm">Age: --</p>
              <div className="mx-1 sm:mx-2 h-5 border-l border-[#000000]" />
              <p className="text-sm">Gender: --</p>
              <div className="mx-1 sm:mx-2 h-5 border-l border-[#000000]" />
              <p className="text-sm">---</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center items-center mt-4 sm:mt-[22px]">
        <div className="w-full">
          <div className="bg-white rounded-lg">
            <div className="space-y-12">
              <div className="border-b border-gray-900/10 pb-[30px]">
                <h2 className="text-base/7 font-semibold text-gray-900">Basic Details</h2>
                <div className="mt-[30px] grid grid-cols-1 md:grid-cols-3 gap-x-[25px] gap-y-[26px]">
                  <div className="max-w-sm">
                    <label htmlFor="employee_id" className="block text-xs/4 font-normal text-[#656565]">
                      Employee ID
                    </label>
                    <div className="max-w-sm mt-2">
                      <input
                        id="employee_id"
                        name="employee_id"
                        type="text"
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="first_name" className="block text-xs/4 font-normal text-[#656565]">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="middle_name" className="block text-xs/4 font-normal text-[#656565]">
                      Middle Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        id="middle_name"
                        name="middle_name"
                        type="text"
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.middle_name && <p className="mt-1 text-xs text-red-500">{errors.middle_name}</p>}
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="last_name" className="block text-xs/4 font-normal text-[#656565]">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>}
                    </div>
                  </div>
                  <div className="max-w-sm">
                    <label htmlFor="gender" className="block text-xs/4 font-normal text-[#656565]">
                      Gender
                    </label>
                    <div className="mt-2">
                      <div className="relative">
                        <select
                          id="gender"
                          name="gender"
                          onChange={handleChange}
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 appearance-none"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Others">Others</option>
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="max-w-sm">
                    <label htmlFor="spoken_languages" className="block text-xs/4 font-normal text-[#656565]">
                      Spoken Languages <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <div className="relative">
                        <select
                          id="spoken_languages"
                          name="spoken_languages"
                          onChange={handleChange}
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 appearance-none"
                        >
                          <option value="">Select languages</option>
                          <option value="telugu">Telugu</option>
                          <option value="english">English</option>
                          <option value="hindi">Hindi</option>
                          <option value="tamil">Tamil</option>
                          <option value="malayalam">Malayalam</option>
                          <option value="kannada">Kannada</option>
                          <option value="bengali">Bengali</option>
                          <option value="gujarati">Gujarati</option>
                          <option value="marathi">Marathi</option>
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-900/10 pb-[30px]">
                <h2 className="text-base/7 font-semibold text-gray-900">General Details</h2>
                <div className="mt-[30px] grid grid-cols-1 md:grid-cols-3 gap-x-[25px] gap-y-[26px]">
                  <div className="max-w-sm">
                    <label htmlFor="phone" className="block text-xs/4 font-normal text-[#656565]">
                      Phone Number
                    </label>
                    <div className="mt-2">
                      <input
                        id="phone"
                        name="phone"
                        type="text"
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="email" className="block text-xs/4 font-normal text-[#656565]">
                      Email
                    </label>
                    <div className="mt-2">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>
                  </div>

                  <div className='max-w-sm'>
                    <label htmlFor="dob" className="block text-xs/4 font-normal text-[#656565]">
                      Date of Birth
                    </label>
                    <div className="mt-2">
                      <DatePicker
                        id="dob"
                        name="dob"
                        format="DD/MM/YYYY"
                        placeholder="DD/MM/YYYY"
                        onChange={date => calculateAge(date)}
                        suffixIcon={<CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
                        className="custom-datepicker block w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-base text-gray-900 
                                      outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                    {errors.dob && <p className="mt-1 text-xs text-red-500">{errors.dob}</p>}
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="blood_group" className="block text-xs/4 font-normal text-[#656565]">
                      Blood Group
                    </label>
                    <div className="mt-2">
                      <input
                        id="blood_group"
                        name="blood_group"
                        type="text"
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="aadhaar_number" className="block text-xs/4 font-normal text-[#656565]">
                      Aadhaar Card Number
                    </label>
                    <div className="mt-2">
                      <input
                        id="aadhaar_number"
                        name="aadhaar_number"
                        type="text"
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="pan_number" className="block text-xs/4 font-normal text-[#656565]">
                      Pan Card Number
                    </label>
                    <div className="mt-2">
                      <input
                        id="pan_number"
                        name="pan_number"
                        type="text"
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-900/10 pb-[30px]">
                <h2 className="text-base/7 font-semibold text-gray-900">Department Details</h2>
                <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
                  <div className="max-w-sm">
                    <label htmlFor="role_type" className="block text-xs/4 font-normal text-[#656565]">
                      Select Department <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2 relative">
                      <select
                        name="role_type"
                        onChange={handleChange}
                        className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white px-3 py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      >
                        <option value="">Select Department</option>
                        {roletypes.status == true && roletypes.data?.roles_details?.length > 0
                          ? roletypes.data.roles_details.map((type, index) =>
                            !['PARENT', 'SCHOOL_STAFF', 'CONSULTANT_TEAM'].includes(type.role_type) ? (
                              <option key={index} value={type.role_type}>
                                {formatString(type.role_type.toLowerCase())}
                              </option>
                            ) : (
                              ''
                            )
                          )
                          : ''}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.role_type && <p className="mt-1 text-xs text-red-500">{errors.role_type}</p>}
                  </div>
                  <div className="max-w-sm">
                    <label htmlFor="user_role" className="block text-xs/4 font-normal text-[#656565]">
                      Select Specialisation <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2 relative">
                      <select
                        name="user_role"
                        onChange={handleChange}
                        className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white px-3 py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      >
                        <option value="">Select Specialisation</option>
                        {formData.role_type !== ''
                          ? roletypes.data?.roles_details?.map(type =>
                            type.role_type === formData.role_type
                              ? type.roles.map((details, index) => (
                                <option key={index} value={details.role}>
                                  {formatString(details.role.toLowerCase())}
                                </option>
                              ))
                              : ''
                          )
                          : ''}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.user_role && <p className="mt-1 text-xs text-red-500">{errors.user_role}</p>}
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-900/10 pb-[30px]">
                <h2 className="text-base/7 font-semibold text-gray-900">Correspondence Details</h2>
                <div className="mt-[30px] grid grid-cols-1 md:grid-cols-3 gap-x-[25px] gap-y-[26px]">
                  <div className="max-w-sm">
                    <label htmlFor="address_line_1" className="block text-xs/4 font-normal text-[#656565]">
                      Address Line 1
                    </label>
                    <div className="mt-2">
                      <input
                        id="address_line_1"
                        name="address_line_1"
                        type="text"
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="address_line_2" className="block text-xs/4 font-normal text-[#656565]">
                      Address Line 2
                    </label>
                    <div className="mt-2">
                      <input
                        id="address_line_2"
                        name="address_line_2"
                        type="text"
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
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="street_name" className="block text-xs/4 font-normal text-[#656565]">
                      Street Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="street_name"
                        name="street_name"
                        type="text"
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
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="country_calling_code" className="block text-xs/4 font-normal text-[#656565]">
                      Country Calling Code
                    </label>
                    <div className="mt-2">
                      <input
                        id="country_calling_code"
                        name="country_calling_code"
                        type="text"
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
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
                <button type="button" onClick={() => router.back()} className="font-normal cursor-pointer py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap" > Close </button>
                <button type="submit" disabled={isSubmitting} className="rounded-[5px] cursor-pointer bg-[#5465FF] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-[#4054E6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5465FF] transition-colors whitespace-nowrap" >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
