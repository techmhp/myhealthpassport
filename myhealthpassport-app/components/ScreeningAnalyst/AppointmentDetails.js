import { useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import ConsultationBooking from '@/components/ConsultationBooking';
import { rescheduleAppointment } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import Link from 'next/link';

const AppointmentDetails = ({ appointments, children = [] }) => {
  const { schoolid, studentId } = useParams();
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper function to format date
  const formatDate = dateStr => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    return `${day}${suffix} ${month} ${year}`;
  };

  // Helper function to format time
  const formatTime = timeStr => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hours}:${minutes} (${displayHour}:${minutes} ${period})`;
  };

  // Check if appointment can be rescheduled
  // const canModifyAppointment = status => {
  //   return ['confirmed', 'pending', 'CONFIRMED', 'PENDING'].includes(status);
  // };

  // // Check if appointment is in the past
  // const isPastAppointment = (slotDate, slotTime) => {
  //   const appointmentDateTime = new Date(`${slotDate}T${slotTime}`);
  //   return appointmentDateTime < new Date();
  // };

  // Handle Reschedule - Open modal
  const handleReschedule = appointment => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  // Submit reschedule
  const handleSubmitReschedule = async (newDate, newTime) => {
    setLoading(true);
    try {
      const payload = {
        patient_id: parseInt(studentId),
        consultation_id: selectedAppointment.consultation_id,
        new_slot_date: newDate,
        new_slot_time: newTime,
      };

      const response = await rescheduleAppointment(JSON.stringify(payload));

      if (response.status === true) {
        toastMessage('Appointment rescheduled successfully', 'success');
        setShowRescheduleModal(false);
        setSelectedAppointment(null);

        window.location.reload();
      } else {
        toastMessage(response.message || 'Failed to reschedule', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      toastMessage('Failed to reschedule appointment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full flex flex-col gap-10 pt-8 pr-8 pb-8 pl-8 rounded-bl-lg rounded-br-lg border-t-0 border-r border-b border-l border-solid border-[#DCDCDC]">
        <div className="w-full flex justify-between">
          <label className="block text-sm/6 font-semibold text-gray-900 w-[45%]">Appointment Details</label>
          <div className="w-[55%] flex flex-col gap-3">
            {appointments && appointments.length > 0 ? (
              appointments.map((appointment, index) => {
                // const isPast = isPastAppointment(appointment.slot_date, appointment.slot_time);
                // const canModify = canModifyAppointment(appointment.booking_status) && !isPast;

                return (
                  <div key={appointment.consultation_id || index}>
                    <div className="flex flex-col gap-[20px] w-full">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2.5">
                          <Image src="/iconx/profile-image.svg" alt="profile" width={43} height={43} className="rounded-full" />
                          <span className="font-medium text-[14px]">{appointment.doctor_fullname}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="font-normal text-[14px] m-0">
                            Date: <span className="font-medium">{formatDate(appointment.slot_date)}</span>
                          </p>
                          <p className="font-normal text-[14px] m-0">
                            Time: <span className="font-medium">{formatTime(appointment.slot_time)}</span>
                          </p>
                        </div>
                        <div className="border border-[#B3CBFF]"></div>
                        <div className="flex flex-col gap-[10px] text-[14px]">
                          <div className="flex items-center justify-between">
                            <span className="font-normal">Consultation Fees</span>
                            <span className="font-normal">₹{appointment.consult_fee}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-normal">Platform Fees</span>
                            <span className="font-normal">₹0</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-normal">Platform Discount</span>
                            <span className="font-normal text-[#000]">- ₹0</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-normal">Payment Status</span>
                            {/* <span
                              className={`font-medium ${
                                appointment.booking_status.toLowerCase() === 'confirmed'
                                  ? 'text-green-600'
                                  : appointment.booking_status.toLowerCase() === 'cancelled'
                                  ? 'text-red-600'
                                  : 'text-orange-600'
                              }`}
                            >
                              {appointment.booking_status}
                            </span> */}
                            <span className="font-normal">{appointment?.booking_status}</span>
                          </div>
                          <div className="flex items-center justify-between font-semibold">
                            <span>Total Amount</span>
                            <span>₹{appointment.consult_fee}</span>
                          </div>
                        </div>
                      </div>

                      {/* Reschedule Button */}
                      {/* {canModify && ( */}
                      <>
                        <div className="flex justify-center w-full">
                          <button
                            onClick={() => handleReschedule(appointment)}
                            className="w-full px-[20px] py-[10px] rounded-[5px] border border-[#5465FF] text-[#5465FF] font-normal text-center hover:bg-[#5465FF] hover:text-white transition-colors whitespace-nowrap"
                          >
                            Reschedule Appointment
                          </button>
                          {/* <button className="w-full px-[20px] py-[10px] gap-[10px] rounded-[5px] border border-[#FF5454] text-[#FF5454] text-[14px]  font-normal text-center">
                              Cancel Appointment
                            </button> */}
                        </div>
                      </>

                      <Link
                        href={`/health-buddy/roster/${schoolid}/student/${studentId}/book-appointment/experts`}
                        className="rounded-[5px] bg-indigo-500 w-full h-[40px] px-5 py-2 mt-4 text-sm font-normal text-white text-center shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 whitespace-nowrap"
                        disabled={true}
                      >
                        Book New Appointment
                      </Link>
                      {/* )} */}

                      {/* Status Messages */}
                      {/* {isPast && appointment.booking_status.toLowerCase() !== 'cancelled' && (
                        <p className="text-sm text-gray-500 text-center">This appointment has already passed</p>
                      )}
                      {appointment.booking_status.toLowerCase() === 'cancelled' && (
                        <p className="text-sm text-red-600 text-center">This appointment has been cancelled</p>
                      )} */}
                    </div>

                    {index < appointments.length - 1 && <div className="border-t border-[#DCDCDC] my-6"></div>}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-sm">No appointments found</p>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-transparent bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[10px] border border-[#B3CBFF] w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="font-semibold text-[18px]">Reschedule Appointment</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Current: {formatDate(selectedAppointment.slot_date)} at {formatTime(selectedAppointment.slot_time)}
                </p>
              </div>
              <button onClick={() => setShowRescheduleModal(false)} className="cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 4L12 12" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <ConsultationBooking
                children={children}
                expertDetails={{
                  expert_id: selectedAppointment.doctor_id,
                  first_name: selectedAppointment.doctor_fullname?.split(' ')[1] || '',
                  last_name: selectedAppointment.doctor_fullname?.split(' ')[2] || '',
                  consultation_charges: selectedAppointment.consult_fee,
                  profile_image_url: '/iconx/profile-image.svg',
                }}
                isReschedule={true}
                existingAppointment={selectedAppointment}
                studentId={studentId}
                onReschedule={handleSubmitReschedule}
                onCancel={() => setShowRescheduleModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppointmentDetails;
