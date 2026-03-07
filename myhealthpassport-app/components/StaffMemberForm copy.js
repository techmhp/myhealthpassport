'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import nookies from 'nookies';
import { roleConstancts } from '@/services/generalApis';
import { createStaffMember } from '@/services/secureApis';
import { formatString } from '@/helpers/utilities';
import { Plus } from 'lucide-react';

export default function StaffMemberForm() {
  const router = useRouter();
  const cookies = nookies.get();
  const fileInputRef = useRef(null);
  const [root, setRoot] = React.useState(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [roletypes, setRoleTpes] = useState({});

  const [formData, setFormData] = useState({
    role_type: '',
    user_role: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    phone: '',
    email: '',
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

  const handleChange = async e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (file === null) {
      alert('Please choose the profile logo');
      return;
    }
    formData['profile_image'] = file;
    try {
      const response = await createStaffMember(formData);
      // console.log('Staff Creation response', response);
      if (response.status === true) {
        alert(response.message);
        router.push(`/${root}/staff`);
      }
    } catch (err) {
      alert(err);
      // console.log('Staff Creation failed', err);
    }
  };

  return (
    <form method="POST" onSubmit={handleSubmit} encType="multipart/form-data">
      <div className="px-2 sm:px-6 md:px-10 lg:px-14 grid gap-4 md:gap-8 lg:gap-13">
        <div className="flex flex-col sm:flex-row sm:items-center gap-y-3 gap-x-4 md:gap-x-6 w-full">
          {/* Profile Image Upload */}
          <div
            onClick={handleImageClick}
            className="relative w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] bg-[#F3F7FA] rounded-full flex items-center justify-center cursor-pointer overflow-hidden"
          >
            {preview ? <img src={preview} alt="Profile" className="w-full h-full object-cover rounded-full" /> : <Plus className="w-6 h-6 text-gray-500" />}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
          </div>

          {/* Profile Info */}
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">
              {formData['first_name'] !== '' ? `${formData['first_name']} ${formData['middle_name']} ${formData['last_name']}` : '--'}
            </h2>
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
              {/* Basic Details Section */}
              <div className="border-b border-gray-900/10 pb-[30px]">
                <h2 className="text-base/7 font-semibold text-gray-900">Basic Details</h2>
                <div className="mt-[30px] grid grid-cols-1 md:grid-cols-3 gap-x-[25px] gap-y-[26px]">
                  <div className="">
                    <label htmlFor="first_name" className="block text-xs/4 font-normal text-[#656565]">
                      Select Role Type
                    </label>
                    <div className="mt-2">
                      <select
                        name="role_type"
                        onChange={handleChange}
                        className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white  px-3 py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        required
                      >
                        <option value="">Select Role Type</option>
                        {roletypes.status == true && roletypes.data.roles_details.length > 0
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
                    </div>
                  </div>
                  <div className="">
                    <label htmlFor="first_name" className="block text-xs/4 font-normal text-[#656565]">
                      Select Role
                    </label>
                    <div className="mt-2">
                      <select
                        name="user_role"
                        onChange={handleChange}
                        className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white  px-3 py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        required
                      >
                        <option value="">Select User Role</option>
                        {formData.role_type !== ''
                          ? roletypes.data.roles_details.map(type =>
                            type.role_type === formData.role_type
                              ? type.roles.map((deails, index) => (
                                <option key={index} value={deails.role}>
                                  {' '}
                                  {formatString(deails.role.toLowerCase())}{' '}
                                </option>
                              ))
                              : ''
                          )
                          : ''}
                      </select>
                    </div>
                  </div>
                  <div className="">
                    <label htmlFor="first_name" className="block text-xs/4 font-normal text-[#656565]">
                      First Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        onChange={handleChange}
                        autoComplete="first_name"
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        required
                      />
                    </div>
                  </div>

                  <div className="">
                    <label htmlFor="middle_name" className="block text-xs/4 font-normal text-[#656565]">
                      Middle Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="middle_name"
                        name="middle_name"
                        type="text"
                        onChange={handleChange}
                        autoComplete="middle_name"
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        required
                      />
                    </div>
                  </div>

                  <div className="">
                    <label htmlFor="last_name" className="block text-xs/4 font-normal text-[#656565]">
                      Last Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        onChange={handleChange}
                        autoComplete="last_name"
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Details Section */}
              <div className="border-b border-gray-900/10 pb-[30px]">
                <h2 className="text-base/7 font-semibold text-gray-900">Contact Details</h2>
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
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
                <button onClick={() => router.back()} className="font-normal cursor-pointer  py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap">
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded-[5px] cursor-pointer bg-indigo-500  px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
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
