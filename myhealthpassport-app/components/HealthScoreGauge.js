import React, { useState } from 'react';
import GaugeChart from 'react-gauge-chart';


const HealthScoreGauge = ({ score }) => {

  return (
    <div className="health-gauge-container w-[100px]">
      <GaugeChart
        id="health-gauge"
        className="health-gauge"
        nrOfLevels={3} // Number of color sections
        colors={['#FF0000', '#FF8000', '#00CC00']} // Red, Orange, Green
        arcsLength={[0.50, 0.30, 0.20]} // Proportions for each section
        percent={score / 100} // Score as a percentage
        arcWidth={0.3} // Thickness of the arc
        needleColor="#000000" // Needle color
        needleBaseColor="#000000" // Needle base color
        textColor="#000000" // Text color
        formatTextValue={() => `${score}/100`} // Display score as "72/100"
        arcPadding={0.04}
        cornerRadius={0}
      />
    </div>
  );
};

export default HealthScoreGauge;
