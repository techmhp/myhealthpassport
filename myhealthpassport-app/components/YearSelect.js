// YearSelect.jsx
import { useState } from 'react';
import { getCurrentAcademicYear } from '@/helpers/academicYear';

export default function YearSelect({ onYearChange }) {
  const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear());

  // Static year options from 2022 to 2028
  const years = ['2022-2023', '2023-2024', '2024-2025', '2025-2026', '2026-2027', '2027-2028'];

  const handleYearChange = year => {
    setSelectedYear(year);
    if (onYearChange) {
      onYearChange(year);
    }
  };

  return (
    <div className="flex gap-2 items-center w-full justify-center sm:justify-end">
      <label className="font-normal text-[12px] leading-4 tracking-[0]">Select Year</label>
      <div className="relative w-48">
        <select
          className="font-normal text-[14px] tracking-[0] text-[#464646] appearance-none w-full rounded-lg border border-[#D5D9E2] px-4 py-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedYear}
          onChange={e => handleYearChange(e.target.value)}
        >
          {years.map(year => (
            <option key={year} value={year} className="font-normal text-[14px] leading-6 tracking-[0] text-[#464646]">
              {year}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
