"use client"

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getNutritionalScreening, updateNutritionalScreening } from "@/services/secureApis";
import InlineSpinner from "../UI/InlineSpinner";
import { toastMessage } from "@/helpers/utilities";


export default function NutritionalScreening() {
  const router = useRouter();
  const { studentId } = useParams();
  const [results, setResults] = useState({});
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const rawResponse = await getNutritionalScreening(studentId);
        const result = JSON.parse(rawResponse);
        if (result.status !== true) {
          setError(result.message || `Failed to fetch data: ${rawResponse}`);
          return;
        }
        setResults(result.data);
        setFormData(result.data.nutrition_screening);
      } catch (err) {
        toastMessage(err || "Failed to fetch nutritional screening data:", 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId]);

  const handleCheckboxChange = (categoryKey, itemIndex) => {
    setFormData(prevData => {
      const newFormData = { ...prevData };
      newFormData[categoryKey] = [...prevData[categoryKey]];
      newFormData[categoryKey][itemIndex] = {
        ...newFormData[categoryKey][itemIndex],
        status: !newFormData[categoryKey][itemIndex].status,
      };
      return newFormData;
    });
    setError(null); // Clear any previous submission errors when user interacts
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');
    setError(null);

    try {
      const response = await updateNutritionalScreening(studentId, JSON.stringify(formData));
      if (response.status === true) {
        toastMessage(response.message || 'Data updated successfully!', 'success');
        router.refresh();
      } else {
        setError(new Error(response.message || 'Failed to update data on the server.'));
      }
    } catch (err) {
      toastMessage(err || 'Network error or unexpected issue during submission.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSection = (categoryKey, items) => {
    const title = categoryKey.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    if (categoryKey === 'note') return null;
    return (
      <div key={categoryKey} className="w-80 flex flex-col gap-1">
        <h2 className="text-sm font-normal leading-6">{title}</h2>
        {Array.isArray(items) && items.length > 0 ? (
          items.map((item, index) => {
            if (!item || typeof item.name === 'undefined' || typeof item.status === 'undefined') return null; // Basic validation for item structure
            return (
              <div key={index} className="flex items-center gap-4 h-6 mb-1">
                <input
                  type="checkbox"
                  id={`${categoryKey}-${index}`}
                  checked={item.status}
                  onChange={() => handleCheckboxChange(categoryKey, index)} // Attach onChange
                  className="w-5 h-5 border-[#5389FF] rounded" />
                <label htmlFor={`${categoryKey}-${index}`} className="text-sm font-normal leading-6">
                  {item.name}
                </label>
              </div>
            );
          })
        ) : ''}
      </div >
    )
  };

  if (loading) return (
    <div className='w-full py-8'>
      <InlineSpinner />
    </div>
  )

  if (error && (!formData || Object.keys(formData).length === 0)) return <div className="text-center p-[20px] text-red-500">Error loading nutrition data. Please refresh the page.</div>;
  if (!formData || Object.keys(formData).length === 0) return <div className="text-center p-[20px]">No nutrition screening data available.</div>;

  return (
    <div className="w-full">
      <form method="PUT" onSubmit={handleSubmit}>
        <div className="border-b border-gray-900/10 pb-[30px]">
          <h2 className="text-base/7 font-semibold text-[#000000] mb-[30px]">Nutrition Checklist</h2>
          <div className="">
            <main className="max-w-6xl mx-auto flex flex-wrap gap-8">
              {formData !== '' ?
                Object.entries(formData).map(([categoryKey, items]) => (
                  renderSection(categoryKey, items)
                )) : ''}
            </main>
          </div>
        </div>
        <div className="mt-[50px] border-b border-gray-900/10 pb-[30px]">
          <label htmlFor="note" className="block text-sm/6 font-semibold text-gray-900">
            Clinical Notes & Recommendations
          </label>
          <div className="mt-2 p-5">
            <textarea
              id="note"
              name="note"
              onChange={(e) => setFormData(f => ({ ...f, note: e.target.value }))}
              defaultValue={results.note}
              placeholder="Add note here"
              rows={4}
              style={{ width: '80%' }}
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>
        <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
          <button type="button" onClick={() => { router.back() }} className="font-normal w-[78px] h-[37px] py-2 px-5  border border-[#5465FF]  rounded-[5px] whitespace-nowrap">Back</button>
          <button
            type="submit"
            className="rounded-[5px] bg-indigo-500 w-[135px] h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Save changes'}
          </button>
        </div>
        {submitMessage && <p style={{ color: 'green', marginTop: '15px', textAlign: 'center' }}>{submitMessage}</p>}
        {error && <p style={{ color: 'red', marginTop: '15px', textAlign: 'center' }}>{error.message}</p>}
      </form>
    </div>
  );
}
