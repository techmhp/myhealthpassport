import { useState, useEffect } from 'react';
import Link from 'next/link';
import { storeAppointmentDecision, getAppointmentDecision } from '@/services/secureApis';
import { useParams } from 'next/navigation';
import Spinner from '../UI/Spinner';
import { toastMessage } from '@/helpers/utilities';
import { useRouter } from 'next/navigation';

const NoAppointmentsView = ({ roleType, toggleAccordion }) => {
  const router = useRouter();
  const { schoolid, studentId } = useParams();
  const [formData, setFormData] = useState({
    student_id: studentId,
    appointment_status: '',
    specialist_role: roleType,
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [isDisabled, setDisabled] = useState(false);

  useEffect(() => {
    const fetchAppointmentData = async () => {
      try {
        const response = await getAppointmentDecision(studentId);
        const results = await JSON.parse(response);
        if (results.status && results?.data?.decisions) {
          const existingDecision = results.data.decisions.find(decision => decision.specialist_role === roleType);
          if (existingDecision) {
            setFormData(prev => ({
              ...prev,
              appointment_status: existingDecision.appointment_status,
              notes: existingDecision.notes || '',
            }));
          }
        }
      } catch (error) {}
    };
    if (studentId) {
      fetchAppointmentData();
    }
  }, [studentId, roleType]);

  const handleStatusChange = status => {
    setFormData(prev => ({
      ...prev,
      appointment_status: status,
    }));
    setDisabled(true);
  };

  const handleNotesChange = e => {
    setFormData(prev => ({
      ...prev,
      notes: e.target.value,
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      // Validation
      if (!formData.appointment_status) {
        toastMessage('Please select an appointment status', 'error');
        return;
      }
      const response = await storeAppointmentDecision(JSON.stringify(formData));
      if (response.status) {
        toastMessage(response.message, 'success');
      } else {
        toastMessage(response.message || 'Failed to save changes', 'error');
      }
    } catch (error) {
      toastMessage('Failed to save changes. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    toggleAccordion(false);
  };

  return (
    <div className="w-full flex flex-col gap-10 pt-8 pr-8 pb-8 pl-8 rounded-bl-lg rounded-br-lg border-t-0 border-r border-b border-l border-solid border-[#DCDCDC]">
      <div className="w-full flex justify-between">
        <label htmlFor="Notes" className="block text-sm/6 font-semibold text-gray-900 w-[40%]">
          Appointment Status
        </label>
        <div className="w-[60%] flex flex-col gap-3">
          <div className="flex items-center">
            <input
              id="radio1"
              name="notification-method"
              checked={formData.appointment_status === 'Do Not Need Appointment'}
              onChange={() => handleStatusChange('Do Not Need Appointment')}
              type="radio"
              className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden"
            />
            <label htmlFor="radio1" className="ml-3 block text-sm/6 font-medium text-gray-900">
              Do Not Need Appointment
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="radio2"
              name="notification-method"
              type="radio"
              checked={formData.appointment_status === 'Will Refer to Their Own Specialist'}
              onChange={() => handleStatusChange('Will Refer to Their Own Specialist')}
              className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden"
            />
            <label htmlFor="radio2" className="ml-3 block text-sm/6 font-medium text-gray-900">
              Will Refer to Their Own Specialist
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="radio3"
              name="notification-method"
              type="radio"
              checked={formData.appointment_status === 'Will Book on Their Own'}
              onChange={() => handleStatusChange('Will Book on Their Own')}
              className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden"
            />
            <label htmlFor="radio3" className="ml-3 block text-sm/6 font-medium text-gray-900">
              Will Book on Their Own
            </label>
          </div>
          <Link
            href={`/health-buddy/roster/${schoolid}/student/${studentId}/book-appointment/experts`}
            className="rounded-[5px] bg-indigo-500 w-[250px] h-[40px] px-5 py-2 mt-4 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 whitespace-nowrap"
            disabled={true}
          >
            Book Appointment
          </Link>
          {/* {isDisabled || formData.appointment_status ? (
            <span className="rounded-[5px] bg-indigo-300 w-[250px] h-[40px] px-5 py-2 mt-4 text-sm font-normal text-white shadow-xs cursor-not-allowed whitespace-nowrap">
              Book Appointment
            </span>
          ) : (
            <Link
              href={`/health-buddy/roster/${schoolid}/student/${studentId}/book-appointment/experts`}
              className="rounded-[5px] bg-indigo-500 w-[250px] h-[40px] px-5 py-2 mt-4 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 whitespace-nowrap"
            >
              Book Appointment
            </Link>
          )} */}
        </div>
      </div>
      <div className="flex border-b border-gray-900/10 pb-[11px] justify-between">
        <label htmlFor="Notes" className="block text-sm/6 font-semibold text-gray-900 w-[40%]">
          Add Notes
        </label>
        <div className="w-[60%] ">
          <textarea
            id="notes"
            name="notes"
            placeholder="Add notes here"
            rows={4}
            value={formData.notes}
            onChange={handleNotesChange}
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>
      <div className="mb-[50px] flex justify-center items-center gap-5">
        <button onClick={handleClose} className="font-normal w-[78px] h-[37px] py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap">
          Close
        </button>
        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={saving}
          className="rounded-[5px] bg-indigo-500 h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 whitespace-nowrap"
        >
          {saving ? 'saving...' : 'Save Changes '}
        </button>
      </div>
    </div>
  );
};

export default NoAppointmentsView;
