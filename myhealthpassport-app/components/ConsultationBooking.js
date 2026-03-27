'use client';

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import Image from 'next/image';
import { ChangeDateFormat, formatFullName, isValidUrl, toastMessage, timeIn12HourFormat } from '@/helpers/utilities';
import { usePathname, useRouter } from 'next/navigation';
import InlineSpinner from './UI/InlineSpinner';
import { getSlotsByExpertId, blockSlot, storeTransaction, bookAConsultation } from '@/services/secureApis';
import ErrorModal from '@/components/UI/ErrorModal';

const ConsultationBooking = ({
  children = [],
  expertDetails,
  isReschedule = false,
  existingAppointment = null,
  studentId = null,
  onReschedule = null,
  onCancel = null,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConfirmedModal, setShowConfirmedModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const consultationFee = expertDetails.consultation_charges;
  const [selectedPatient, setSelectedPatient] = useState({});
  const [isPatientSelected, setIsPatientSelected] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [timeSlots, setTimeSlots] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const fetchSlots = async date => {
    try {
      const currentDate = date ? dayjs(date).format('YYYY-MM-DD') : '';
      const respose = await getSlotsByExpertId(expertDetails.expert_id, currentDate);
      const result = await JSON.parse(respose);
      if (result.status === true) {
        setTimeSlots(result.data.slots);
      } else if (result.status === false) {
        toastMessage(result.message, 'error');
      }
    } catch (error) {
      toastMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currenttimestamp = new Date();
    setSelectedDate(currenttimestamp);
    setCurrentMonth(currenttimestamp);
    setUserInfo(JSON.parse(atob(localStorage.getItem('user_info'))));
    fetchSlots(currenttimestamp);
    if (children.length > 0 && Object.keys(selectedPatient).length === 0) {
      const firstChild = children[0];
      onSelectPatient(firstChild);
    }
  }, [children]);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const onSelectPatient = child => {
    setIsPatientSelected(child.student_id);
    setSelectedPatient({
      id: child.student_id,
      name: child.first_name ? formatFullName(child) : '',
      dob: child.dob ? child.dob : '',
      gender: child.gender ? child.gender : '',
      image: child.image ? child.image : '',
    });
  };

  const selectedDateSlots = async date => {
    await fetchSlots(date);
  };

  // Function to generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Generate blank spaces for days before the first of the month
    const blanks = Array(firstDay)
      .fill(null)
      .map((_, i) => <div key={`blank-${i}`} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 m-0.5 sm:m-1"></div>);

    // Generate day cells
    const days = Array(daysInMonth)
      .fill(null)
      .map((_, i) => {
        const day = i + 1;
        const dayDate = new Date(year, month, day);
        dayDate.setHours(0, 0, 0, 0); // Set to beginning of day for comparison

        const isToday = dayDate.getTime() === today.getTime();
        const isPast = dayDate < today;
        const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;

        return (
          <div
            key={`day-${day}`}
            onClickCapture={() => selectedDateSlots(new Date(year, month, day))}
            onClick={() => !isPast && setSelectedDate(new Date(year, month, day))}
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

  // Get month name and year
  const getMonthYearString = () => {
    const options = { month: 'long', year: 'numeric' };
    return currentMonth.toLocaleDateString('en-US', options);
  };

  // Handle month navigation
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    // Only allow going back to current month
    if (newMonth.getMonth() >= today.getMonth() && newMonth.getFullYear() >= today.getFullYear()) {
      setCurrentMonth(newMonth);
    }
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Generate time slots
  const generateTimeSlots = () => {
    selectedDate &&
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();

    if (Object.keys(timeSlots).length > 0) {
      return timeSlots.map(slot => {
        const isSelected = slot.time === selectedTime;
        return {
          time: slot.time,
          isDisabled: slot.status === 'available' ? false : true,
          isSelected,
        };
      });
    } else {
      return [];
    }
  };

  // Days of week
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Available time slots based on selected date
  const availableTimeSlots = generateTimeSlots();

  // Handle saving patient data and opening confirmation modal
  const ShowPreviewModel = () => {
    if (Object.keys(selectedPatient).length === 0) {
      if (isReschedule !== true) {
        toastMessage('Please select a patient', 'error');
        return;
      }
    }

    if (selectedDate === null) {
      toastMessage('Please select a date', 'error');
      return;
    }
    if (selectedTime === null) {
      toastMessage('Please select a time slot', 'error');
      return;
    }
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
  };

  const closeConfirmedModal = () => {
    setShowConfirmedModal(false);
  };

  const loadRazorpay = () => {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const blockTheSlot = async () => {
    setLoading(true);
    try {
      const postObj = {
        patient_id: selectedPatient.id,
        doctor_id: expertDetails.expert_id,
        slot_date: dayjs(selectedDate).format('YYYY-MM-DD'),
        slot_time: selectedTime,
        consult_fee: consultationFee,
      };
      const res = await blockSlot(JSON.stringify(postObj));
      if (res.status === true) {
        toastMessage(res.message, 'success');
      } else if (res.status === false) {
        toastMessage(res.message, 'error');
      }
    } catch (err) {
      toastMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setShowConfirmModal(false);
    blockTheSlot();

    // Load Razorpay SDK
    const res = await loadRazorpay();
    if (!res) {
      alert('Razorpay SDK failed to load. Check your internet connection.');
      return;
    }

    // Create order from API route
    const orderRes = await fetch('/api/razorpay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: consultationFee, currency: 'INR' }), // example: ₹500
    });

    const order = await orderRes.json();

    if (!order.id) {
      alert('Unable to create order. Please try again.');
      setLoading(false);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'My Health Passport',
      description: 'Book a consultation with our expert',
      order_id: order.id,
      handler: async function (response) {
        verifyTransaction(response);
      },
      prefill: {
        name: formatFullName(userInfo),
        email: userInfo.primary_email,
        contact: userInfo.primary_mobile,
        // email: 'shreenivas@gmail.com',
        // contact: '9876543210',
      },
      theme: {
        color: '#3399cc',
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
    setLoading(false);
  };

  const verifyTransaction = async response => {
    setLoading(true);
    try {
      const verify = await fetch('/api/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      });
      const verifyRes = await verify.json();
      saveTransaction(verifyRes.payment);
    } catch (err) {
      console.log(err);
      toastMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveTransaction = async paymentInfo => {
    setLoading(true);
    try {
      const postObj = {
        transaction_id: paymentInfo.id,
        order_id: paymentInfo.order_id,
        invoice_id: paymentInfo.invoice_id,
        amount: paymentInfo.amount / 100,
        currency: paymentInfo.currency,
        status: paymentInfo.status === 'captured' ? 'success' : 'failed',
        mode: paymentInfo.method,
        amount_refunded: paymentInfo.amount_refunded,
        description: paymentInfo.description,
        email: paymentInfo.email,
        contact: paymentInfo.contact,
        tax: paymentInfo.tax,
        error_description: paymentInfo.error_description,
        error_reason: paymentInfo.error_reason,
      };
      const response = await storeTransaction(JSON.stringify(postObj));
      if (response.status === true) {
        savebookConsultation(response.data);
      } else if (response.status === false) {
        toastMessage(response.message, 'error');
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toastMessage(err.message, 'error');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const savebookConsultation = async transactionInfo => {
    setLoading(true);
    try {
      // If reschedule mode, call reschedule API instead
      if (isReschedule && existingAppointment && onReschedule) {
        const newDate = ChangeDateFormat(selectedDate);
        const newTime = selectedTime;

        await onReschedule(newDate, newTime);
        return;
      }

      // Normal booking flow
      const postObj = {
        doctor_id: expertDetails.expert_id,
        patient_id: selectedPatient.id,
        slot_date: selectedDate ? ChangeDateFormat(selectedDate) : '',
        slot_time: selectedTime,
        consult_fee: consultationFee,
        booking_status: transactionInfo.status === 'captured' ? 'CONFIRMED' : 'PENDING',
        transaction_type: 'Consultation',
        tx_id: transactionInfo.tx_id,
      };

      const response = await bookAConsultation(JSON.stringify(postObj));
      if (response.status === true) {
        // setShowConfirmedModal(true);
        toastMessage('Appointment Confirmed', 'success');
        if (userInfo?.user_role === 'HEALTH_BUDDY') {
          window.history.go(-2);
        } else if (userInfo?.user_role === 'PARENT') {
          router.push('/parent/home');
        } else {
          router.back();
        }
      }
    } catch (err) {
      toastMessage(err.message, 'error');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="w-full h-screen flex justify-center items-center bg-transparent">
        <InlineSpinner />
      </div>
    );

  return (
    <main>
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 lg:gap-[40px] xl:gap-[80px] mt-6 lg:mt-10">
        <div className="lg:col-span-3">
          <div className="pr-0 lg:pr-4">
            {!isReschedule && (
              <>
                <h2 className="font-medium text-sm leading-[100%] tracking-[0] mb-3 sm:mb-5">Select children</h2>
                <div className="flex flex-col gap-3 sm:gap-4">
                  {children && Array.isArray(children) && children.length > 0
                    ? children.map((child, index) => (
                        <div
                          key={index}
                          onClick={() => onSelectPatient(child)}
                          className={classNames(
                            isPatientSelected === child.student_id ? 'border-2 border-[#5389FF]' : 'border border-gray-400',
                            'cursor-pointer flex items-center gap-x-2 p-3 sm:p-4 rounded-lg hover:border-2 hover:border-[#5389FF]'
                          )}
                        >
                          <Image
                            alt="profile"
                            src={isValidUrl(child.image) ? child.image : '/iconx/profile-image.svg'}
                            className="size-10 sm:size-12 rounded-full"
                            width={70}
                            height={70}
                          />
                          <div>
                            <h3 className="text-sm tracking-tight text-gray-900">{formatFullName(child)}</h3>
                          </div>
                        </div>
                      ))
                    : ''}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="lg:col-span-7">
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

            {/* Time Selection */}
            <div className="col-span-1">
              <h2 className="font-medium text-sm leading-[100%] tracking-[0] mb-5 sm:mb-10">Select Appointment Time</h2>
              {Object.keys(availableTimeSlots).length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-2 sm:gap-x-3 md:gap-x-[17px] gap-y-2 sm:gap-y-3 md:gap-y-[15px]">
                  {availableTimeSlots.map(({ time, isDisabled, isSelected }, index) => (
                    <button
                      key={`${time} -${index} `}
                      onClick={() => !isDisabled && setSelectedTime(time)}
                      disabled={isDisabled}
                      className={`
                  text-center rounded-[3px] border py-1 sm:py-[5px] px-2 sm:px-[10px] text-xs font-medium
                  ${
                    isSelected
                      ? 'border-blue-500 border-2 bg-white text-black'
                      : isDisabled
                      ? 'bg-[#E7E7E7] text-[#9B9B9B] border-[#DCDCDC] cursor-not-allowed'
                      : 'bg-white border-[#DCDCDC] text-black'
                  }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm">Slots not available for today</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Book lab tests */}
      {pathname.startsWith('/parent/book/lab-tests') ? null : (
        <div className="flex justify-end mt-3 sm:mt-4 md:mt-[22px]">
          <button
            onClick={ShowPreviewModel}
            className="rounded-[5px] py-2 sm:pt-[10px] sm:pb-[10px] px-4 sm:pr-[20px] sm:pl-[20px] bg-[#5465FF] text-white flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-xs sm:text-sm font-normal">{isReschedule ? 'Confirm Reschedule' : 'Book Appointment'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 sm:size-5" width={24} height={24}>
              <path
                fillRule="evenodd"
                d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-[#2423239e] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="flex flex-col gap-4 sm:gap-[38px] rounded-[10px] border border-[#B3CBFF] p-4 sm:p-6 md:p-8 bg-white w-full max-w-sm sm:max-w-md">
            {/* Modal Header */}
            <div>
              <div className="flex justify-between items-center">
                <span className="font-[600] text-base sm:text-lg text-black">Confirm Appointment</span>
                <div onClick={closeConfirmModal} className="cursor-pointer">
                  <Image src="/health-records/cross-red.svg" width={16} height={16} alt="cross" />
                </div>
              </div>
              <span className="font-medium text-xs sm:text-sm text-black mt-2 sm:mt-[10px]">Please review the appointment details below</span>
            </div>
            <div className="flex gap-4 sm:gap-6 md:gap-5">
              <div className="flex-1 flex-col gap-1.5 sm:gap-2.5">
                <p className="font-medium text-xs sm:text-sm m-0">Patient</p>
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  <Image
                    src={isValidUrl(selectedPatient.image) ? selectedPatient.image : '/iconx/profile-image.svg'}
                    alt="Expert"
                    className="rounded-full size-10"
                    width={36}
                    height={36}
                  />
                  <p className="text-xs sm:text-sm m-0 whitespace-wrap">{selectedPatient.name}</p>
                </div>
              </div>
              {/* divider */}
              <div className="border border-[#7D7D7D]"></div>
              <div className="flex-1 flex-col gap-1.5 sm:gap-2.5">
                <p className="font-medium text-xs sm:text-sm m-0">Expert</p>
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  <Image
                    src={isValidUrl(expertDetails?.profile_image_url) ? expertDetails.profile_image_url : '/iconx/profile-image.svg'}
                    alt="Expert"
                    className="rounded-full size-10"
                    width={36}
                    height={36}
                  />
                  <p className="text-xs sm:text-sm m-0 whitespace-wrap">{formatFullName(expertDetails)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
              <p className="m-0 whitespace-nowrap text-xs sm:text-sm">
                Date: <span className="font-medium">{dayjs(selectedDate).format('DD MMMM YYYY')}</span>
              </p>
              <p className="m-0 whitespace-nowrap text-xs sm:text-sm">
                Time: <span className="font-medium">{`${selectedTime} (${timeIn12HourFormat(selectedTime)})`}</span>
              </p>
            </div>
            <div className="border border-[#B3CBFF]"></div>
            <div className="flex flex-col gap-1.5 sm:gap-2.5">
              <div className="flex justify-between">
                <p className="m-0 whitespace-nowrap text-xs sm:text-sm">Consultation Fees</p>
                <p className="m-0 whitespace-nowrap text-xs sm:text-sm">{consultationFee}</p>
              </div>
              <div className="flex justify-between">
                <p className="m-0 whitespace-nowrap text-xs sm:text-sm font-medium">Total Amount</p>
                <p className="m-0 whitespace-nowrap text-xs sm:text-sm font-medium">{consultationFee}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 md:gap-8">
              <button
                onClick={closeConfirmModal}
                className="w-full sm:flex-1 rounded-[5px] border border-[#5465FF] py-2 sm:pt-[10px] sm:pb-[10px] px-4 sm:pr-[20px] sm:pl-[20px]"
              >
                Close
              </button>
              <button
                onClick={isReschedule ? () => savebookConsultation({ status: 'captured' }) : handlePayment}
                className="w-full sm:flex-1 rounded-[5px] bg-[#5465FF] py-2 sm:pt-[10px] sm:pb-[10px] px-4 sm:pr-[20px] sm:pl-[20px] text-white whitespace-nowrap"
              >
                {isReschedule ? 'Confirm Reschedule' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} />

      {/* Confirmed Modal */}
      {showConfirmedModal && (
        <div className="fixed inset-0 bg-[#2423239e] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 md:gap-[38px] rounded-[10px] border border-[#B3CBFF] p-4 sm:p-6 md:p-8 bg-white w-full max-w-xs sm:max-w-sm md:max-w-[400px]">
            {/* Modal Header */}
            <div onClick={closeConfirmedModal} className="cursor-pointer flex justify-end w-full">
              <Image src="/health-records/cross-red.svg" width={14} height={14} alt="cross" />
            </div>
            <div className="">
              <Image src="/iconx/check-circle-blue.svg" alt="check" width={40} height={40} className="sm:size-12" />
            </div>
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <p className="font-medium text-sm m-0">Appointment Confirmed</p>
              <p className="text-xs sm:text-sm m-0 text-center">A confirmation has been sent to your email.</p>
            </div>
            {/* <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-3 sm:gap-4 md:gap-8">
              <button className="w-full sm:flex-1 rounded-[5px] border border-[#5465FF] py-2 sm:pt-[10px] sm:pb-[10px] px-4 sm:pr-[20px] sm:pl-[20px] whitespace-nowrap">
                Share on WhatsApp
              </button>
              <button className="w-full sm:flex-1 rounded-[5px] bg-[#5465FF] py-2 sm:pt-[10px] sm:pb-[10px] px-4 sm:pr-[20px] sm:pl-[20px] text-white whitespace-nowrap">
                Download
              </button>
            </div> */}
          </div>
        </div>
      )}
    </main>
  );
};

export default ConsultationBooking;
