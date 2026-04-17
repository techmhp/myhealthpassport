'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { importSmartScaleData, getSmartScaleData, confirmSmartScaleData } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import dayjs from 'dayjs';
import InlineSpinner from '@/components/UI/InlineSpinner';
import HealthScoreGauge from '../HealthScoreGauge';


const PhysicalScreening = () => {
  const router = useRouter();
  const { schoolid, studentId, id } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(true);
  const [results, setResults] = useState({});
  const [transactionId, setTransactionId] = useState(null);
  const [showErrorMessage, setShowErrorMessage] = useState(null);

  useEffect(() => {
    const base64User = localStorage.getItem('user_info');
    const user_info = JSON.parse(atob(base64User));
    setUserRole(user_info.user_role);

    async function fetchData() {
      try {
        const recordId = studentId ? studentId : id;
        const response = await getSmartScaleData(recordId);
        const result = JSON.parse(response);
        if (result && result.status === true) {
          setResults(res => ({
            ...res,
            ...result.data.smart_scale_data,
          }));
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
        toastMessage(err.message || 'Something went wrong', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleFileChange = async event => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setShowErrorMessage(null);

    try {
      const response = await importSmartScaleData(selectedFile, studentId, schoolid);
      if (response && response.status === true) {
        setTransactionId(response.data.transaction_id);
        setResults(res => ({
          ...res,
          ...response.data.preview_data,
        }));
        toastMessage(response.message || 'Smart scale data imported successfully', 'success');
      } else {
        setShowErrorMessage(response.message || 'Failed to import smart scale data');
      }
    } catch (err) {
      setShowErrorMessage(err.message || 'Something went wrong');
    }
  };

  const SmartScaleDataConfirm = async () => {
    let postData = {
      transaction_id: transactionId,
      save_data: true,
    };
    try {
      const response = await confirmSmartScaleData(JSON.stringify(postData));
      if (response.status === true) {
        toastMessage(response.message || 'Student smart scale data successfully updated', 'success');
      } else {
        toastMessage(response.message || 'Confirmation failed', 'error');
      }
    } catch (err) {
      toastMessage(err.message || 'Confirmation failed', 'error');
    } finally {
      router.refresh();
      setTransactionId(null);
      setFile(null);
    }
  };

  if (loading) {
    return (
      <div className='w-full py-8'>
        <InlineSpinner />
      </div>
    );
  }

  return (
    <div className="w-full">
      {userRole === 'PHYSICAL_WELLBEING' ? (
        <div className="mb-[50px] flex justify-center items-center gap-5">
          <div className="flex flex-col gap-[12px]">
            <input id="fileInput" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
            <label
              htmlFor="fileInput"
              className="cursor-pointer rounded-[5px] bg-indigo-500  h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 whitespace-nowrap"
            >
              <span className="font-medium leading-6">{file ? file.name : 'Upload File (.xlsx, .csv)'}</span>
            </label>
          </div>
          {/* <button
            type="button"
            className="rounded-[5px] bg-indigo-500  h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 whitespace-nowrap"
            disabled={true}
          >
            Upload PDF
          </button> */}
        </div>
      ) : (
        ''
      )}

      {showErrorMessage !== null ? <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>{showErrorMessage}</div> : ''}
      {Object.keys(results).length > 0 ? (
        <div className="w-full flex flex-col gap-6 md:gap-8 lg:gap-10 p-4 md:p-6 lg:pt-8 lg:pr-8 lg:pb-8 lg:pl-8 rounded-bl-lg rounded-br-lg ">
          <div className="flex flex-col gap-3 md:gap-4 lg:gap-5">
            <div className="flex justify-between items-center h-[30px]">
              <div className="flex gap-2.5">
                <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Health Score</h2>
                <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
                <p>{results.physical_score}/100</p>
              </div>

              <HealthScoreGauge score={results.physical_score} />
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>

          {/* 1.Basic Anthropometrics */}
          <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
            {/* Header */}
            <div className="flex justify-between items-center h-[30px]">
              <div className="flex gap-2.5">
                <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Basic Anthropometrics</h2>
                <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
              </div>
            </div>
            {/* Body */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.height_cm} cm</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Height (cm)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.age_years} years</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Age (years)</p>
              </div>
              {userRole !== 'PARENT' ?
                <div className="space-y-[10px]">
                  <p className="font-medium text-sm leading-none tracking-normal">{dayjs(results.weighing_time).format('DD/MM/YYYY HH:mm:ss')}</p>
                  <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Weighing time</p>
                </div>
                : ''}
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.body_weight_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Body weight (kg)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.bmi}</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">BMI</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.physical_age} years</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Physical age</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.body_type}</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Body type</p>
              </div>
              {userRole !== 'PARENT' ?
                <div className="space-y-[10px]">
                  <p className="font-medium text-sm leading-none tracking-normal">{results.standard_body_weight}</p>
                  <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Standard body weight</p>
                </div>
                : ''}
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.ideal_weight}</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Ideal Weight</p>
              </div>
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>

          {/* 2.Body Composition Analysis */}
          <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
            {/* Header */}
            <div className="flex justify-between items-center h-[30px]">
              <div className="flex gap-2.5">
                <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Body Composition Analysis</h2>
                <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
              </div>
            </div>
            {/* Body */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
              {userRole !== 'PARENT' ?
                <div className="space-y-[10px]">
                  <p className="font-medium text-sm leading-none tracking-normal">{results.body_fat_rate_percent}%</p>
                  <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Body fat rate (%)</p>
                </div>
                : ''}
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.fat_content_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Fat content (kg)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.lean_body_mass_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Lean body mass (kg)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.muscle_mass_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Muscle mass (kg)</p>
              </div>
              {userRole !== 'PARENT' ?
                <div className="space-y-[10px]">
                  <p className="font-medium text-sm leading-none tracking-normal">{results.muscle_rate_percent}%</p>
                  <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Muscle rate (%)</p>
                </div>
                : ''}
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.skeletal_muscle_mass_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Skeletal muscle mass (Kg)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.skeletal_muscle_mass_index}</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Skeletal muscle mass index</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.bone_mass_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Bone mass (kg)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.protein_content_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Protein content (kg)</p>
              </div>
              {userRole !== 'PARENT' ?
                <div className="space-y-[10px]">
                  <p className="font-medium text-sm leading-none tracking-normal">{results.internal_protein_rate_percent}%</p>
                  <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Internal protein rate (%)</p>
                </div>
                : ''}
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>

          {/* 3.Fat Distribution & Regional Composition */}
          <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
            {/* Header */}
            <div className="flex justify-between items-center h-[30px]">
              <div className="flex gap-2.5">
                <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Fat Distribution & Regional Composition</h2>
                <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
              </div>
            </div>
            {/* Body */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.subcutaneous_fat_volume_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Subcutaneous fat volume (kg)</p>
              </div>
              {userRole !== 'PARENT' ?
                <div className="space-y-[10px]">
                  <p className="font-medium text-sm leading-none tracking-normal">{results.subcutaneous_fat_rate}%</p>
                  <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Subcutaneous fat rate</p>
                </div>
                : ''}
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.visceral_fat_level}</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Visceral fat level</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.left_hand_fat_mass_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left Hand Fat Mass (kg)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.right_hand_fat_mass_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right Hand Fat Mass (kg)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.left_foot_fat_mass_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left Foot Fat Mass (kg)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.right_foot_fat_mass_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right Foot Fat Mass (kg)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.trunk_fat_mass_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Trunk Fat Mass (kg)</p>
              </div>
              {userRole !== 'PARENT' ?
                <>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.left_hand_fat_rate_percent}%</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left hand fat rate (%)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.right_hand_fat_rate_percent}%</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right hand fat rate (%)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.left_foot_fat_rate_percent}%</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left foot fat rate (%)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.right_foot_fat_rate_percent}%</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right foot fat rate (%)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.trunk_fat_rate_percent}%</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Trunk fat rate (%)</p>
                  </div>
                </>
                : ''}
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.whr}</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">WHR (Waist-Hip Ratio)</p>
              </div>
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>


          {/* 4.Muscle Mass & Strength Distribution */}
          <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
            {/* Header */}
            <div className="flex justify-between items-center h-[30px]">
              <div className="flex gap-2.5">
                <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Muscle Mass & Strength Distribution</h2>
                <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
              </div>
            </div>
            {/* Body */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.left_hand_muscle_mass_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left hand muscle mass (kg)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.right_hand_muscle_mass_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right hand muscle mass (kg)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.left_foot_muscle_mass_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left foot muscle mass (kg)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.right_foot_muscle_mass_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right foot muscle mass (kg)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.trunk_muscle_mass_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Trunk muscle mass (kg)</p>
              </div>
              {userRole !== 'PARENT' ?
                <>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.left_hand_muscle_rate}%</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left hand muscle rate</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.right_hand_muscle_rate}%</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right hand muscle rate</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.left_leg_muscle_rate}%</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left leg muscle rate</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.right_foot_muscle_rate}%</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right foot muscle rate</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.trunk_muscle_rate}%</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Trunk muscle rate</p>
                  </div>
                </>
                : ''}
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.skeletal_muscle_rate_percent}%</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Skeletal muscle rate (%)</p>
              </div>
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>

          {/* 5.Hydration & Cellular Health */}
          <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
            {/* Header */}
            <div className="flex justify-between items-center h-[30px]">
              <div className="flex gap-2.5">
                <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Hydration & Cellular Health</h2>
                <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
              </div>
            </div>
            {/* Body */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.water_content_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Water content (kg)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.body_moisture_content_percent}%</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Body moisture content (%)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.inorganic_salt_content_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Inorganic salt content (Kg)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.body_cell_volume_kg} kg</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Body cell volume (kg)</p>
              </div>
              {userRole !== 'PARENT' ?
                <>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.extracellular_water_volume_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Extracellular water volume (kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.intracellular_water_volume_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Intracellular water volume (kg)</p>
                  </div>
                </>
                : ''}
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>

          {/* 6.Metabolic Health Indicators */}
          <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
            {/* Header */}
            <div className="flex justify-between items-center h-[30px]">
              <div className="flex gap-2.5">
                <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Metabolic Health Indicators</h2>
                <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
              </div>
            </div>
            {/* Body */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.bmr}</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">BMR (Basal Metabolic Rate)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.obesity_percent}%</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Obesity (%)</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.obesity_level}</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Obesity level</p>
              </div>
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>

          {/* 7.Metabolic & Fitness Control Indicators */}
          {userRole !== 'PARENT' ?
            <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
              {/* Header */}
              <div className="flex justify-between items-center h-[30px]">
                <div className="flex gap-2.5">
                  <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Metabolic & Fitness Control Indicators</h2>
                  <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
                </div>
              </div>
              {/* Body */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
                <div className="space-y-[10px]">
                  <p className="font-medium text-sm leading-none tracking-normal">{results.fat_control_quantity}</p>
                  <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Fat control quantity</p>
                </div>
                <div className="space-y-[10px]">
                  <p className="font-medium text-sm leading-none tracking-normal">{results.weight_control_quantity}</p>
                  <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Weight control quantity</p>
                </div>
                <div className="space-y-[10px]">
                  <p className="font-medium text-sm leading-none tracking-normal">{results.muscle_control_quantity}</p>
                  <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Muscle control quantity</p>
                </div>
              </div>
              <hr className="border-t border-[#B7B7B7]" />
            </div>
            : ''}

          {/* 8.Cardiovascular & Circulatory Indicators */}
          <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
            {/* Header */}
            <div className="flex justify-between items-center h-[30px]">
              <div className="flex gap-2.5">
                <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Cardiovascular & Circulatory Indicators</h2>
                <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
              </div>
            </div>
            {/* Body */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.heart_rate_beats_min}</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Heart rate (beats/min)</p>
              </div>
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>

          {/* 9.Overall Health Scores */}
          <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
            {/* Header */}
            <div className="flex justify-between items-center h-[30px]">
              <div className="flex gap-2.5">
                <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Overall Health Scores</h2>
                <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
              </div>
            </div>
            {/* Body */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.physical_score}</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Physical score</p>
              </div>
              <div className="space-y-[10px]">
                <p className="font-medium text-sm leading-none tracking-normal">{results.health_level}</p>
                <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Health level</p>
              </div>
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>
        </div>
      ) : (
        <div className="w-full flex justify-center items-center h-[200px]">
          <p className="text-gray-500">No smart scale data available for this student.</p>
        </div>
      )}
      {transactionId !== null ? (
        <div className="mb-[50px] flex justify-center items-center gap-5">
          <button className="font-normal w-[78px] h-[37px] py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap">Close</button>
          <button
            type="submit"
            onClick={SmartScaleDataConfirm}
            className="rounded-[5px] bg-indigo-500  h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 whitespace-nowrap"
          >
            Save Changes
          </button>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default PhysicalScreening;
