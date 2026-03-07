import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { nutritionalAnalystRecomendations, createNutritionalAnalystRecomendations, updateNutritionalAnalystRecomendations } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { useRouter } from 'next/navigation';
import InlineSpinner from '../UI/InlineSpinner';

export default function NutritionalAnalysis() {
  const { studentId } = useParams();
  const router = useRouter();

  // Initialize form data with proper structure
  const initializeFormData = () => ({
    student_id: studentId,
    data: [
      {
        report_type: 'Physical Screening Report',
        report_data: [
          {
            question_type: 'Good Outcomes',
            answers: [],
          },
          {
            question_type: 'Areas of Concern',
            answers: [],
          },
        ],
        summary: '',
        status: '',
      },
      {
        report_type: 'Questionnaire Reports',
        report_data: [
          {
            question_type: 'Good Outcomes',
            answers: [],
          },
          {
            question_type: 'Areas of Concern',
            answers: [],
          },
        ],
      },
      {
        report_type: 'Nutrition Deficiency Report',
        report_data: [
          {
            question_type: 'Good Outcomes',
            answers: [],
          },
          {
            question_type: 'Areas of Concern',
            answers: [],
          },
        ],
      },
      {
        report_type: 'Lab Reports',
        report_data: [
          {
            question_type: 'Good Outcomes',
            answers: [],
          },
          {
            question_type: 'Areas of Concern',
            answers: [],
          },
        ],
        summary: '',
        status: '',
      },
    ],
    common_summary: '',
    common_status: '',
    clinical_notes: '',
    role_type: '',
    role_name: '',
  });

  const [formData, setFormData] = useState(initializeFormData());
  const [newRemarks, setNewRemarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [hasExistingData, setHasExistingData] = useState(false);

  // Function to populate form data from API response
  const populateFormDataFromAPI = apiResponse => {
    const newFormData = initializeFormData();

    if (apiResponse.status && apiResponse.data) {
      const { data } = apiResponse.data;

      // Update student_id
      newFormData.student_id = apiResponse.data.student_id;

      // Update common fields
      newFormData.common_summary = apiResponse.data.common_summary || '';
      newFormData.common_status = apiResponse.data.common_status || '';
      newFormData.clinical_notes = apiResponse.data.clinical_notes || '';
      newFormData.role_type = apiResponse.data.role_type || '';
      newFormData.role_name = apiResponse.data.role_name || '';

      // Map API data to form structure
      if (data && Array.isArray(data)) {
        data.forEach(apiReport => {
          const formReportIndex = newFormData.data.findIndex(formReport => formReport.report_type === apiReport.report_type);

          if (formReportIndex !== -1) {
            newFormData.data[formReportIndex].id = apiReport.id;
            // Update summary and status
            newFormData.data[formReportIndex].summary = apiReport.summary || '';
            newFormData.data[formReportIndex].status = apiReport.status || '';

            // Update report data
            if (apiReport.report_data && Array.isArray(apiReport.report_data)) {
              apiReport.report_data.forEach(apiQuestion => {
                const formQuestionIndex = newFormData.data[formReportIndex].report_data.findIndex(
                  formQuestion => formQuestion.question_type === apiQuestion.question_type
                );

                if (formQuestionIndex !== -1) {
                  newFormData.data[formReportIndex].report_data[formQuestionIndex].answers = apiQuestion.answers || [];
                }
              });
            }
          }
        });
      }
    }

    return newFormData;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const rawResponse = await nutritionalAnalystRecomendations(studentId);
      const results = JSON.parse(rawResponse);
      setApiData(results);

      if (results.status === true) {
        setHasExistingData(true);
        const populatedFormData = populateFormDataFromAPI(results);
        setFormData(populatedFormData);
      } else {
        setHasExistingData(false);
        setFormData(initializeFormData());
      }
    } catch (err) {
      setHasExistingData(false);
      setFormData(initializeFormData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('user_info')) {
      const userJson = JSON.parse(atob(localStorage.getItem('user_info')));
      setUserInfo(userJson);
    }
  }, []);

  useEffect(() => {
    if (studentId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const addRemark = (reportIndex, questionIndex) => {
    const remarkKey = `${reportIndex}-${questionIndex}`;
    const remarkText = newRemarks[remarkKey];

    if (remarkText && remarkText.trim() !== '') {
      const updatedFormData = { ...formData };
      updatedFormData.data[reportIndex].report_data[questionIndex].answers.push(remarkText.trim());
      setFormData(updatedFormData);

      // Clear the input
      setNewRemarks({
        ...newRemarks,
        [remarkKey]: '',
      });
    }
  };

  const removeRemark = (reportIndex, questionIndex, answerIndex) => {
    const updatedFormData = { ...formData };
    updatedFormData.data[reportIndex].report_data[questionIndex].answers.splice(answerIndex, 1);
    setFormData(updatedFormData);
  };

  const updateRemarkInput = (reportIndex, questionIndex, value) => {
    const remarkKey = `${reportIndex}-${questionIndex}`;
    setNewRemarks({
      ...newRemarks,
      [remarkKey]: value,
    });
  };

  const updateSummary = (reportIndex, value) => {
    const updatedFormData = { ...formData };
    updatedFormData.data[reportIndex].summary = value;
    setFormData(updatedFormData);
  };

  const updateStatus = (reportIndex, value) => {
    const updatedFormData = { ...formData };
    updatedFormData.data[reportIndex].status = value;
    setFormData(updatedFormData);
  };

  const updateCommonSummary = value => {
    setFormData({
      ...formData,
      common_summary: value,
    });
  };

  const updateCommonStatus = value => {
    setFormData({
      ...formData,
      common_status: value,
    });
  };

  const updateClinicalNotes = value => {
    setFormData({
      ...formData,
      clinical_notes: value,
    });
  };

  const saveChanges = async () => {
    try {
      const updatedFormData = {
        ...formData,
        // Update the role based info
        role_type: userInfo.role_type,
        role_name: userInfo.user_role,
      };

      let result;
      if (hasExistingData) {
        // Call update API if data exists
        result = await updateNutritionalAnalystRecomendations(JSON.stringify(updatedFormData));
        // console.log('Update API Response:', result);
      } else {
        // Call create API if no existing data
        result = await createNutritionalAnalystRecomendations(JSON.stringify(updatedFormData));
        // console.log('Create API Response:', result);
      }

      // Handle success
      if (result.status) {
        const successMessage = hasExistingData ? 'Data updated successfully' : 'Data created successfully';
        // console.log(successMessage);
        toastMessage(result.message || successMessage, 'success');
        router.back();
      } else {
        // console.error('Save failed:', result.message);
        toastMessage(result.message || 'Failed to save data', 'error');
      }
    } catch (error) {
      // console.error('Error in save operation:', error);
      toastMessage('Failed to save data', 'error');
    }
  };

  const renderReportSection = (reportData, reportIndex) => {
    const reportTypes = ['Physical Screening Report', 'Questionnaire Reports', 'Nutrition Deficiency Report', 'Lab Reports'];

    // For Questionnaire Reports and Nutrition Deficiency Report, they share common status and summary
    const isSharedSection = reportIndex === 1 || reportIndex === 2;
    const showStatusAndSummary = reportIndex === 0 || reportIndex === 3 || reportIndex === 2; // Physical, Lab, or Nutrition (last of shared)

    return (
      <div key={reportIndex} className="w-full flex flex-col gap-5">
        <div className="flex justify-between">
          <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">{reportTypes[reportIndex]}</h1>
          <div className="flex-1 flex flex-col gap-7">
            {reportData.report_data.map((questionData, questionIndex) => (
              <div key={questionIndex} className="flex flex-col gap-3">
                <h2 className="font-medium text-sm leading-6 mb-0">
                  {questionData.question_type === 'Good Outcomes' ? 'Good Outcomes/Strengths' : 'Areas of Concern/Needs Attention'}
                </h2>

                {/* Render existing answers */}
                {questionData.answers.map((answer, answerIndex) => (
                  <div key={answerIndex} className="w-full flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]"></div>
                      <p className="mb-0 font-normal text-sm leading-6">{answer}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button onClick={() => removeRemark(reportIndex, questionIndex, answerIndex)} className="cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#5389FF" className="size-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      </button>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                        <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                      </svg>
                    </div>
                  </div>
                ))}

                {/* Input for new remarks - Always show */}
                <div className="w-full flex gap-4 items-center justify-between">
                  <input
                    type="text"
                    placeholder="Remarks"
                    value={newRemarks[`${reportIndex}-${questionIndex}`] || ''}
                    onChange={e => updateRemarkInput(reportIndex, questionIndex, e.target.value)}
                    className="w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] placeholder-gray-400 focus:outline-none"
                  />
                  <button onClick={() => addRemark(reportIndex, questionIndex)} className="w-[22px] h-[22px] cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Status dropdown - only for Physical Screening Report and Lab Reports */}
            {showStatusAndSummary && (reportIndex === 0 || reportIndex === 3) && (
              <div className="w-full">
                <label className="font-medium text-sm leading-6 mb-0">Select Status</label>
                <select
                  value={reportData.status}
                  onChange={e => updateStatus(reportIndex, e.target.value)}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Choose an option</option>
                  <option value="all_good">All Good</option>
                  <option value="need_attention">Need Attention</option>
                </select>
              </div>
            )}

            {/* Summary - show for all individual reports */}
            {showStatusAndSummary && (reportIndex === 0 || reportIndex === 3) && (
              <div className="w-full flex flex-col gap-5">
                <p className="font-medium text-sm leading-6 mb-0">Summary</p>
                <textarea
                  placeholder="Start Typing..."
                  value={reportData.summary}
                  onChange={e => updateSummary(reportIndex, e.target.value)}
                  className="min-w-[298px] border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none resize-none"
                  rows="6"
                />
              </div>
            )}
          </div>
        </div>
        <hr className="border-t border-[#B7B7B7]" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full py-8 justify-center items-center">
        <InlineSpinner />
      </div>
    );
  }

  return (
    <div className="w-full pt-[35px] pr-[34px] pb-[60px] pl-[34px] flex flex-col gap-10">
      <div className="flex flex-col gap-10">
        {/* Render all report sections */}
        {formData.data.map((reportData, reportIndex) => renderReportSection(reportData, reportIndex))}

        <div className="flex justify-between">
          <h1 className="w-[35%] font-semibold text-[14px]">
            Common For Questionnaire and <br /> Nutrition Deficiency
          </h1>
          <div className="flex-1 flex flex-col gap-7">
            {/* Common Status - appears after all reports */}
            <div className="w-full">
              <label className="font-medium text-sm leading-6 mb-0">Select Status</label>
              <select
                value={formData.common_status}
                onChange={e => updateCommonStatus(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Choose an option</option>
                <option value="all_good">All Good</option>
                <option value="need_attention">Need Attention</option>
              </select>
            </div>

            {/* Common Summary */}
            <div className="w-full flex flex-col gap-5">
              <p className="font-medium text-sm leading-6 mb-0">Summary</p>
              <textarea
                placeholder="Start Typing..."
                value={formData.common_summary}
                onChange={e => updateCommonSummary(e.target.value)}
                className="min-w-[298px] border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none resize-none"
                rows="6"
              />
            </div>
          </div>
        </div>

        {/* Clinical Notes & Recommendations */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Clinical Notes & Recommendations</h1>
            <div className="flex-1 flex flex-col gap-5">
              <textarea
                placeholder="Default"
                value={formData.clinical_notes}
                onChange={e => updateClinicalNotes(e.target.value)}
                className="min-w-[298px] border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none resize-none"
                rows="6"
              />
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-[50px] flex justify-center items-center gap-5">
        <button className="font-normal w-[78px] h-[37px] py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap" onClick={() => router.back()}>
          Close
        </button>
        <button
          type="button"
          className="rounded-[5px] bg-indigo-500 h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          onClick={saveChanges}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
