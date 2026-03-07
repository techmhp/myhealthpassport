'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import nookies from 'nookies';
import { roleConstancts } from '@/services/generalApis';
import { createStaffMember } from '@/services/secureApis';
import { formatString } from '@/helpers/utilities';
import { Plus } from 'lucide-react';
import { ChevronDownIcon } from '@heroicons/react/16/solid';
import { toastMessage } from '@/helpers/utilities';

export default function ProgramCoordinatorForm() {
  const router = useRouter();
  const cookies = nookies.get();
  const fileInputRef = useRef(null);
  const [root, setRoot] = React.useState(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [roletypes, setRoleTpes] = useState({});
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    role_type: '',
    user_role: '',
    employee_id: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    blood_group: '',
    aadhaar_card_number: '',
    pan_card_number: '',
  });

  const [availability, setAvailability] = useState({
    monday: { enabled: false, morning: false, afternoon: false, evening: false },
    tuesday: { enabled: true, morning: true, afternoon: true, evening: true },
    wednesday: { enabled: true, morning: true, afternoon: true, evening: true },
    thursday: { enabled: true, morning: true, afternoon: true, evening: true },
    friday: { enabled: true, morning: true, afternoon: true, evening: true },
    saturday: { enabled: true, morning: true, afternoon: true, evening: true },
    sunday: { enabled: true, morning: true, afternoon: true, evening: true },
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
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, profile_image: '' }));
    }
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
      // console.log('Form errors:', newErrors);
      return;
    }

    const submitData = {
      ...formData,
      profile_image: file,
      availability,
    };

    try {
      const response = await createStaffMember(submitData);
      // console.log('Staff Creation response', response);

      if (response.status === true) {
        toastMessage(response.message, 'success');
        router.push(`/${root}/staff`);
      } else {
        toastMessage(response.message, 'error');
      }
    } catch (err) {
      alert(err);
      toastMessage(err.message, 'error');
      // console.log('Staff Creation failed', err);
    }
  };

  const handleAvailabilityChange = (day, type, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: value,
      },
    }));
  };

  return (
    <form method="POST" onSubmit={handleSubmit}>
      <div className="px-2 sm:px-6 md:px-10 lg:px-14 grid gap-4 md:gap-8 lg:gap-13">
        <div className="mb-7 flex flex-col sm:flex-row sm:items-center gap-y-3 gap-x-4 md:gap-x-6 w-full">
          <div
            onClick={handleImageClick}
            className="relative w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] bg-[#F3F7FA] rounded-full flex items-center justify-center cursor-pointer overflow-hidden"
          >
            {preview ? <img src={preview} alt="Profile" className="w-full h-full object-cover rounded-full" /> : <Plus className="w-6 h-6 text-gray-500" />}
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
                  <div className="">
                    <label htmlFor="employee-id" className="block text-xs/4 font-normal text-[#656565]">
                      Employee ID
                    </label>
                    <div className="mt-2">
                      <input
                        id="employee-id"
                        name="employee-id"
                        type="text"
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="">
                    <label htmlFor="first-name" className="block text-xs/4 font-normal text-[#656565]">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        id="first-name"
                        name="first-name"
                        type="text"
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
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
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-900/10 pb-[30px]">
                <h2 className="text-base/7 font-semibold text-gray-900">General Details</h2>
                <div className="mt-[30px] grid grid-cols-1 md:grid-cols-3 gap-x-[25px] gap-y-[26px]">
                  <div className="">
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

                  <div className="">
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

                  <div className="">
                    <label htmlFor="date-of-birth" className="block text-xs/4 font-normal text-[#656565]">
                      Date of Birth
                    </label>
                    <div className="mt-2">
                      <div className="relative">
                        <input
                          id="date-of-birth"
                          name="date-of-birth"
                          type="text"
                          placeholder="Select Date"
                          onChange={handleChange}
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="">
                    <label htmlFor="blood-group" className="block text-xs/4 font-normal text-[#656565]">
                      Blood Group
                    </label>
                    <div className="mt-2">
                      <div className="relative">
                        <select
                          id="blood-group"
                          name="blood-group"
                          onChange={handleChange}
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 appearance-none"
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="">
                    <label htmlFor="aadhaar-card-number" className="block text-xs/4 font-normal text-[#656565]">
                      Aadhaar Card Number
                    </label>
                    <div className="mt-2">
                      <input
                        id="aadhaar-card-number"
                        name="aadhaar-card-number"
                        type="text"
                        onChange={handleChange}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="">
                    <label htmlFor="pan-card-number" className="block text-xs/4 font-normal text-[#656565]">
                      Pan Card Number
                    </label>
                    <div className="mt-2">
                      <input
                        id="pan-card-number"
                        name="pan-card-number"
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
                  <div className="">
                    <label htmlFor="role_type" className="block text-xs/4 font-normal text-[#656565]">
                      Select Department <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
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
                      {errors.role_type && <p className="mt-1 text-xs text-red-500">{errors.role_type}</p>}
                    </div>
                  </div>
                  <div className="">
                    <label htmlFor="user_role" className="block text-xs/4 font-normal text-[#656565]">
                      Select Specialisation <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
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
                      {errors.user_role && <p className="mt-1 text-xs text-red-500">{errors.user_role}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full flex justify-between border-b border-gray-900/10 pb-[30px]">
                <h1 className="font-medium text-sm mb-2">Availability</h1>
                <div className="flex gap-6">
                  <div className="flex flex-col gap-2.5">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <div key={day} className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={day.toLowerCase()}
                          checked={availability[day.toLowerCase()].enabled}
                          onChange={e => handleAvailabilityChange(day.toLowerCase(), 'enabled', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label htmlFor={day.toLowerCase()} className="font-normal text-[14px] leading-[24px]">
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>

                  {[0, 1, 2].map(slot => (
                    <div key={slot} className="flex flex-col gap-2.5">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, i) => (
                        <div key={day + slot} className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            id={`${day}-${slot}`}
                            checked={availability[day][slot === 0 ? 'morning' : slot === 1 ? 'afternoon' : 'evening']}
                            onChange={e => handleAvailabilityChange(day, slot === 0 ? 'morning' : slot === 1 ? 'afternoon' : 'evening', e.target.checked)}
                            disabled={!availability[day].enabled}
                            className="w-4 h-4"
                          />
                          <label htmlFor={`${day}-${slot}`} className="font-normal text-[14px] leading-[24px]">
                            {slot === 0 && '8AM - 12PM'}
                            {slot === 1 && '12PM-4PM'}
                            {slot === 2 && '4PM-8PM'}
                          </label>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="font-normal cursor-pointer py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded-[5px] cursor-pointer bg-[#5465FF] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-[#4054E6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5465FF] transition-colors"
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
