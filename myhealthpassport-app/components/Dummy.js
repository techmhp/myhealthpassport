import React, { useState } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { ChevronDownIcon, CalendarIcon, PlusCircleIcon } from '@heroicons/react/16/solid';
import { createExpertLogin } from '@/services/secureApis';

export default function ExpertForm() {
  const [availability, setAvailability] = useState({
    monday: { enabled: false, morning: false, afternoon: false, evening: false },
    tuesday: { enabled: true, morning: true, afternoon: true, evening: true },
    wednesday: { enabled: true, morning: true, afternoon: true, evening: true },
    thursday: { enabled: true, morning: true, afternoon: true, evening: true },
    friday: { enabled: true, morning: true, afternoon: true, evening: true },
    saturday: { enabled: true, morning: true, afternoon: true, evening: true },
    sunday: { enabled: true, morning: true, afternoon: true, evening: true },
  });

  const handleAvailabilityChange = (day, type, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: value,
      },
    }));
  };

  const handleSubmit = e => {
    e.preventDefault();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div onSubmit={handleSubmit}>
        <div className="space-y-12">
          {/* Basic Details Section */}
          <div className="border-b border-gray-200 pb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="expert-id" className="block text-sm font-medium text-gray-600 mb-2">
                  Expert ID
                </label>
                <input
                  id="expert-id"
                  name="expert-id"
                  type="text"
                  defaultValue="ABCD677GSF"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="first-name" className="block text-sm font-medium text-gray-600 mb-2">
                  First Name
                </label>
                <input
                  id="first-name"
                  name="first-name"
                  type="text"
                  defaultValue="Rohit"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="last-name" className="block text-sm font-medium text-gray-600 mb-2">
                  Last Name
                </label>
                <input
                  id="last-name"
                  name="last-name"
                  type="text"
                  defaultValue="Sharma"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-600 mb-2">
                  Gender <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-1">
                  <select
                    id="gender"
                    name="gender"
                    // value={formData.gender}
                    // onChange={handleChange}
                    // onBlur={handleBlur}
                    className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHERS">Others</option>
                  </select>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="date-of-birth" className="block text-sm font-medium text-gray-600 mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    id="date-of-birth"
                    name="date-of-birth"
                    type="text"
                    placeholder="Select Date"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="upload_photo" className="block text-sm font-medium text-gray-600 mb-2">
                  Upload Portrait <span className="text-red-600">*</span>
                </label>
                <div className="mt-2">
                  <input
                    id="fileInput"
                    type="file"
                    className="hidden"
                    // onChange={handleFileChange}
                    accept="image/jpeg"
                  />
                  <label htmlFor="fileInput">
                    <a type="button" className="rounded-full bg-blue-100 p-2 text-blue-500">
                      <PlusCircleIcon className="h-6 w-6" aria-hidden="true" />
                    </a>
                    {/* {file ? file.name : ''} */}
                  </label>
                  {/* {errors.profile_image && <p className="mt-1 text-xs text-red-600">{errors.profile_image}</p>} */}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="border-b border-gray-200 pb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Identity Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="phone-number" className="block text-sm font-medium text-gray-600 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone-number"
                  name="phone-number"
                  type="text"
                  defaultValue="+91"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue="aditya.aurora@gmail.com"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="blood-group" className="block text-sm font-medium text-gray-600 mb-2">
                  Blood Group
                </label>
                <div className="relative">
                  <select
                    id="blood-group"
                    name="blood-group"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
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
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* <div>
                <label htmlFor="aadhaar-card-number" className="block text-sm font-medium text-gray-600 mb-2">
                  Aadhaar Card Number
                </label>
                <input
                  id="aadhaar-card-number"
                  name="aadhaar-card-number"
                  type="text"
                  defaultValue="Aditya"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div> */}

              {/* <div>
                <label htmlFor="pan-card-number" className="block text-sm font-medium text-gray-600 mb-2">
                  Pan Card Number
                </label>
                <input
                  id="pan-card-number"
                  name="pan-card-number"
                  type="text"
                  defaultValue="XXXXX0000X"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div> */}
            </div>
          </div>

          {/* Clinic Details Section */}
          <div className="border-b border-gray-200 pb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Clinic Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="clinic-name" className="block text-sm font-medium text-gray-600 mb-2">
                  Clinic Name
                </label>
                <input
                  id="clinic-name"
                  name="clinic-name"
                  type="text"
                  defaultValue="Chronology Clinic Inc"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="location-link" className="block text-sm font-medium text-gray-600 mb-2">
                  Location Link
                </label>
                <input
                  id="location-link"
                  name="location-link"
                  type="text"
                  defaultValue="bit.ly/kidunf7"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* <div>
                <label htmlFor="clinic-phone" className="block text-sm font-medium text-gray-600 mb-2">
                  Phone Number
                </label>
                <input
                  id="clinic-phone"
                  name="clinic-phone"
                  type="text"
                  defaultValue="+91"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div> */}

              <div>
                <label htmlFor="clinic-email" className="block text-sm font-medium text-gray-600 mb-2">
                  Email
                </label>
                <input
                  id="clinic-email"
                  name="clinic-email"
                  type="email"
                  defaultValue="aditya.aurora@gmail.com"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* <div>
                <label htmlFor="link" className="block text-sm font-medium text-gray-600 mb-2">
                  Link
                </label>
                <input
                  id="link"
                  name="link"
                  type="text"
                  defaultValue="chronology@itsfiveoclock.com"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div> */}

              {/* <div>
                <label htmlFor="clinic-name-2" className="block text-sm font-medium text-gray-600 mb-2">
                  Clinic Name
                </label>
                <input
                  id="clinic-name-2"
                  name="clinic-name-2"
                  type="text"
                  defaultValue="Chronology Clinic Time Inc"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div> */}

              {/* License / Registration Number */}
              <div>
                <label htmlFor="license-number" className="block text-sm font-medium text-gray-600 mb-2">
                  License / Registration Number
                </label>
                <input
                  id="license-number"
                  name="license-number"
                  type="text"
                  placeholder="Enter license number"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="address_line1" className="block text-xs/4 font-normal text-[#656565]">
                  Address Line 1 <span className="text-red-600">*</span>
                </label>
                <div className="mt-2">
                  <input
                    id="address_line1"
                    name="address_line1"
                    type="text"
                    // value={formData.address_line1}
                    // onChange={handleChange}
                    // onBlur={handleBlur}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                  {/* {errors.address_line1 && <p className="mt-1 text-xs text-red-600">{errors.address_line1}</p>} */}
                </div>
              </div>

              <div>
                <label htmlFor="address_line2" className="block text-xs/4 font-normal text-[#656565]">
                  Address Line 2
                </label>
                <div className="mt-2">
                  <input
                    id="address_line2"
                    name="address_line2"
                    type="text"
                    // value={formData.address_line2}
                    // onChange={handleChange}
                    // onBlur={handleBlur}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                  {/* {errors.address_line2 && <p className="mt-1 text-xs text-red-600">{errors.address_line2}</p>} */}
                </div>
              </div>

              <div>
                <label htmlFor="landmark" className="block text-xs/4 font-normal text-[#656565]">
                  Landmark
                </label>
                <div className="mt-2">
                  <input
                    id="landmark"
                    name="landmark"
                    type="text"
                    // value={formData.landmark}
                    // onChange={handleChange}
                    // onBlur={handleBlur}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                  {/* {errors.landmark && <p className="mt-1 text-xs text-red-600">{errors.landmark}</p>} */}
                </div>
              </div>

              <div>
                <label htmlFor="street" className="block text-xs/4 font-normal text-[#656565]">
                  Street Name <span className="text-red-600">*</span>
                </label>
                <div className="mt-2">
                  <input
                    id="street"
                    name="street"
                    type="text"
                    // value={formData.street}
                    // onChange={handleChange}
                    // onBlur={handleBlur}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                  {/* {errors.street && <p className="mt-1 text-xs text-red-600">{errors.street}</p>} */}
                </div>
              </div>

              <div>
                <label htmlFor="pincode" className="block text-xs/4 font-normal text-[#656565]">
                  Pincode <span className="text-red-600">*</span>
                </label>
                <div className="mt-2">
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    // value={formData.pincode}
                    // onChange={handleChange}
                    // onBlur={handleBlur}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                  {/* {errors.pincode && <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>} */}
                </div>
              </div>
              <div>
                <label htmlFor="country_code" className="block text-xs/4 font-normal text-[#656565]">
                  Country Calling Code <span className="text-red-600">*</span>
                </label>
                <div className="mt-2">
                  <input
                    id="country_code"
                    name="country_code"
                    type="text"
                    // value={formData.country_code}
                    // onChange={handleChange}
                    // onBlur={handleBlur}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                  {/* {errors.country_code && <p className="mt-1 text-xs text-red-600">{errors.country_code}</p>} */}
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="block text-xs/4 font-normal text-[#656565]">
                  Phone/Mobile <span className="text-red-600">*</span>
                </label>
                <div className="mt-2">
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    // value={formData.phone}
                    // onChange={handleChange}
                    // onBlur={handleBlur}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                  {/* {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>} */}
                </div>
              </div>

              <div>
                <label htmlFor="country" className="block text-xs/4 font-normal text-[#656565]">
                  Country <span className="text-red-600">*</span>
                </label>
                <div className="mt-2">
                  <input
                    id="country"
                    name="country"
                    type="text"
                    // value={formData.country}
                    // onChange={handleChange}
                    // onBlur={handleBlur}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                  {/* {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>} */}
                </div>
              </div>
            </div>
          </div>

          {/* Department Details Section */}
          <div className="border-b border-gray-200 pb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Department Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="select-specialisation" className="block text-sm font-medium text-gray-600 mb-2">
                  Select Specialisation
                </label>
                <div className="relative">
                  <select
                    id="select-specialisation"
                    name="select-specialisation"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">Select Specialisation</option>
                    <option value="pediatrician">Pediatrician</option>
                    <option value="dentist">Dentist</option>
                    <option value="eye-specialist">Eye specialist</option>
                    <option value="nutritionist">Nutritionist</option>
                    <option value="psychologist">Psychologist</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="designation" className="block text-sm font-medium text-gray-600 mb-2">
                  Designation
                </label>
                <input
                  id="designation"
                  name="designation"
                  type="text"
                  defaultValue="MD Chronology"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="years-experience" className="block text-sm font-medium text-gray-600 mb-2">
                  Years of Experience
                </label>
                <input
                  id="years-experience"
                  name="years-experience"
                  type="text"
                  defaultValue="14"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* <div>
                <label htmlFor="expert-specialty" className="block text-sm font-medium text-gray-600 mb-2">
                  Expert Speciality
                </label>
                <input
                  id="expert-specialty"
                  name="expert-specialty"
                  type="text"
                  defaultValue="Chronology"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div> */}

              {/* <div>
                <label htmlFor="select-department" className="block text-sm font-medium text-gray-600 mb-2">
                  Select Department
                </label>
                <div className="relative">
                  <select
                    id="select-department"
                    name="select-department"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">Select Department</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="neurology">Neurology</option>
                    <option value="orthopedics">Orthopedics</option>
                    <option value="pediatrics">Pediatrics</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div> */}
              {/* Consultation Duration */}
              <div>
                <label htmlFor="consultation-duration" className="block text-sm font-medium text-gray-600 mb-2">
                  Consultation Duration (mins)
                </label>
                <input
                  id="consultation-duration"
                  name="consultation-duration"
                  type="number"
                  defaultValue={30}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Max Consultations Per Day */}
              <div>
                <label htmlFor="max-consultations" className="block text-sm font-medium text-gray-600 mb-2">
                  Max Consultations Per Day
                </label>
                <input
                  id="max-consultations"
                  name="max-consultations"
                  type="number"
                  placeholder="Enter limit"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Consultation Charges */}
              <div>
                <label htmlFor="consultation-charges" className="block text-sm font-medium text-gray-600 mb-2">
                  Consultation Charges / Commission
                </label>
                <input
                  id="consultation-charges"
                  name="consultation-charges"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* License / Registration Number */}
              {/* <div>
                <label htmlFor="license-number" className="block text-sm font-medium text-gray-600 mb-2">
                  License / Registration Number
                </label>
                <input
                  id="license-number"
                  name="license-number"
                  type="text"
                  placeholder="Enter license number"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div> */}

              {/* Languages Spoken */}
              <div>
                <label htmlFor="languages-spoken" className="block text-sm font-medium text-gray-600 mb-2">
                  Languages Spoken
                </label>
                <input
                  id="languages-spoken"
                  name="languages-spoken"
                  type="text"
                  placeholder="E.g. English, Hindi"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Expert Experience Summary Section */}
          <div className="border-b border-gray-200 pb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Expert Experience Summary</h2>
            <div>
              <textarea
                id="experience-summary"
                name="experience-summary"
                rows={6}
                placeholder="Start Typing..."
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Availability Section */}
          <div className="w-full flex justify-between border-b border-gray-900/10 pb-[30px]">
            <h1 className="font-medium text-sm mb-2">Availability</h1>
            <div className="flex gap-6">
              {/* Days Column */}
              <div className="flex flex-col gap-2.5">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <div key={day} className="flex items-center gap-2.5">
                    <input type="checkbox" id={day.toLowerCase()} className="w-4 h-4" />
                    <label htmlFor={day.toLowerCase()} className="font-normal text-[14px] leading-[24px]">
                      {day}
                    </label>
                  </div>
                ))}
              </div>

              {/* Time Slot Columns */}
              {[0, 1, 2].map(slot => (
                <div key={slot} className="flex flex-col gap-2.5">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, i) => (
                    <div key={day + slot} className="flex items-center gap-2.5">
                      <input type="checkbox" id={`${day}-${slot}`} className="w-4 h-4" defaultChecked={day !== 'monday'} disabled={day === 'monday'} />
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

          {/* Buttons */}
          <div className="flex justify-center items-center gap-4 pt-8">
            <button
              type="button"
              className="px-6 py-2 border border-blue-500 text-blue-500 rounded-md text-sm font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
