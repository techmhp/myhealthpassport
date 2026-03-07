import React from 'react';
import Image from 'next/image';

const Nutritionist = () => {
  return (
    <div className="w-full flex flex-col gap-10 pt-8 pr-8 pb-8 pl-8 rounded-bl-lg rounded-br-lg border-t-0 border-r border-b border-l border-solid border-[#DCDCDC]">
      {/* Header section with clinic and expert info */}
      <div className="flex flex-col gap-8">
        <div className="w-full space-y-[11px]">
          <div className="flex justify-between">
            <div className="flex left">
              <Image src="/iconx/school.svg" alt="school logo" width={36} height={36} className="flex-col" />
              <span className="leading-[24px] p-4 flex-col font-semibold text-[14px]">Dr. Ajay's Awesome Clinic</span>
            </div>
            <div className="flex right">
              <Image src="/iconx/profile-image.svg" alt="profile image" width={36} height={36} className="size-10 sm:size-12 md:size-14 rounded-full" />
              <div className="flex-col p-2">
                <span className="leading-[10px] font-semibold text-[14px]">Devansh Aurora</span>
                <br />
                <span className="leading-[10px] text-[14px]">14 Y/o | Male</span>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Health Goals Section (Patient Concern in code) */}
        <div className="w-full space-y-[11px]">
          <div className="flex pb-[11px] justify-between">
            <label className="block text-sm/6 font-semibold text-gray-900 w-[40%]">Health Goals</label>
            <div className="w-[60%] flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 flex-shrink-0 text-blue-500">
                  <Image src="/health-records/check.svg" width={18} height={18} alt="Check" className="w-full h-full object-contain" />
                </div>
                <p className="m-0 font-normal text-sm leading-6">
                  <span className="font-medium">Fever:</span> Body temperature of 39C since 2 days.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-4 h-4 flex-shrink-0 text-blue-500">
                  <Image src="/health-records/check.svg" width={18} height={18} alt="Check" className="w-full h-full object-contain" />
                </div>
                <p className="m-0 font-normal text-sm leading-6">
                  <span className="font-medium">Body Pains & Weakness:</span> Muscle fatigue and general weakness from the time the fever started.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-4 h-4 flex-shrink-0 text-blue-500">
                  <Image src="/health-records/check.svg" width={18} height={18} alt="Check" className="w-full h-full object-contain" />
                </div>
                <p className="m-0  font-normal text-sm leading-6">
                  <span className="font-medium">Headache:</span> Intense headache that worsens with movement.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-4 h-4 flex-shrink-0 text-blue-500">
                  <Image src="/health-records/check.svg" width={18} height={18} alt="Check" className="w-full h-full object-contain" />
                </div>
                <p className="m-0  font-normal text-sm leading-6">
                  <span className="font-medium">Loss of Appetite:</span> Not feeling hungry and unable to eat since symptoms began.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-4 h-4 flex-shrink-0 text-blue-500">
                  <Image src="/health-records/check.svg" width={18} height={18} alt="Check" className="w-full h-full object-contain" />
                </div>
                <p className="m-0 font-normal text-sm leading-6">
                  <span className="font-medium">Chills:</span> Experiencing chills and shivering episodes, particularly at night.
                </p>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>
      </div>

      <div className="w-full space-y-[11px]">
        <div className="w-full flex flex-col gap-10">
          {/* Top 5 Interventions Section (Findings in code) */}
          <div className="w-full flex flex-col gap-5">
            <div className="flex justify-between">
              <h1 className="w-[40%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Top 5 Lifestyle Interventions</h1>
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="mb-2 font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="mb-2 font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows signs for general viral fever.
                  </p>
                </div>
              </div>
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>

          {/* Lifestyle Modification Guidelines Section */}
          <div className="w-full flex flex-col gap-5">
            <div className="flex justify-between">
              <h1 className="w-[40%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Lifestyle Modification Guidelines</h1>
              <div className="flex-1 flex flex-col gap-1">
                {/* For Improving Sleep */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">For Improving Sleep</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows signs for general viral fever.
                  </p>
                </div>

                {/* For Pre Diabetics Management */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">For Pre Diabetics Management</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows signs for general viral fever.
                  </p>
                </div>

                {/* For Cholesterol Management */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">For Cholesterol Management</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows signs for general viral fever.
                  </p>
                </div>

                {/* For Managing Sugar Cravings */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">For Managing Sugar Cravings</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows signs for general viral fever.
                  </p>
                </div>
              </div>
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>

          <div className="w-full flex flex-col gap-5">
            <div className="flex justify-between">
              <h1 className="w-[40%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Lifestyle Modification Guidelines</h1>
              <div className="flex-1 flex flex-col gap-1">
                {/* Pre Breakfast */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">Pre Breakfast</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows sing for general viral fever.
                  </p>
                </div>

                {/* Breakfast */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">Breakfast</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows sing for general viral fever.
                  </p>
                </div>

                {/* Mid Morning */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">Mid Morning</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows sing for general viral fever.
                  </p>
                </div>

                {/* Lunch */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">Lunch</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows sing for general viral fever.
                  </p>
                </div>

                {/* Snacks/Pre Workout */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">Snacks/Pre Workout</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows sing for general viral fever.
                  </p>
                </div>

                {/* Dinner */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">Dinner</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows sing for general viral fever.
                  </p>
                </div>

                {/* Bedtime */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">Bedtime</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows sing for general viral fever.
                  </p>
                </div>

                {/* Midnight Snack */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">Midnight Snack</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows sing for general viral fever.
                  </p>
                </div>

                {/* Healthy Swap Options */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">Healthy Swap Options</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows sing for general viral fever.
                  </p>
                </div>
              </div>
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>

          {/* Vitamin Supplements Section */}
          <div className="w-full flex flex-col gap-5">
            <div className="flex justify-between">
              <h1 className="w-[40%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Vitamin Supplements</h1>
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="mb-2 font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="mb-2 font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows signs for general viral fever.
                  </p>
                </div>
              </div>
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>

          {/* Measurement Details Section */}
          <div className="w-full flex flex-col gap-5">
            <div className="flex justify-between">
              <h1 className="w-[40%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Measurement Details</h1>
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="mb-2 font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="mb-2 font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows signs for general viral fever.
                  </p>
                </div>
              </div>
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>

          {/* Fitness Plan for Lower Back Pain Section */}
          <div className="w-full flex flex-col gap-5">
            <div className="flex justify-between">
              <h1 className="w-[40%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Fitness Plan for Lower Back Pain</h1>
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="mb-2 font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="mb-2 font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows signs for general viral fever.
                  </p>
                </div>
              </div>
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>

          {/* Back Exercises Section */}
          <div className="w-full flex flex-col gap-5">
            <div className="flex justify-between">
              <h1 className="w-[40%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Back Isometric Exercises</h1>
              <div className="flex-1 flex flex-col gap-1">
                {/* Knee to Chest */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">Knee to Chest</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows signs for general viral fever.
                  </p>
                </div>

                {/* Bridge */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">Bridge</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows signs for general viral fever.
                  </p>
                </div>

                {/* Pelvic Tilt */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">Pelvic Tilt</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows signs for general viral fever.
                  </p>
                </div>

                {/* Cat & Camel Exercise */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">Cat & Camel Exercise</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows signs for general viral fever.
                  </p>
                </div>

                {/* Superman Pose */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">Superman Pose</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows signs for general viral fever.
                  </p>
                </div>

                {/* Child Pose */}
                <div className="flex items-start gap-3">
                  <p className="font-semibold text-[14px] leading-[100%] tracking-[0%] text-[#5389FF]">Child Pose</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">Food Poisoning:</span> Patient might've confused unsanitary food when eating out the night before the fever
                    started.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full flex-shrink-0 w-[10px] h-[10px] bg-[#5389FF] mt-1.5"></div>
                  <p className="font-normal text-sm leading-6">
                    <span className="font-medium">General Viral Fever:</span> Patient shows signs for general viral fever.
                  </p>
                </div>
              </div>
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>

          {/* Expert Signature Section */}
          <div className="w-full flex flex-col gap-2">
            <div className="flex pb-[11px]">
              <div className="w-full">
                <div className="flex-col p-2 float-right">
                  {/* <Image src="/iconx/signature.svg" width={100} height={100} alt="signature" /> */}
                  <span className="leading-[24px] font-semibold text-[14px]">Dr. Ajay Agarwal</span>
                  <br />
                  <span className="leading-[24px] text-[14px]">MBBS | More Specialisation</span>
                </div>
              </div>
            </div>
            <hr className="border-t border-[#B7B7B7]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nutritionist;
