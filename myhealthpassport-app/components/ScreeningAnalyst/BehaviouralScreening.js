'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBehaviouralScreening, updateBehaviouralScreening } from '@/services/secureApis';
import InlineSpinner from '@/components/UI/InlineSpinner';
import { toastMessage, formatString } from '@/helpers/utilities';
import nookies from 'nookies';


export default function BehaviouralScreening() {
  const cookies = nookies.get();
  const router = useRouter();
  const { studentId } = useParams();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [root, setRoot] = useState(null);

  useEffect(() => {
    setRoot(cookies.root);
    async function fetchData() {
      try {
        const rawResponse = await getBehaviouralScreening(studentId);
        const result = JSON.parse(rawResponse);
        if (result.status !== true) {
          setError(result.message || `Failed to fetch data: ${rawResponse}`);
          setLoading(false);
          return;
        }
        setFormData({ behavioural_screening: result.data.behavioural_screening, note: result.data.note });
      } catch (err) {
        toastMessage(err.message || 'Failed to fetch behavioural screening data:', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId]);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const handleBehavioralChange = (category, index, key, value) => {
    setFormData(prevData => {
      const newBehavioralScreening = { ...prevData.behavioural_screening };
      const newCategoryArray = [...newBehavioralScreening[category]];
      const item = { ...newCategoryArray[index] };
      item[key] = value;
      newCategoryArray[index] = item;
      newBehavioralScreening[category] = newCategoryArray;

      return {
        ...prevData,
        behavioural_screening: newBehavioralScreening,
      };
    });
  };

  const handleRecommendationCheckboxChange = key => {
    setFormData(prevData => {
      const newBehavioralScreening = { ...prevData.behavioural_screening };
      const newRecommendations = { ...newBehavioralScreening.recommendations };
      newRecommendations[key] = !newRecommendations[key];
      newBehavioralScreening.recommendations = newRecommendations;

      return {
        ...prevData,
        behavioural_screening: newBehavioralScreening,
      };
    });
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);
    setError(null);

    try {
      const response = await updateBehaviouralScreening(studentId, JSON.stringify(formData));
      if (response.status === true) {
        toastMessage(response.message || 'Data updated successfully!', 'success');
        router.refresh();
      } else {
        setError(response.message || 'Failed to update data on the server.');
      }
    } catch (err) {
      toastMessage(err.message || 'Network error or unexpected issue during submission.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className='w-full py-8'>
      <InlineSpinner />
    </div>
  )

  const categoryOrder = ['socialisation', 'communication', 'play_behaviour', 'interaction', 'anxiety_withdrawal', 'problem_behaviour'];

  if (error && !formData) return <div className="text-center p-[20px] text-red-500">Error: {error}</div>;
  if (!formData) return <div className="text-center p-[20px]">No data to display.</div>;

  const { summary_concerns, note, ...otherScreenings } = formData;

  return (
    <div className="w-full flex flex-col gap-2">
      <form method="PUT" onSubmit={handleSubmit}>
        <div className="max-w-sm">
          <h2 className="text-base/7 font-semibold text-[#000000]">Behavioural Screening</h2>
        </div>
        {formData && Object.keys(formData).length > 0 ?
          <>
            {/* Behavioral Screening Sections (Socialisation, Communication, etc.) */}
            {categoryOrder.map(category => {
              const categoryData = formData.behavioural_screening[category];
              if (!categoryData) return null;
              return (
                <div key={category} className="border-b border-gray-900/10 pb-4 flex flex-col gap-2 mb-4">
                  <h1 className="font-medium text-base">{formatString(category.replace(/_/g, ' '))}</h1>
                  {categoryData.map((item, index) => (
                    <div key={`${category}-${index}`} className="w-full">
                      <div className={classNames(index % 2 === 0 || index === 0 ? 'bg-white' : 'bg-[#ECF2FF]', 'flex justify-between py-3 px-2.5')}>
                        <span className="text-sm font-normal leading-6 text-gray-900">{item.question}</span>
                        {/* Radio buttons for boolean 'anwser' (for most categories) */}
                        <div className="flex gap-2 w-40">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id={`${category}-${index}-true`}
                              name={`${category}-${index}-anwser`}
                              value="true"
                              checked={formData.behavioural_screening[category][index].anwser === true}
                              onChange={() => handleBehavioralChange(category, index, 'anwser', true)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                              disabled={root !== 'screening' ? true : false}
                            />
                            <label htmlFor={`${category}-${index}-true`} className="text-sm font-normal leading-6 text-gray-900">
                              Yes
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id={`${category}-${index}-false`}
                              name={`${category}-${index}-anwser`}
                              value="false"
                              checked={formData.behavioural_screening[category][index].anwser === false}
                              onChange={() => handleBehavioralChange(category, index, 'anwser', false)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                              disabled={root !== 'screening' ? true : false}
                            />
                            <label htmlFor={`${category}-${index}-false`} className="text-sm font-normal leading-6 text-gray-900">
                              No
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Summary Concerns Section (radio buttons) */}
            <div className="border-b border-gray-900/10 pb-4 flex flex-col gap-2 mb-4">
              <h1 className="font-medium text-base">Summary Concerns</h1>
              {formData.behavioural_screening.summary_concerns &&
                formData.behavioural_screening.summary_concerns.map((concern, index) => (
                  <div key={`summary-${concern.category}`} className="w-full">
                    <div className={classNames(index % 2 === 0 || index === 0 ? 'bg-white' : 'bg-[#ECF2FF]', 'flex justify-between py-3 px-2.5')}>
                      <span className="text-sm font-normal leading-6 text-gray-900">{concern.category.replace(/_/g, ' ')}</span>
                      <div className="flex gap-2 w-40">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            id={`summary-concern-${index}`}
                            name={`summary-concern-${index}`}
                            value="true"
                            checked={concern.has_concern === true}
                            onChange={() => handleBehavioralChange('summary_concerns', index, 'has_concern', true)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            disabled={root !== 'screening' ? true : false}
                          />
                          <label htmlFor={`summary-concern-${index}`} className="text-sm font-normal leading-6 text-gray-900">
                            Yes
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            id={`summary-concern-${index}`}
                            name={`summary-concern-${index}`}
                            value="false"
                            checked={concern.has_concern === false}
                            onChange={() => handleBehavioralChange('summary_concerns', index, 'has_concern', false)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            disabled={root !== 'screening' ? true : false}
                          />
                          <label htmlFor={`summary-concern-${index}`} className="text-sm font-normal leading-6 text-gray-900">
                            No
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Recommendations Section (checkboxes) */}
            <div className="border-b border-gray-900/10 pb-4 flex flex-col mb-4">
              <h1 className="font-medium text-base">Recommendations</h1>
              {formData.behavioural_screening.recommendations &&
                Object.keys(formData.behavioural_screening.recommendations).map((key, index) => (
                  <div key={`recommendation-${key}`} className="w-full">
                    <div className={classNames(index % 2 === 0 || index === 0 ? 'bg-white' : 'bg-[#ECF2FF]', 'flex py-3 px-2.5')}>
                      <input
                        type="checkbox"
                        checked={formData.behavioural_screening.recommendations[key]}
                        onChange={() => handleRecommendationCheckboxChange(key)}
                        className="w-5 h-5 border-[#5389FF] rounded"
                        disabled={root !== 'screening' ? true : false}
                      />
                      <label className="text-sm font-normal pl-4 leading-6 text-gray-900">{key.replace(/_/g, ' ')}</label>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-[50px] border-b border-gray-900/10 pb-[30px]">
              <label htmlFor="note" className="block text-sm/6 font-semibold text-gray-900">
                Clinical Notes & Recommendations
              </label>
              <div className="mt-2 p-5">
                <textarea
                  id="note"
                  name="note"
                  onChange={e => setFormData(f => ({ ...f, note: e.target.value }))}
                  placeholder="Add notes here"
                  rows={4}
                  style={{ width: '80%' }}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  value={note || ''}
                  disabled={root !== 'screening' ? true : false}
                />
              </div>
            </div>
            <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  router.back();
                }}
                className="font-normal w-[78px] h-[37px] py-2 px-5  border border-[#5465FF]  rounded-[5px] whitespace-nowrap"
              >
                Back
              </button>
              {root === 'screening' ?
                <button
                  type="submit"
                  className="rounded-[5px] bg-indigo-500 h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 whitespace-nowrap"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Save changes'}
                </button>
                : ''}
            </div>
          </> :
          <div className='text-center text-red-500 mt-2'>{error || 'No data to display.'}</div>
        }
        {submitMessage && <p style={{ color: 'green', marginTop: '15px', textAlign: 'center' }}>{submitMessage}</p>}
      </form>
    </div>
  );
}
