import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  nutritionalAnalystRecomendations,
  createNutritionalAnalystRecomendations,
  updateNutritionalAnalystRecomendations,
  getMedicalReportStatus,
} from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
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
  const [editingRemark, setEditingRemark] = useState(null);
  const [editRemarkValue, setEditRemarkValue] = useState('');
  const [medicalOfficerPhysicalScreeningReport, setMedicalOfficerPhysicalScreeningReport] = useState({});
  const [medicalOfficerNutritionalReport, setMedicalOfficerNutritionalReport] = useState({});
  const [medicalOfficerLabReport, setMedicalOfficerLabReport] = useState({});
  // Autosave state
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const autoSaveIntervalRef = useRef(null);
  const formDataRef = useRef(null);
  const hasExistingDataRef = useRef(false);
  const userInfoRef = useRef(null);

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
      // toastMessage(err.message || 'Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('user_info')) {
      const userJson = JSON.parse(atob(localStorage.getItem('user_info')));
      setUserInfo(userJson);
      getMedicalReportStatus(studentId)
        .then(res => {
          const response = JSON.parse(res);
          const physical_screening_report = response.data.medical_screening_statuses?.find(
            item => item.medical_officer_status_type === 'physical_screening_status'
          );
          const nutritional_report = response.data.medical_screening_statuses?.find(item => item.medical_officer_status_type === 'nutritional_report_status');
          const lab_report = response.data.medical_screening_statuses?.find(item => item.medical_officer_status_type === 'lab_report_status');
          setMedicalOfficerPhysicalScreeningReport(physical_screening_report);
          setMedicalOfficerNutritionalReport(nutritional_report);
          setMedicalOfficerLabReport(lab_report);
        })
        .catch(err => {
          toastMessage(err, 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  useEffect(() => {
    if (studentId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  // Keep refs in sync with state so the autosave interval can access latest values
  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { hasExistingDataRef.current = hasExistingData; }, [hasExistingData]);
  useEffect(() => { userInfoRef.current = userInfo; }, [userInfo]);

  // Autosave — 30-second interval
  const autoSave = useCallback(async () => {
    const currentFormData = formDataRef.current;
    const currentUserInfo = userInfoRef.current;
    const currentHasExisting = hasExistingDataRef.current;

    // Don't create blank records when there's no existing data AND no content entered
    if (!currentHasExisting) {
      const hasAnyContent = currentFormData?.data?.some(report =>
        report.report_data?.some(section => section.answers?.length > 0)
      ) || currentFormData?.clinical_notes?.trim() || currentFormData?.common_summary?.trim();
      if (!hasAnyContent) return;
    }

    if (!currentUserInfo) return;

    setAutoSaveStatus('saving');
    try {
      const updatedFormData = {
        ...currentFormData,
        role_type: currentUserInfo.role_type,
        role_name: currentUserInfo.user_role,
      };
      let result;
      if (currentHasExisting) {
        result = await updateNutritionalAnalystRecomendations(JSON.stringify(updatedFormData));
      } else {
        result = await createNutritionalAnalystRecomendations(JSON.stringify(updatedFormData));
      }
      if (result?.status) {
        setAutoSaveStatus('saved');
        setLastSavedAt(new Date());
        hasExistingDataRef.current = true;
        setHasExistingData(true);
      } else {
        setAutoSaveStatus('error');
      }
    } catch {
      setAutoSaveStatus('error');
    }
  }, []);

  // Start / stop autosave interval once loading is done
  useEffect(() => {
    if (loading) return;
    autoSaveIntervalRef.current = setInterval(autoSave, 30000);
    return () => clearInterval(autoSaveIntervalRef.current);
  }, [loading, autoSave]);

  const addRemark = (reportIndex, questionIndex) => {
    const remarkKey = `${reportIndex}-${questionIndex}`;
    const remarkText = newRemarks[remarkKey];

    if (remarkText && remarkText.trim() !== '') {
      setFormData(prev => ({
        ...prev,
        data: prev.data.map((report, rIdx) =>
          rIdx === reportIndex
            ? {
                ...report,
                report_data: report.report_data.map((question, qIdx) =>
                  qIdx === questionIndex
                    ? { ...question, answers: [...question.answers, remarkText.trim()] }
                    : question
                ),
              }
            : report
        ),
      }));
      setNewRemarks(prev => ({ ...prev, [remarkKey]: '' }));
    }
  };

  const removeRemark = (reportIndex, questionIndex, answerIndex) => {
    setFormData(prev => ({
      ...prev,
      data: prev.data.map((report, rIdx) =>
        rIdx === reportIndex
          ? {
              ...report,
              report_data: report.report_data.map((question, qIdx) =>
                qIdx === questionIndex
                  ? { ...question, answers: question.answers.filter((_, i) => i !== answerIndex) }
                  : question
              ),
            }
          : report
      ),
    }));
  };

  const startEditRemark = (reportIndex, questionIndex, answerIndex, currentValue) => {
    const editKey = `${reportIndex}-${questionIndex}-${answerIndex}`;
    setEditingRemark(editKey);
    setEditRemarkValue(currentValue);
  };

  const saveEditRemark = (reportIndex, questionIndex, answerIndex) => {
    if (editRemarkValue.trim() !== '') {
      setFormData(prev => ({
        ...prev,
        data: prev.data.map((report, rIdx) =>
          rIdx === reportIndex
            ? {
                ...report,
                report_data: report.report_data.map((question, qIdx) =>
                  qIdx === questionIndex
                    ? {
                        ...question,
                        answers: question.answers.map((ans, aIdx) =>
                          aIdx === answerIndex ? editRemarkValue.trim() : ans
                        ),
                      }
                    : question
                ),
              }
            : report
        ),
      }));
    }
    setEditingRemark(null);
    setEditRemarkValue('');
  };

  const cancelEditRemark = () => {
    setEditingRemark(null);
    setEditRemarkValue('');
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

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

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
        result = await updateNutritionalAnalystRecomendations(JSON.stringify(updatedFormData));
      } else {
        result = await createNutritionalAnalystRecomendations(JSON.stringify(updatedFormData));
      }

      // Handle success
      if (result.status) {
        const successMessage = hasExistingData ? 'Data updated successfully' : 'Data created successfully';
        toastMessage(result.message || successMessage, 'success');
        setAutoSaveStatus('saved');
        setLastSavedAt(new Date());
        setHasExistingData(true);
        router.refresh();
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
      <div key={reportIndex}>
        {reportTypes[reportIndex] === 'Lab Reports' ? (
          <>
            <div className="flex justify-between mb-4">
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
                    <option value="need_monitoring">Need Monitoring</option>
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
            <hr className="border-t border-[#B7B7B7]" />
          </>
        ) : (
          ''
        )}
        <div className={classNames(reportTypes[reportIndex] === 'Lab Reports' ? 'mt-10' : '', 'w-full flex flex-col gap-5')}>
          {reportTypes[reportIndex] === 'Physical Screening Report'
            ? medicalOfficerPhysicalScreeningReport?.remarks && (
                <div className="w-full space-y-5 sm:space-y-7.5 pl-5 py-5 bg-[#FFF3E5] rounded-[8px]">
                  <div className="flex gap-5">
                    <h3 className="font-semibold text-sm text-gray-900">Medical Officer Remarks:</h3>
                    <span className="text-red-500 text-sm font-normal">{medicalOfficerPhysicalScreeningReport.remarks}</span>
                  </div>
                </div>
              )
            : reportTypes[reportIndex] === 'Questionnaire Reports'
            ? medicalOfficerNutritionalReport?.remarks && (
                <div className="w-full space-y-5 sm:space-y-7.5 pl-5 py-5 bg-[#FFF3E5] rounded-[8px]">
                  <div className="flex gap-5">
                    <h3 className="font-semibold text-sm text-gray-900">Medical Officer Remarks:</h3>
                    <span className="text-red-500 text-sm font-normal">{medicalOfficerNutritionalReport.remarks}</span>
                  </div>
                </div>
              )
            : reportTypes[reportIndex] === 'Lab Reports'
            ? medicalOfficerLabReport?.remarks && (
                <div className="w-full space-y-5 sm:space-y-7.5 pl-5 py-5 bg-[#FFF3E5] rounded-[8px]">
                  <div className="flex gap-5">
                    <h3 className="font-semibold text-sm text-gray-900">Medical Officer Remarks:</h3>
                    <span className="text-red-500 text-sm font-normal">{medicalOfficerLabReport.remarks}</span>
                  </div>
                </div>
              )
            : ''}
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">{reportTypes[reportIndex]}</h1>
            <div className="flex-1 flex flex-col gap-7">
              {reportData.report_data.map((questionData, questionIndex) => (
                <div key={questionIndex} className="flex flex-col gap-3">
                  <h2 className="font-medium text-sm leading-6 mb-0">
                    {questionData.question_type === 'Good Outcomes' ? 'Good Outcomes/Strengths' : 'Areas of Concern/Needs Attention'}
                  </h2>

                  {/* Render existing answers */}
                  {questionData.answers.map((answer, answerIndex) => {
                    const editKey = `${reportIndex}-${questionIndex}-${answerIndex}`;
                    const isEditing = editingRemark === editKey;

                    return (
                      <div key={answerIndex} className="w-full flex items-start justify-between">
                        <div className="flex gap-3 items-start flex-1">
                          <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF] mt-1"></div>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editRemarkValue}
                              onChange={e => setEditRemarkValue(e.target.value)}
                              className="flex-1 border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] focus:outline-none"
                              onKeyPress={e => {
                                if (e.key === 'Enter') {
                                  saveEditRemark(reportIndex, questionIndex, answerIndex);
                                }
                                if (e.key === 'Escape') {
                                  cancelEditRemark();
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <p className="mb-0 font-normal text-sm leading-6 flex-1">{answer}</p>
                          )}
                        </div>
                        <div className="flex gap-3 items-center">
                          {isEditing ? (
                            <>
                              {/* Save button */}
                              <button onClick={() => saveEditRemark(reportIndex, questionIndex, answerIndex)} className="cursor-pointer" title="Save">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#22c55e" className="size-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                              </button>
                              {/* Cancel button */}
                              <button onClick={cancelEditRemark} className="cursor-pointer" title="Cancel">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ef4444" className="size-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Remove button */}
                              <button onClick={() => removeRemark(reportIndex, questionIndex, answerIndex)} className="cursor-pointer" title="Remove">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#5389FF" className="size-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                              </button>
                              {/* Edit button */}
                              <button onClick={() => startEditRemark(reportIndex, questionIndex, answerIndex, answer)} className="cursor-pointer" title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                                  <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

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
                    <option value="need_monitoring">Need Monitoring</option>
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
      {/* Autosave status banner */}
      {autoSaveStatus === 'saving' && (
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          Auto-saving…
        </div>
      )}
      {autoSaveStatus === 'saved' && lastSavedAt && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          <span className="text-green-500">●</span>
          Auto-saved at {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      {autoSaveStatus === 'error' && (
        <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
          <span>⚠</span> Auto-save failed — please save manually
        </div>
      )}
      <div className="flex flex-col gap-10">
        {/* Render all report sections */}
        {formData.data.map((reportData, reportIndex) => renderReportSection(reportData, reportIndex))}

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
        <button
          type="button"
          className="font-normal w-[78px] h-[37px] py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap"
          onClick={() => router.back()}
        >
          Close
        </button>
        <button
          type="button"
          className="rounded-[5px] bg-indigo-500 h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 whitespace-nowrap"
          onClick={saveChanges}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
