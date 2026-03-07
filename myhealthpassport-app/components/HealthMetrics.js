import React from 'react';
import Image from 'next/image';
import HealthScoreGauge from './HealthScoreGauge';

const assessmentData = [
  {
    category: 'Physical Screening Analysis',
    icon: '🔄',
    items: [
      {
        label: 'Calcium Intake: ',
        description: 'Daily consumption of calcium-rich foods like milk or paneer supports bone health, critical during teenage growth spurts.',
      },
      {
        label: 'Hydration: ',
        description: 'Drinking 6-8 glasses of water daily ensures proper hydration and supports metabolic and cognitive functions.',
      },
      {
        label: 'Physical Activity: ',
        description: 'Regular physical activity (3-4 times a week) is excellent for maintaining fitness, improving mood, and building strength.',
      },
      {
        label: 'Family Meals: ',
        description: 'Eating meals with the family encourages a positive relationship with food and provides a structured eating routine.',
      },
      {
        label: 'Screen-Free Eating: ',
        description: 'Avoiding distractions like TV or mobile during meals promotes mindful eating.',
      },
      {
        label: 'Portion Control: ',
        description: 'Practicing portion control helps prevent overeating and supports healthy digestion.',
      },
    ],
  },
];

const HealthMetrics = () => {
  return (
    <div className="w-full flex flex-col gap-6 md:gap-8 lg:gap-10 p-4 md:p-6 lg:pt-8 lg:pr-8 lg:pb-8 lg:pl-8 rounded-bl-lg rounded-br-lg border-t-0 border-r border-b border-l border-solid border-[#DCDCDC]">
      <div className="flex flex-col gap-3 md:gap-4 lg:gap-5">
        {/* Header */}
        <div className="flex justify-between items-center h-[30px]">
          <div className="flex gap-2.5">
            <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Health Score</h2>
            <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
          </div>
          <HealthScoreGauge score={80} />
        </div>
        <hr className="border-t border-[#B7B7B7]" />
      </div>
      {/* Basic Anthropometrics */}
      <MetricCard
        title="Basic Anthropometrics"
        status="Normal"
        details={[
          { label: 'Height', value: '150 cm' },
          { label: 'Weight', value: '40 kg' },
          { label: 'BMI', value: '17.78' },
        ]}
      />

      {/* Body Composition Analysis */}
      <MetricCard
        title="Body Composition Analysis"
        status="Normal"
        details={[
          { label: 'Fat Mass', value: '8 kg' },
          { label: 'Total Body Water', value: '24 kg' },
          { label: 'Fat Ratio', value: '32 kg' },
          { label: 'Water ratio', value: '50%' },
          { label: 'Fat Free Mass', value: '32 kg' },
          { label: 'Skeletal Muscle Mass', value: '12 kg' },
          { label: 'Muscle Mass', value: '18 kg' },
          { label: 'Skeletal Muscle Quality Index', value: '30%' },
          { label: 'Musle Rate', value: '45%' },
          { label: 'Protein Mass', value: '6 kg' },
          { label: 'Protein Ratio', value: '15%' },
        ]}
      />

      {/* Fat Distribution & Regional Composition */}
      <MetricCard
        title="Fat Distribution & Regional Composition"
        status="Normal"
        details={[
          { label: 'Visceral Fat', value: '3' },
          { label: 'Left Arm Fat Ratio', value: '10.5%' },
          { label: 'Subcutaneous Fat Mass', value: '5 kg' },
          { label: 'Subcutaneous Fat Ratio', value: '12.5%' },
          { label: 'Left Arm Fat Ratio', value: '10.5%' },
          { label: 'Right Arm Fat Ratio', value: '10.8%' },
          { label: 'Left Arm Fat Mass', value: '0.8 kg' },
          { label: 'Right Arm Fat Mass', value: '0.9 kg' },
          { label: 'Left Leg Fat Ratio', value: '12.1%' },
          { label: 'Right Leg Fat Ratio', value: '12.3%' },
          { label: 'Left Leg Fat Mass', value: '1.2 kg' },
          { label: 'Right Leg Fat Mass', value: '1.3 kg' },
          { label: 'Trunk Fat Ratio', value: '18.5%' },
          { label: 'Trunk Fat Mass', value: '3.5%' },
        ]}
      />

      {/* Muscle Mass & Strength Distribution */}
      <MetricCard
        title="Muscle Mass & Strength Distribution"
        status="Normal"
        details={[
          { label: 'Left Arm Muscle Rate', value: '45.0%' },
          { label: 'Right Arm Muscle Rate', value: '44.5%' },
          { label: 'Left Arm Muscle Mass', value: '1.5 kg' },
          { label: 'Right Arm Muscle Mass', value: '1.6 kg' },
          { label: 'Left Leg Muscle Rate', value: '48.2%' },
          { label: 'Right Leg Muscle Rate', value: '48.5%' },
          { label: 'Left Leg Muscle Mass', value: '4.5 kg' },
          { label: 'Right Leg Muscle Mass', value: '4.7 kg' },
          { label: 'Trunk Muscle Rate', value: '50.1%' },
          { label: 'Trunk Muscle Mass', value: '9.8 kg' },
        ]}
      />

      {/* Hydration & Cellular Health */}
      <MetricCard
        title="Hydration & Cellular Health"
        status="Normal"
        details={[
          { label: 'Intracellular Water', value: '14 kg' },
          { label: 'Extracellular Water', value: '10 kg' },
          { label: 'Body Cell Mass', value: '20 kg' },
        ]}
      />

      {/* Metabolic & Health Indicators */}
      <MetricCard
        title="Metabolic & Health Indicators"
        status="Normal"
        details={[
          { label: 'Health Score', value: '88' },
          { label: 'Health Evaluation', value: '45.0%' },
          { label: 'Body Age', value: '44.5%' },
          { label: 'BMR', value: '1.5 kg' },
          { label: 'Obesity Level', value: '1.6' },
          { label: 'Adiposity Level', value: '48.2%' },
          { label: 'Body Type', value: '48.5%' },
        ]}
      />

      {/* Metabolic & Fitness Control Indicators */}
      <MetricCard
        title="Metabolic & Fitness Control Indicators"
        status="Normal"
        details={[
          { label: 'Fat Control', value: '-2 kg' },
          { label: 'Muscle Control', value: '1.5 kg' },
          { label: 'Weight Control', value: '1.2 kg' },
          { label: 'Standard Weight', value: '1.5 kg' },
          { label: 'Bone Mass', value: '1.2 kg' },
          { label: 'Minerals', value: '1.2 kg' },
        ]}
      />

      {/* Cardiovascular & Circulatory Indicators */}
      <MetricCard
        title="Cardiovascular & Circulatory Indicators"
        status="Normal"
        details={[
          { label: 'Heart Rate', value: '80 bpm' },
          { label: 'Waist-Hip Ratio', value: '0.9' },
        ]}
      />

      {assessmentData.map((section, index) => (
        <div key={index} className="space-y-4 md:space-y-6 lg:space-y-7.5">
          <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex flex-col gap-3 md:gap-4 lg:gap-5 w-full md:w-2/5 mb-4 md:mb-0">
              <div>
                <Image src="/detailed-reports-icons/physical-screening-analysis.svg" alt="physical-screening-analysis" width={22} height={22} />
              </div>
              <div>
                <h3 className="font-semibold text-[14px] text-gray-900 leading-[100%] tracking-[0%]">{section.category}</h3>
              </div>
            </div>
            <div className="w-full md:w-3/5">
              <div className="flex flex-col gap-3">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-start md:items-center justify-start gap-2 md:gap-3">
                    <div className="mt-1 md:mt-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#5389FF" className="size-4 md:size-4.5">
                        <path
                          fillRule="evenodd"
                          d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <span className="font-medium text-xs md:text-sm">{item.label}</span>
                      <span className="text-xs md:text-sm font-normal">{item.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const MetricCard = ({ title, status, details }) => {
  return (
    <div className="flex flex-col gap-3 md:gap-4 lg:gap-5">
      {/* Header */}
      <div className="flex justify-between items-center h-[30px]">
        <div className="flex gap-2.5">
          <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">{title}</h2>
          <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
        </div>
        {/* <div className="flex items-center gap-2 border border-green-400 bg-green-50 text-green-500 px-2 py-1 rounded-md text-sm font-medium">✓ {status}</div> */}
      </div>

      {/* Data Section */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
        {details.map((item, index) => (
          <div key={index} className="space-y-[10px]">
            <p className="font-medium text-sm leading-none tracking-normal">{item.value}</p>
            <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">{item.label}</p>
          </div>
        ))}
      </div>
      <hr className="border-t border-[#B7B7B7]" />
    </div>
  );
};

export default HealthMetrics;
