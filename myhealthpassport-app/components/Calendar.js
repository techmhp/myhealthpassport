'use client';

import React, { useState, useEffect } from 'react';

const CalendarPicker = ({ initialSelectedDate, scheduledDates = [] }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState(initialSelectedDate || new Date());

  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    setCurrentMonth(new Date());
  }, []);

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const getMonthYearString = () => {
    const options = { month: 'long', year: 'numeric' };
    return currentMonth.toLocaleDateString('en-US', options);
  };

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (newMonth.getMonth() >= today.getMonth() && newMonth.getFullYear() >= today.getFullYear()) {
      setCurrentMonth(newMonth);
    }
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isScheduled = date => {
    return scheduledDates.some(
      scheduledDate =>
        scheduledDate.getDate() === date.getDate() && scheduledDate.getMonth() === date.getMonth() && scheduledDate.getFullYear() === date.getFullYear()
    );
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const blanks = Array(firstDay)
      .fill(null)
      .map((_, i) => <div key={`blank-${i}`} className="w-6 h-6 m-1"></div>);

    const days = Array(daysInMonth)
      .fill(null)
      .map((_, i) => {
        const day = i + 1;
        const dayDate = new Date(year, month, day);
        dayDate.setHours(0, 0, 0, 0);

        const isToday = dayDate.getTime() === today.getTime();
        const isPast = dayDate < today;
        const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
        const hasSchedule = isScheduled(dayDate);

        return (
          <div key={`day-${day}`} className="relative w-8 h-8 flex items-center justify-center m-1">
            <div
              onClick={() => !isPast && setSelectedDate(new Date(year, month, day))}
              className={`w-7 h-7 flex items-center justify-center rounded-full text-sm
    ${isSelected ? 'bg-blue-500 text-white' : ''}
    ${!isSelected && isPast && !isToday ? 'text-gray-300 cursor-not-allowed' : isSelected ? 'cursor-pointer' : 'cursor-pointer hover:bg-gray-100'}`}
            >
              {day}
            </div>
            {hasSchedule && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full"></div>}
          </div>
        );
      });

    return [...blanks, ...days];
  };

  return (
    <div className="border border-gray-400 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 text-gray-400"
          disabled={currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()}
        >
          &lt;
        </button>
        <span className="font-medium">{getMonthYearString()}</span>
        <button onClick={goToNextMonth} className="p-2 text-gray-400">
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center text-xs text-gray-400">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">{generateCalendarDays()}</div>
    </div>
  );
};

// Example usage
const Calendar = ({ scheduledDates = [] }) => {
  const [selectedDate, setSelectedDate] = useState(null);

  return <CalendarPicker initialSelectedDate={selectedDate} scheduledDates={scheduledDates} />;
};
export default Calendar;
