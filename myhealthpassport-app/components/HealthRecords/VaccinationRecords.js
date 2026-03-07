import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { studentVaccinationList, studentVaccinationListUpdate } from '@/services/secureApis';
import InlineSpinner from '@/components/UI/InlineSpinner';
import { toastMessage } from '@/helpers/utilities';

export default function VaccinationRecords({ academicYear = null }) {
  const { id } = useParams();
  const [vaccinationData, setVaccinationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const rawResponse = await studentVaccinationList(id);
        const result = JSON.parse(rawResponse);
        if (result.status) {
          setVaccinationData(result.data.vaccination_statuses || []);
        } else {
          setError(result.message || 'Failed to fetch Vaccination records');
        }
      } catch (err) {
        setError('Error loading Vaccination records');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleCheckboxChange = (entryIndex, vaccineIndex, newStatus) => {
    setVaccinationData(prevData => {
      const updatedData = [...prevData];
      updatedData[entryIndex].vaccine_data[vaccineIndex].status = newStatus;
      return updatedData;
    });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Prepare the request body according to the API format
      const vaccine_data = [];

      vaccinationData.forEach(entry => {
        entry.vaccine_data.forEach(vaccine => {
          vaccine_data.push({
            sv_id: vaccine.sv_id,
            status: vaccine.status,
          });
        });
      });

      const requestBody = { vaccine_data };

      const result = await studentVaccinationListUpdate(id, JSON.stringify(requestBody));

      if (result.status) {
        toastMessage(result.message || 'Vaccination records updated successfully', 'success');
      } else {
        setError(result.message || 'Failed to update vaccination records');
      }
    } catch (err) {
      console.error('Error updating vaccination records:', err);
      setError('Error updating vaccination records');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 w-full mx-auto">
        <InlineSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="border rounded-[4px] border-[#B5CCFF] w-full max-w-full">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="bg-[#ECF2FF]">
            <tr className="grid grid-cols-[140px_1fr_60px] w-full">
              <th className="truncate h-[40px] border-r border-b border-[#B5CCFF] text-[#5389FF] font-inter font-medium text-[14px] leading-[130%] tracking-[0%] px-[10px] py-[12px] text-start">
                Age
              </th>
              <th className="truncate h-[40px] border-r border-b border-[#B5CCFF] text-[#5389FF] font-inter font-medium text-[14px] leading-[130%] tracking-[0%] px-[10px] py-[12px] text-start">
                Vaccination
              </th>
              <th className="truncate h-[40px] border-b border-[#B5CCFF]">{/* Empty header cell */}</th>
            </tr>
          </thead>
          <tbody>
            {vaccinationData.map((entry, index) => (
              <React.Fragment key={index}>
                {entry.vaccine_data.map((vaccine, vaccineIndex) => (
                  <tr key={vaccineIndex} className="grid bg-white grid-cols-[140px_1fr_60px]">
                    <th
                      className={`truncate h-[40px] border-r border-b border-[#B5CCFF] text-gray-900 font-inter font-medium text-[14px] leading-[130%] tracking-[0%] px-[10px] py-[12px] text-start ${
                        vaccineIndex > 0 ? 'border-t-0' : ''
                      }`}
                    >
                      {vaccineIndex === 0 ? entry.vaccine_id : ''}
                    </th>
                    <th className="truncate h-[40px] border-r border-b border-[#B5CCFF] text-gray-900 font-inter font-medium text-[14px] leading-[130%] tracking-[0%] px-[10px] py-[12px] text-start">
                      {vaccine.vaccine_name}
                    </th>
                    <th className="truncate h-[40px] border-b border-[#B5CCFF] flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={vaccine.status}
                        onChange={e => handleCheckboxChange(index, vaccineIndex, e.target.checked)}
                        className="form-checkbox h-4 w-4 text-[#5389FF] border-[#B5CCFF] rounded"
                      />
                    </th>
                  </tr>
                ))}
                {/* Add empty row with light blue background between sections */}
                <tr className="grid grid-cols-[140px_1fr_60px] bg-[#ECF2FF]">
                  <th className="truncate h-[40px] border-r border-b border-[#B5CCFF] text-[#5389FF] font-inter font-medium text-[14px] leading-[130%] tracking-[0%] px-[10px] py-[12px] text-start">
                    {' '}
                  </th>
                  <th className="truncate h-[40px] border-r border-b border-[#B5CCFF] text-[#5389FF] font-inter font-medium text-[14px] leading-[130%] tracking-[0%] px-[10px] py-[12px] text-start">
                    {''}
                  </th>
                  <th className="truncate h-[40px] border-b border-[#B5CCFF]">{/* Empty header cell */}</th>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
        <button className="font-normal w-[78px] h-[37px] py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap">Close</button>
        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="rounded-[5px] bg-indigo-500 w-[135px] h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
