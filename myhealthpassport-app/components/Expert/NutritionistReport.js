import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createNutritionistPrescription, getNutritionistPrescription, getMedicalReportStatus } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { useRouter, useParams } from 'next/navigation';
import InlineSpinner from '../UI/InlineSpinner';

export default function NutritionistReport() {
  const router = useRouter();
  const { id } = useParams();

  // User and Report State
  const [userInfo, setUserInfo] = useState(null);
  const [existingReport, setExistingReport] = useState(null);
  const [medicalOfficerNutritionScreeningReport, setMedicalOfficerNutritionScreeningReport] = useState({});

  // Loading States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Data States - Based on Excel sheet
  const [intolerance, setIntolerance] = useState('');

  // Food Preferences - Bullet points
  const [foodPreferences, setFoodPreferences] = useState([]);
  const [newFoodPreference, setNewFoodPreference] = useState('');

  // Body Parameters
  const [bodyParameters, setBodyParameters] = useState({
    weight: '',
    height: '',
    bmi: '',
    muscleMass: '',
    boneMass: '',
    fatContent: '',
  });

  // Diagnosis - Bullets
  const [diagnosis, setDiagnosis] = useState([]);
  const [newDiagnosis, setNewDiagnosis] = useState('');

  // Health Goals - Bullets
  const [healthGoals, setHealthGoals] = useState([]);
  const [newHealthGoal, setNewHealthGoal] = useState('');

  // Interventions - Bullets
  const [interventions, setInterventions] = useState([]);
  const [newIntervention, setNewIntervention] = useState('');

  // Lifestyle Modifications - Bullets with Health goals list + Remark box
  const [lifestyleModifications, setLifestyleModifications] = useState([]);
  const [selectedLifestyleGoal, setSelectedLifestyleGoal] = useState('');
  const [lifestyleRemarks, setLifestyleRemarks] = useState('');

  // Health Plate - Dropdown
  const [healthPlate, setHealthPlate] = useState('');

  // Diet Schedule - Multiple meal options with remarks
  const mealOptions = [
    'Pre-Breakfast',
    'Breakfast',
    'Mid Morning',
    'Tiffins',
    'Lunch',
    'Pre-Workout',
    'Post-Workout',
    'Snacks',
    'Dinner',
    'Bedtime',
    'Fillers',
  ];
  const dietOptions = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Option 6', 'Option 7'];
  const [dietSchedule, setDietSchedule] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState('');
  const [selectedDietOption, setSelectedDietOption] = useState('');
  const [dietRemarks, setDietRemarks] = useState('');

  // Hydration
  const [hydration, setHydration] = useState({
    litresPerDay: '',
    glasses: '',
  });

  // Suggestions - Bullets
  const [suggestions, setSuggestions] = useState([]);
  const [newSuggestion, setNewSuggestion] = useState('');

  // Vitamin and Supplements - 4 text boxes per entry
  const [vitaminSupplements, setVitaminSupplements] = useState([]);
  const [supplementForm, setSupplementForm] = useState({
    nutrient: '',
    dosage: '',
    frequency: '',
    duration: '',
  });

  // Fitness & Mindfulness Plan - Exercise Name + Text Area
  const [fitnessPlans, setFitnessPlans] = useState([]);
  const [fitnessForm, setFitnessForm] = useState({
    exerciseName: '',
    description: '',
  });

  // Digital Detox - Bullets
  const [digitalDetox, setDigitalDetox] = useState([]);
  const [newDigitalDetox, setNewDigitalDetox] = useState('');

  // Derived State
  const isUpdateMode = existingReport !== null;

  // Effects
  useEffect(() => {
    initializeUserInfo();
    fetchData();
    fetchMedicalReportStatus();
  }, [id]);

  // Initialize Functions
  const initializeUserInfo = () => {
    if (localStorage.getItem('user_info')) {
      const userJson = JSON.parse(atob(localStorage.getItem('user_info')));
      setUserInfo(userJson);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getNutritionistPrescription(id);
      const responseData = JSON.parse(response);

      if (responseData.status && responseData.data) {
        const nutritionData = responseData.data;
        setExistingReport(nutritionData);
        populateFormWithData(nutritionData);
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      toastMessage(err.message || 'An error occurred while fetching data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalReportStatus = () => {
    getMedicalReportStatus(id)
      .then(res => {
        const response = JSON.parse(res);
        const nutritionScreeningReport = response.data.medical_screening_statuses?.find(
          item => item.medical_officer_status_type === 'nutrition_screening_status'
        );
        setMedicalOfficerNutritionScreeningReport(nutritionScreeningReport || {});
      })
      .catch(err => {
        console.error('Medical Report Status Error:', err);
        toastMessage('Failed to fetch medical report status', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Data Population
  const populateFormWithData = data => {
    // Intolerance
    setIntolerance(data.intolerance || '');

    // Food Preferences
    if (data.food_preferences && Array.isArray(data.food_preferences)) {
      setFoodPreferences(data.food_preferences);
    }

    // Body Parameters
    setBodyParameters({
      weight: data.body_parameters?.weight || '',
      height: data.body_parameters?.height || '',
      bmi: data.body_parameters?.bmi || '',
      muscleMass: data.body_parameters?.muscle_mass || '',
      boneMass: data.body_parameters?.bone_mass || '',
      fatContent: data.body_parameters?.fat_content || '',
    });

    // Diagnosis
    if (data.diagnosis && Array.isArray(data.diagnosis)) {
      setDiagnosis(data.diagnosis);
    }

    // Health Goals
    if (data.health_goals && Array.isArray(data.health_goals)) {
      setHealthGoals(data.health_goals);
    }

    // Interventions
    if (data.interventions && Array.isArray(data.interventions)) {
      setInterventions(data.interventions);
    }

    // Lifestyle Modifications
    if (data.lifestyle_modifications && Array.isArray(data.lifestyle_modifications)) {
      const formattedLifestyle = data.lifestyle_modifications.map((item, index) => ({
        id: Date.now() + index,
        goal: item.goal || '',
        remarks: item.remarks || '',
      }));
      setLifestyleModifications(formattedLifestyle);
    }

    // Health Plate
    setHealthPlate(data.health_plate || '');

    // Diet Schedule
    if (data.diet_schedule && Array.isArray(data.diet_schedule)) {
      const formattedDiet = data.diet_schedule.map((item, index) => ({
        id: Date.now() + index,
        meal: item.meal || '',
        option: item.option || '',
        remarks: item.remarks || '',
      }));
      setDietSchedule(formattedDiet);
    }

    // Hydration
    setHydration({
      litresPerDay: data.hydration?.litres_per_day || '',
      glasses: data.hydration?.glasses || '',
    });

    // Suggestions
    if (data.suggestions && Array.isArray(data.suggestions)) {
      setSuggestions(data.suggestions);
    }

    // Vitamin Supplements
    if (data.vitamin_supplements && Array.isArray(data.vitamin_supplements)) {
      const formattedSupplements = data.vitamin_supplements.map((item, index) => ({
        id: Date.now() + index,
        nutrient: item.nutrient || '',
        dosage: item.dosage || '',
        frequency: item.frequency || '',
        duration: item.duration || '',
      }));
      setVitaminSupplements(formattedSupplements);
    }

    // Fitness Plans
    if (data.fitness_plans && Array.isArray(data.fitness_plans)) {
      const formattedFitness = data.fitness_plans.map((item, index) => ({
        id: Date.now() + index,
        exerciseName: item.exercise_name || '',
        description: item.description || '',
      }));
      setFitnessPlans(formattedFitness);
    }

    // Digital Detox
    if (data.digital_detox && Array.isArray(data.digital_detox)) {
      setDigitalDetox(data.digital_detox);
    }
  };

  // Event Handlers
  const handleBodyParameterChange = (field, value) => {
    setBodyParameters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHydrationChange = (field, value) => {
    setHydration(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSupplementFormChange = (field, value) => {
    setSupplementForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFitnessFormChange = (field, value) => {
    setFitnessForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Food Preferences Handlers
  const handleAddFoodPreference = () => {
    const trimmed = newFoodPreference.trim();
    if (trimmed && !foodPreferences.includes(trimmed)) {
      setFoodPreferences([...foodPreferences, trimmed]);
      setNewFoodPreference('');
    }
  };

  const handleRemoveFoodPreference = index => {
    setFoodPreferences(foodPreferences.filter((_, idx) => idx !== index));
  };

  // Diagnosis Handlers
  const handleAddDiagnosis = () => {
    const trimmed = newDiagnosis.trim();
    if (trimmed && !diagnosis.includes(trimmed)) {
      setDiagnosis([...diagnosis, trimmed]);
      setNewDiagnosis('');
    }
  };

  const handleRemoveDiagnosis = index => {
    setDiagnosis(diagnosis.filter((_, idx) => idx !== index));
  };

  // Health Goals Handlers
  const handleAddHealthGoal = () => {
    const trimmed = newHealthGoal.trim();
    if (trimmed && !healthGoals.includes(trimmed)) {
      setHealthGoals([...healthGoals, trimmed]);
      setNewHealthGoal('');
    }
  };

  const handleRemoveHealthGoal = index => {
    setHealthGoals(healthGoals.filter((_, idx) => idx !== index));
  };

  // Interventions Handlers
  const handleAddIntervention = () => {
    const trimmed = newIntervention.trim();
    if (trimmed && !interventions.includes(trimmed)) {
      setInterventions([...interventions, trimmed]);
      setNewIntervention('');
    }
  };

  const handleRemoveIntervention = index => {
    setInterventions(interventions.filter((_, idx) => idx !== index));
  };

  // Lifestyle Modifications Handlers
  const handleAddLifestyleModification = () => {
    if (selectedLifestyleGoal) {
      const newModification = {
        id: Date.now(),
        goal: selectedLifestyleGoal,
        remarks: lifestyleRemarks,
      };
      setLifestyleModifications([...lifestyleModifications, newModification]);
      setSelectedLifestyleGoal('');
      setLifestyleRemarks('');
    }
  };

  const handleRemoveLifestyleModification = id => {
    setLifestyleModifications(lifestyleModifications.filter(item => item.id !== id));
  };

  // Diet Schedule Handlers
  const handleAddDietSchedule = () => {
    if (selectedMeal && selectedDietOption) {
      const newDietItem = {
        id: Date.now(),
        meal: selectedMeal,
        option: selectedDietOption,
        remarks: dietRemarks,
      };
      setDietSchedule([...dietSchedule, newDietItem]);
      setSelectedMeal('');
      setSelectedDietOption('');
      setDietRemarks('');
    }
  };

  const handleRemoveDietSchedule = id => {
    setDietSchedule(dietSchedule.filter(item => item.id !== id));
  };

  // Suggestions Handlers
  const handleAddSuggestion = () => {
    const trimmed = newSuggestion.trim();
    if (trimmed && !suggestions.includes(trimmed)) {
      setSuggestions([...suggestions, trimmed]);
      setNewSuggestion('');
    }
  };

  const handleRemoveSuggestion = index => {
    setSuggestions(suggestions.filter((_, idx) => idx !== index));
  };

  // Vitamin Supplements Handlers
  const handleAddVitaminSupplement = () => {
    if (supplementForm.nutrient) {
      const newSupplement = {
        id: Date.now(),
        ...supplementForm,
      };
      setVitaminSupplements([...vitaminSupplements, newSupplement]);
      setSupplementForm({
        nutrient: '',
        dosage: '',
        frequency: '',
        duration: '',
      });
    }
  };

  const handleRemoveVitaminSupplement = id => {
    setVitaminSupplements(vitaminSupplements.filter(item => item.id !== id));
  };

  // Fitness Plan Handlers
  const handleAddFitnessPlan = () => {
    if (fitnessForm.exerciseName) {
      const newPlan = {
        id: Date.now(),
        ...fitnessForm,
      };
      setFitnessPlans([...fitnessPlans, newPlan]);
      setFitnessForm({
        exerciseName: '',
        description: '',
      });
    }
  };

  const handleRemoveFitnessPlan = id => {
    setFitnessPlans(fitnessPlans.filter(item => item.id !== id));
  };

  // Digital Detox Handlers
  const handleAddDigitalDetox = () => {
    const trimmed = newDigitalDetox.trim();
    if (trimmed && !digitalDetox.includes(trimmed)) {
      setDigitalDetox([...digitalDetox, trimmed]);
      setNewDigitalDetox('');
    }
  };

  const handleRemoveDigitalDetox = index => {
    setDigitalDetox(digitalDetox.filter((_, idx) => idx !== index));
  };

  // Payload Building
  const buildRequestPayload = () => {
    return {
      student_id: id,
      consultant_user_id: userInfo?.user_id?.toString(),
      intolerance: intolerance,
      food_preferences: foodPreferences,
      body_parameters: bodyParameters,
      diagnosis: diagnosis,
      health_goals: healthGoals,
      interventions: interventions,
      lifestyle_modifications: lifestyleModifications,
      health_plate: healthPlate,
      diet_schedule: dietSchedule,
      hydration: hydration,
      suggestions: suggestions,
      vitamin_supplements: vitaminSupplements,
      fitness_plans: fitnessPlans,
      digital_detox: digitalDetox,
    };
  };

  // Save Handler
  const handleSave = async () => {
    try {
      setSaving(true);
      const requestBody = buildRequestPayload();

      const response = await createNutritionistPrescription(JSON.stringify(requestBody));

      if (response.status === true) {
        const successMessage = isUpdateMode ? 'Nutrition plan updated successfully!' : 'Nutrition plan saved successfully!';
        toastMessage(response.message || successMessage, 'success');
        router.back();
      } else {
        const errorMessage = isUpdateMode ? 'Failed to update nutrition plan.' : 'Failed to save nutrition plan.';
        toastMessage(response.message || errorMessage, 'error');
      }
    } catch (err) {
      console.error(`${isUpdateMode ? 'Update' : 'Save'} error:`, err);
      const errorMessage = isUpdateMode ? 'An error occurred while updating data.' : 'An error occurred while saving data.';
      toastMessage(err.message || errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Render Loading State
  if (loading) {
    return <InlineSpinner />;
  }

  return (
    <div className="w-full pt-[35px] pr-[34px] pb-[60px] pl-[34px] flex flex-col gap-10">
      {/* Medical Officer Remarks */}
      {medicalOfficerNutritionScreeningReport?.remarks && (
        <div className="w-full space-y-5 sm:space-y-7.5 pl-5 py-5 bg-[#FFF3E5] rounded-[8px]">
          <div className="flex gap-5">
            <h3 className="font-semibold text-sm text-gray-900">Medical Officer Remarks:</h3>
            <span className="text-red-500 text-sm font-normal">{medicalOfficerNutritionScreeningReport.remarks}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-10">
        {/* Header */}
        <div className="w-full space-y-[11px]">
          <div className="flex justify-between">
            <div className="flex left">
              <Image src="/iconx/school.svg" alt="school logo" width={36} height={36} className="flex-col" />
              <span className="leading-[24px] p-4 flex-col font-semibold text-[14px]">
                Dr. {userInfo?.first_name} {userInfo?.last_name} Clinic
              </span>
            </div>
            <div className="flex right">
              <Image src="/iconx/profile-image.svg" alt="profile" width={36} height={36} className="size-10 sm:size-12 md:size-14 rounded-full" />
              <div className="flex-col p-2">
                <span className="leading-[10px] font-semibold text-[14px]">
                  Dr. {userInfo?.first_name} {userInfo?.last_name}
                </span>
                <br />
                <span className="leading-[10px] text-[14px]">{userInfo?.user_role}</span>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* 1. Intolerance */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Intolerance</h1>
            <div className="flex-1">
              <textarea
                placeholder="Enter food intolerances..."
                className="w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none resize-none"
                rows="4"
                value={intolerance}
                onChange={e => setIntolerance(e.target.value)}
              />
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* 2. Food Preferences */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Food Preferences</h1>
            <div className="flex-1 flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                {/* <p className="font-medium text-sm leading-6 mb-0">Add Preferences</p> */}

                {/* Display existing preferences */}
                {foodPreferences.map((preference, index) => (
                  <div key={index} className="w-full flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]" />
                      <p className="mb-0 font-normal text-sm leading-6">{preference}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button type="button" onClick={() => handleRemoveFoodPreference(index)} className="focus:outline-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="#5389FF"
                          className="size-6 cursor-pointer"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9" />
                          <circle cx="12" cy="12" r="9" stroke="#5389FF" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new preference */}
                <div className="w-full flex gap-4 items-center justify-between">
                  <input
                    type="text"
                    className="min-w-[298px] w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none bg-white"
                    placeholder="Add food preference..."
                    value={newFoodPreference}
                    onChange={e => setNewFoodPreference(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddFoodPreference();
                    }}
                  />
                  <button type="button" onClick={handleAddFoodPreference} className="w-[22px] h-[22px] flex items-center justify-center focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* 3. Body Parameters */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Body Parameters</h1>
            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Weight (kgs)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm focus:outline-none"
                    value={bodyParameters.weight}
                    onChange={e => handleBodyParameterChange('weight', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Height (cms)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm focus:outline-none"
                    value={bodyParameters.height}
                    onChange={e => handleBodyParameterChange('height', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">BMI</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm focus:outline-none"
                    value={bodyParameters.bmi}
                    onChange={e => handleBodyParameterChange('bmi', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Muscle Mass (kgs)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm focus:outline-none"
                    value={bodyParameters.muscleMass}
                    onChange={e => handleBodyParameterChange('muscleMass', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bone Mass (kgs)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm focus:outline-none"
                    value={bodyParameters.boneMass}
                    onChange={e => handleBodyParameterChange('boneMass', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fat Content</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm focus:outline-none"
                    value={bodyParameters.fatContent}
                    onChange={e => handleBodyParameterChange('fatContent', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* 4. Diagnosis */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Diagnosis</h1>
            <div className="flex-1 flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                {/* <p className="font-medium text-sm leading-6 mb-0">Add Diagnosis</p> */}

                {/* Display existing diagnosis */}
                {diagnosis.map((item, index) => (
                  <div key={index} className="w-full flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]" />
                      <p className="mb-0 font-normal text-sm leading-6">{item}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button type="button" onClick={() => handleRemoveDiagnosis(index)} className="focus:outline-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="#5389FF"
                          className="size-6 cursor-pointer"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9" />
                          <circle cx="12" cy="12" r="9" stroke="#5389FF" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new diagnosis */}
                <div className="w-full flex gap-4 items-center justify-between">
                  <input
                    type="text"
                    className="min-w-[298px] w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none bg-white"
                    placeholder="Add diagnosis..."
                    value={newDiagnosis}
                    onChange={e => setNewDiagnosis(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddDiagnosis();
                    }}
                  />
                  <button type="button" onClick={handleAddDiagnosis} className="w-[22px] h-[22px] flex items-center justify-center focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* 5. Health Goals */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Health Goals</h1>
            <div className="flex-1 flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                <p className="font-medium text-sm leading-6 mb-0">Add Goals</p>

                {/* Display existing goals */}
                {healthGoals.map((goal, index) => (
                  <div key={index} className="w-full flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]" />
                      <p className="mb-0 font-normal text-sm leading-6">{goal}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button type="button" onClick={() => handleRemoveHealthGoal(index)} className="focus:outline-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="#5389FF"
                          className="size-6 cursor-pointer"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9" />
                          <circle cx="12" cy="12" r="9" stroke="#5389FF" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new goal */}
                <div className="w-full flex gap-4 items-center justify-between">
                  <input
                    type="text"
                    className="min-w-[298px] w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none bg-white"
                    placeholder="Add health goal..."
                    value={newHealthGoal}
                    onChange={e => setNewHealthGoal(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddHealthGoal();
                    }}
                  />
                  <button type="button" onClick={handleAddHealthGoal} className="w-[22px] h-[22px] flex items-center justify-center focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* 6. Interventions */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Interventions</h1>
            <div className="flex-1 flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                <p className="font-medium text-sm leading-6 mb-0">Add Interventions</p>

                {/* Display existing interventions */}
                {interventions.map((intervention, index) => (
                  <div key={index} className="w-full flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]" />
                      <p className="mb-0 font-normal text-sm leading-6">{intervention}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button type="button" onClick={() => handleRemoveIntervention(index)} className="focus:outline-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="#5389FF"
                          className="size-6 cursor-pointer"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9" />
                          <circle cx="12" cy="12" r="9" stroke="#5389FF" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new intervention */}
                <div className="w-full flex gap-4 items-center justify-between">
                  <input
                    type="text"
                    className="min-w-[298px] w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none bg-white"
                    placeholder="Add intervention..."
                    value={newIntervention}
                    onChange={e => setNewIntervention(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddIntervention();
                    }}
                  />
                  <button type="button" onClick={handleAddIntervention} className="w-[22px] h-[22px] flex items-center justify-center focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* 7. Lifestyle Modifications */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Lifestyle Modifications</h1>
            <div className="flex-1 flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                <p className="font-medium text-sm leading-6 mb-0">Health Goals with Remarks</p>

                {/* Display existing lifestyle modifications */}
                {lifestyleModifications.map(item => (
                  <div key={item.id} className="w-full flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]" />
                      <p className="mb-0 font-normal text-sm leading-6">
                        <span className="font-medium">{item.goal}:</span> {item.remarks}
                      </p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button type="button" onClick={() => handleRemoveLifestyleModification(item.id)} className="focus:outline-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="#5389FF"
                          className="size-6 cursor-pointer"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9" />
                          <circle cx="12" cy="12" r="9" stroke="#5389FF" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new lifestyle modification */}
                <div className="w-full flex gap-4 items-center justify-between">
                  <select
                    className="appearance-none w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm cursor-pointer"
                    value={selectedLifestyleGoal}
                    onChange={e => setSelectedLifestyleGoal(e.target.value)}
                  >
                    <option value="">Select Health Goal</option>
                    {healthGoals.map((goal, index) => (
                      <option key={index} value={goal}>
                        {goal}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Remarks..."
                    className="w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm focus:outline-none"
                    value={lifestyleRemarks}
                    onChange={e => setLifestyleRemarks(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddLifestyleModification}
                    className="w-[22px] h-[22px] flex items-center justify-center focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* 8. Health Plate */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Health Plate</h1>
            <div className="flex-1">
              <select
                className="w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm focus:outline-none"
                value={healthPlate}
                onChange={e => setHealthPlate(e.target.value)}
              >
                <option value="">Select...</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="non-vegetarian">Non-Vegetarian</option>
              </select>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* 9. Diet Schedule */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Diet Schedule</h1>
            <div className="flex-1 flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                <p className="font-medium text-sm leading-6 mb-0">Meal Options with Selections</p>

                {/* Display existing diet schedule */}
                {dietSchedule.map(item => (
                  <div key={item.id} className="w-full flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]" />
                      <p className="mb-0 font-normal text-sm leading-6">
                        <span className="font-medium">{item.meal}</span> - {item.option}: {item.remarks}
                      </p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button type="button" onClick={() => handleRemoveDietSchedule(item.id)} className="focus:outline-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="#5389FF"
                          className="size-6 cursor-pointer"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9" />
                          <circle cx="12" cy="12" r="9" stroke="#5389FF" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new diet schedule */}
                <div className="w-full flex gap-2 items-center justify-between">
                  <select
                    className="appearance-none flex-1 border border-[#D5D9E2] rounded-[8px] px-3 py-[10px] text-sm cursor-pointer"
                    value={selectedMeal}
                    onChange={e => setSelectedMeal(e.target.value)}
                  >
                    <option value="">Select Meal</option>
                    {mealOptions.map((meal, index) => (
                      <option key={index} value={meal}>
                        {meal}
                      </option>
                    ))}
                  </select>
                  <select
                    className="appearance-none flex-1 border border-[#D5D9E2] rounded-[8px] px-3 py-[10px] text-sm cursor-pointer"
                    value={selectedDietOption}
                    onChange={e => setSelectedDietOption(e.target.value)}
                  >
                    <option value="">Select Option</option>
                    {dietOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Remarks..."
                    className="flex-1 border border-[#D5D9E2] rounded-[8px] px-3 py-[10px] text-sm focus:outline-none"
                    value={dietRemarks}
                    onChange={e => setDietRemarks(e.target.value)}
                  />
                  <button type="button" onClick={handleAddDietSchedule} className="w-[22px] h-[22px] flex items-center justify-center focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* 10. Hydration */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Hydration</h1>
            <div className="flex-1">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Litre/Day</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm focus:outline-none"
                    value={hydration.litresPerDay}
                    onChange={e => handleHydrationChange('litresPerDay', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Glasses</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm focus:outline-none"
                    value={hydration.glasses}
                    onChange={e => handleHydrationChange('glasses', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* 11. Suggestions */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Suggestions</h1>
            <div className="flex-1 flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                <p className="font-medium text-sm leading-6 mb-0">Add Suggestions</p>

                {/* Display existing suggestions */}
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="w-full flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]" />
                      <p className="mb-0 font-normal text-sm leading-6">{suggestion}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button type="button" onClick={() => handleRemoveSuggestion(index)} className="focus:outline-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="#5389FF"
                          className="size-6 cursor-pointer"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9" />
                          <circle cx="12" cy="12" r="9" stroke="#5389FF" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new suggestion */}
                <div className="w-full flex gap-4 items-center justify-between">
                  <input
                    type="text"
                    className="min-w-[298px] w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none bg-white"
                    placeholder="Add suggestion..."
                    value={newSuggestion}
                    onChange={e => setNewSuggestion(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddSuggestion();
                    }}
                  />
                  <button type="button" onClick={handleAddSuggestion} className="w-[22px] h-[22px] flex items-center justify-center focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* 12. Vitamin and Supplements */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Vitamin and Supplements</h1>
            <div className="flex-1 flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                <p className="font-medium text-sm leading-6 mb-0">Nutrient Details</p>

                {/* Display existing supplements */}
                {vitaminSupplements.map(supplement => (
                  <div key={supplement.id} className="w-full flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]" />
                      <p className="mb-0 font-normal text-sm leading-6">
                        <span className="font-medium">{supplement.nutrient}</span> - {supplement.dosage}, {supplement.frequency}, {supplement.duration}
                      </p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button type="button" onClick={() => handleRemoveVitaminSupplement(supplement.id)} className="focus:outline-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="#5389FF"
                          className="size-6 cursor-pointer"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9" />
                          <circle cx="12" cy="12" r="9" stroke="#5389FF" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new supplement */}
                <div className="w-full flex gap-2 items-center justify-between">
                  <div className="f-full grid grid-cols-2 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Nutrient"
                      className="flex-1 border border-[#D5D9E2] rounded-[8px] px-3 py-[10px] text-sm focus:outline-none"
                      value={supplementForm.nutrient}
                      onChange={e => handleSupplementFormChange('nutrient', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Dosage"
                      className="flex-1 border border-[#D5D9E2] rounded-[8px] px-3 py-[10px] text-sm focus:outline-none"
                      value={supplementForm.dosage}
                      onChange={e => handleSupplementFormChange('dosage', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Frequency"
                      className="flex-1 border border-[#D5D9E2] rounded-[8px] px-3 py-[10px] text-sm focus:outline-none"
                      value={supplementForm.frequency}
                      onChange={e => handleSupplementFormChange('frequency', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      className="flex-1 border border-[#D5D9E2] rounded-[8px] px-3 py-[10px] text-sm focus:outline-none"
                      value={supplementForm.duration}
                      onChange={e => handleSupplementFormChange('duration', e.target.value)}
                    />
                  </div>
                  <button type="button" onClick={handleAddVitaminSupplement} className="w-[22px] h-[22px] flex items-center justify-center focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* 13. Fitness & Mindfulness Plan */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Fitness & Mindfulness Plan</h1>
            <div className="flex-1 flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                <p className="font-medium text-sm leading-6 mb-0">Exercise Plans</p>

                {/* Display existing fitness plans */}
                {fitnessPlans.map(plan => (
                  <div key={plan.id} className="w-full flex items-start justify-between">
                    <div className="flex gap-3 items-start">
                      <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF] mt-2" />
                      <div>
                        <p className="mb-2 font-medium text-sm leading-6">{plan.exerciseName}:</p>
                        <p className="mb-0 font-normal text-sm leading-6 whitespace-pre-line">{plan.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button type="button" onClick={() => handleRemoveFitnessPlan(plan.id)} className="focus:outline-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="#5389FF"
                          className="size-6 cursor-pointer"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9" />
                          <circle cx="12" cy="12" r="9" stroke="#5389FF" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new fitness plan */}
                <div className="w-full flex gap-4 items-start justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">Exercise Name:</label>
                    <input
                      type="text"
                      className="w-full border border-[#D5D9E2] rounded-[8px] px-3 py-[10px] text-sm focus:outline-none mb-3"
                      value={fitnessForm.exerciseName}
                      onChange={e => handleFitnessFormChange('exerciseName', e.target.value)}
                    />
                    <textarea
                      placeholder="Description (supports multiple lines)"
                      className="w-full border border-[#D5D9E2] rounded-[8px] px-3 py-[10px] text-sm focus:outline-none resize-none"
                      rows="3"
                      value={fitnessForm.description}
                      onChange={e => handleFitnessFormChange('description', e.target.value)}
                    />
                  </div>
                  <button type="button" onClick={handleAddFitnessPlan} className="w-[22px] h-[22px] flex items-center justify-center focus:outline-none mt-8">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* 14. Digital Detox */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Digital Detox</h1>
            <div className="flex-1 flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                <p className="font-medium text-sm leading-6 mb-0">Add Detox Plans</p>

                {/* Display existing digital detox */}
                {digitalDetox.map((detox, index) => (
                  <div key={index} className="w-full flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]" />
                      <p className="mb-0 font-normal text-sm leading-6">{detox}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button type="button" onClick={() => handleRemoveDigitalDetox(index)} className="focus:outline-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="#5389FF"
                          className="size-6 cursor-pointer"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9" />
                          <circle cx="12" cy="12" r="9" stroke="#5389FF" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new digital detox */}
                <div className="w-full flex gap-4 items-center justify-between">
                  <input
                    type="text"
                    className="min-w-[298px] w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none bg-white"
                    placeholder="Add digital detox plan..."
                    value={newDigitalDetox}
                    onChange={e => setNewDigitalDetox(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddDigitalDetox();
                    }}
                  />
                  <button type="button" onClick={handleAddDigitalDetox} className="w-[22px] h-[22px] flex items-center justify-center focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>
        {/* 15. Consultation status */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Consultation status</h1>
            <div className="flex-1">
              <select
                className="w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm focus:outline-none"
                // value={healthPlate}
                // onChange={e => setHealthPlate(e.target.value)}
              >
                <option value="">Select...</option>
                <option value="scheduled">Scheduled</option>
                <option value="follow-up">Set Follow Up</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>
      </div>
      <div className="w-full flex flex-col gap-5">
        <div className="flex justify-between">
          <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Next Referral</h1>
          <div className="flex-1">
            <textarea
              placeholder=""
              className="w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none resize-none"
              rows="3"
              // value={intolerance}
              // onChange={e => setIntolerance(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-[50px] flex justify-center items-center gap-5">
        <button className="font-normal w-[78px] h-[37px] py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap" onClick={() => router.back()}>
          Close
        </button>
        <button
          type="button"
          className="rounded-[5px] bg-indigo-500 h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {isUpdateMode ? 'Updating...' : 'Saving...'}
            </div>
          ) : isUpdateMode ? (
            'Update Changes'
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
}
