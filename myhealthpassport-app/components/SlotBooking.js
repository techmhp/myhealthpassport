'use client';

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { healthiansGetSlots, tyrocareGetSlots } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';

const SlotBooking = ({
  patient,
  onDateTimeSelect,
  onSlotSelect = null,
  vendor = null,
  healthiansZoneId = null,
  healthiansPincode = null,
  thyrocarePincode = null,
  selectedPackages = [],
  patientData = null,
  healthiansCoordinates = {},
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Convert 24-hour time to 12-hour format
  const timeIn12HourFormat = time24 => {
    if (!time24) return '';

    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;

    return `${hour12}:${minutes} ${ampm}`;
  };

  // Fetch slots based on vendor
  const fetchSlots = async date => {
    if (!date) return;

    setLoading(true);
    setTimeSlots([]);
    setSelectedTime(null);

    try {
      const currentDate = dayjs(date).format('YYYY-MM-DD');

      // THYROCARE SLOTS
      if (vendor === 'Thyrocare') {
        if (!thyrocarePincode || selectedPackages.length === 0) {
          console.log('Missing pincode or packages for Thyrocare slots');
          setLoading(false);
          return;
        }

        // Build payload for Thyrocare
        const payload = {
          appointmentDate: currentDate,
          pincode: parseInt(thyrocarePincode),
          patients: selectedPackages.map(pkg => ({
            name: patientData?.fullName || 'Test Patient', // ✅ From form
            gender: patientData?.gender || 'MALE', // ✅ From form
            age: parseInt(patientData?.age) || 10, // ✅ From form (minimum 1)
            ageType: 'YEAR',
            items: [
              {
                id: pkg.vendor_product_code || pkg.code,
                type: 'SSKU',
                name: pkg.display_name || pkg.name,
              },
            ],
          })),
        };

        console.log('Fetching Thyrocare slots with payload:', payload);
        const result = await tyrocareGetSlots(JSON.stringify(payload));
        // const result = JSON.parse(response);

        console.log('Thyrocare slots response:', result);

        if (result.status === true && result.data?.slots) {
          setTimeSlots(result.data.slots);
          console.log('Thyrocare slots fetched:', result.data.slots);
        } else {
          setTimeSlots([]);
          console.log('No Thyrocare slots available:', result);
          toastMessage(result.detail || 'No slots available for this date', 'error');
        }
      }
      // HEALTHIANS SLOTS
      else if (vendor === 'Healthians') {
        if (!healthiansZoneId || !healthiansPincode) {
          console.log('Missing zone_id or pincode for Healthians slots');
          setLoading(false);
          return;
        }

        const payload = {
          slot_date: currentDate,
          zone_id: healthiansZoneId,
          lat: healthiansCoordinates?.lat || '17.385044',
          long: healthiansCoordinates?.long || '78.486671',
          zipcode: healthiansPincode,
          get_ppmc_slots: 0,
          has_female_patient: 0,
        };

        console.log('Fetching Healthians slots with payload:', payload);
        const result = await healthiansGetSlots(JSON.stringify(payload));
        // const result = JSON.parse(response);

        console.log('Healthians slots response:', result);

        if (result.status === true && result.data?.slots) {
          setTimeSlots(result.data.slots);
          console.log('Healthians slots fetched:', result.data.slots);
        } else {
          setTimeSlots([]);
          console.log('No Healthians slots available:', result);
          if (result.detail) {
            toastMessage('No slots available for this date', 'warning');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setTimeSlots([]);
      toastMessage('Failed to fetch available slots', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentTimestamp = new Date();
    currentTimestamp.setHours(0, 0, 0, 0);

    setSelectedDate(currentTimestamp);
    setCurrentMonth(currentTimestamp);

    // notify parent once with today as default selection
    if (onDateTimeSelect) {
      onDateTimeSelect(currentTimestamp);
    }
  }, []);

  // Fetch slots when date changes
  useEffect(() => {
    if (selectedDate && vendor) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, vendor, healthiansZoneId, thyrocarePincode, selectedPackages]);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const blanks = Array(firstDay)
      .fill(null)
      .map((_, i) => <div key={`blank-${i}`} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 m-0.5 sm:m-1"></div>);

    const days = Array(daysInMonth)
      .fill(null)
      .map((_, i) => {
        const day = i + 1;
        const dayDate = new Date(year, month, day);
        dayDate.setHours(0, 0, 0, 0);

        const isToday = dayDate.getTime() === today.getTime();
        const isPast = dayDate < today;
        const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;

        return (
          <div
            key={`day-${day}`}
            onClick={() => {
              if (!isPast) {
                const newDate = new Date(year, month, day);
                setSelectedDate(newDate);
                setSelectedTime(null);

                // Notify parent component
                if (onDateTimeSelect) {
                  onDateTimeSelect(newDate);
                }
              }
            }}
            className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center m-0 sm:m-0.5 rounded-full text-xs sm:text-sm
              ${isSelected ? 'bg-blue-500 text-white' : 'text-[#4A5660]'}
              ${isToday && !isSelected ? 'border border-blue-500' : ''}
              ${isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-300'}`}
          >
            {day}
          </div>
        );
      });

    return [...blanks, ...days];
  };

  const getMonthYearString = () => {
    const options = { month: 'long', year: 'numeric' };
    return currentMonth.toLocaleDateString('en-US', options);
  };

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (newMonth.getMonth() >= today.getMonth() && newMonth.getFullYear() >= today.getFullYear()) {
      setCurrentMonth(newMonth);
    }
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const handleSlotSelection = slot => {
    // For Thyrocare: use start_time, for Healthians: use slot_time
    const timeValue = vendor === 'Thyrocare' ? slot.start_time : slot.slot_time;
    const slotId = vendor === 'Thyrocare' ? slot.slot_id : slot.stm_id;

    setSelectedTime(timeValue);
    console.log(`${vendor} slot selected:`, slot);

    // Notify parent with slot ID
    if (onSlotSelect) {
      onSlotSelect(slotId, timeValue);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-[45px]">
      {/* Date Selection */}
      <div className="col-span-1">
        <h2 className="font-medium text-sm leading-[100%] tracking-[0] mb-3 sm:mb-5">Select Appointment Date</h2>
        <div className="border border-[#DCDCDC] rounded-lg p-4 sm:p-6 bg-white">
          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-3 sm:mb-5">
            <button
              onClick={goToPreviousMonth}
              className="text-[#B5BEC6] text-lg"
              disabled={currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()}
            >
              &lt;
            </button>
            <span className="font-medium text-sm text-[#4A5660]">{getMonthYearString()}</span>
            <button onClick={goToNextMonth} className="text-[#B5BEC6] text-lg">
              &gt;
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 mb-1 sm:mb-2 gap-1 sm:gap-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center text-xs sm:text-sm font-medium text-[#B5BEC6]">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">{generateCalendarDays()}</div>
        </div>
      </div>

      {/* Time Selection - For BOTH vendors */}
      <div className="col-span-1">
        <h2 className="font-medium text-sm leading-[100%] tracking-[0] mb-5 sm:mb-10">Select Appointment Time</h2>
        {loading ? (
          <div className="text-sm text-gray-500">Loading slots...</div>
        ) : timeSlots.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-2 sm:gap-x-3 md:gap-x-[17px] gap-y-2 sm:gap-y-3 md:gap-y-[15px]">
            {timeSlots.map((slot, index) => {
              // Handle different slot structures
              const timeValue = vendor === 'Thyrocare' ? slot.start_time : slot.slot_time;
              const displayTime = vendor === 'Thyrocare' ? slot.display : timeIn12HourFormat(slot.slot_time);
              const isSelected = selectedTime === timeValue;

              return (
                <button
                  key={`${slot.slot_id || slot.stm_id}-${index}`}
                  onClick={() => handleSlotSelection(slot)}
                  className={`
                    text-center rounded-[3px] border py-1 sm:py-[5px] px-2 sm:px-[10px] text-xs font-medium
                    ${isSelected ? 'border-blue-500 border-2 bg-blue-50 text-blue-700' : 'bg-white border-[#DCDCDC] text-black hover:border-blue-300'}
                  `}
                >
                  {displayTime}
                </button>
              );
            })}
          </div>
        ) : selectedDate ? (
          <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded-md">No slots available for this date. Please try another date.</div>
        ) : (
          <div className="text-sm text-gray-500">Please select a date</div>
        )}
      </div>
    </div>
  );
};

export default SlotBooking;
