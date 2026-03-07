'use client';

import React, { useEffect, useState } from 'react';
import CalendarPicker from '../Calendar';
import Image from 'next/image';
import Link from 'next/link';
import { getEvents } from '@/services/secureApis';
import InlineSpinner from '@/components/UI/InlineSpinner';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

const Schedule = ({ userInfo }) => {
  const [loading, setLoading] = useState(true);
  const [todayEvents, setTodayEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const rawResponse = await getEvents();
        const result = JSON.parse(rawResponse);
        if (result.status) {
          setTodayEvents(result.data.today_events || []);
          setUpcomingEvents(result.data.upcoming_events || []);
        } else {
          setError(result.message || 'Failed to fetch events');
        }
      } catch (err) {
        setError('Error loading events');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getRosterUrl = event => {
    const { school_id, assignment_id, class_name, section } = event;
    const baseSchoolId = school_id || 1;
    const eventId = assignment_id || 0;

    // Check if we have both class_name and section, and section contains only a single letter
    if (userInfo.role_type === 'CONSULTANT_TEAM') {
      return `/expert/patients/${event.student_id}`;
    } else {
      if (class_name && section && /^[A-Z]$/.test(section.trim())) {
        return `roster/${baseSchoolId}/class/${class_name}-${section}?eventid=${eventId}`;
      } else {
        return `roster/${baseSchoolId}?eventid=${eventId}`;
      }
    }
  };

  const getScheduledDatesFromApi = () => {
    const allEvents = [...todayEvents, ...upcomingEvents];
    return allEvents.map(event => new Date(event.date));
  };

  if (loading) {
    return <InlineSpinner />;
  }

  return (
    <div className="flex gap-16 justify-start w-full">
      <div className="flex flex-col gap-5 w-[35%]">
        <p className="mb-0 font-medium text-sm">Your Calendar</p>
        <CalendarPicker scheduledDates={getScheduledDatesFromApi()} />
      </div>
      <div className="flex flex-col gap-5  items-start w-[65%]">
        <div className="flex flex-col gap-4 w-full items-start">
          <p className="font-medium text-[14px] leading-[100%] mb-0">Ongoing</p>
          {todayEvents.length > 0 ? (
            todayEvents.map((event, index) => (
              <Link key={index} href={getRosterUrl(event)} className="w-full">
                {userInfo.role_type === 'CONSULTANT_TEAM' ? (
                  <div className="flex gap-[16px] rounded-[8px] border-2 border-[#5389FF] p-[20px] w-full">
                    <div className="flex flex-col gap-1.5">
                      <p className="font-normal text-[12px] leading-[100%] text-[#949494] mb-0"> {dayjs(event.slot_date).format(' dddd, D MMM YYYY') || ''}</p>
                      <p className="font-medium text-[14px] leading-[100%] mb-0">{event.student_name}</p>
                      <p className="font-medium text-[12px] leading-[100%] mb-0">
                        {event.slot_time} -{' '}
                        {dayjs(event.slot_date + ' ' + event.slot_time)
                          .add(30, 'minute')
                          .format('HH:mm')}{' '}
                        | Follow up patient
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-[16px] rounded-[8px] border-2 border-[#5389FF] p-[20px] w-full">
                    <Image alt="School logo" src={event?.school_image || '/brand-logos/school-logo.svg'} className="h-58px w-58px" width={58} height={58} />
                    <div className="flex flex-col gap-1.5">
                      <p className="font-normal text-[12px] leading-[100%] text-[#949494] mb-0"> {dayjs(event.date).format(' dddd, D MMM YYYY') || ''}</p>
                      <p className="font-medium text-[14px] leading-[100%] mb-0">{event.school_name}</p>
                      <p className="font-medium text-[12px] leading-[100%] mb-0">
                        {event?.slot_time} - {event?.to_time}
                        {/* {dayjs(event.slot_date + ' ' + event.slot_time)
                          .add(30, 'minute')
                          .format('HH:mm')}{' '}
                        | Follow up patient */}
                      </p>
                    </div>
                  </div>
                )}
              </Link>
            ))
          ) : (
            <p className="text-gray-700 text-xs font-medium">No Ongoing events scheduled </p>
          )}
        </div>
        <div className="flex flex-col gap-4 items-start w-full">
          <p className="font-medium text-[14px] leading-[100%] mb-0">Upcoming</p>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event, index) => (
              <Link key={index} href={getRosterUrl(event)} className="w-full">
                {userInfo.role_type === 'CONSULTANT_TEAM' ? (
                  <div className="flex gap-[16px] rounded-[8px] border-2 border-[#5389FF] p-[20px] w-full">
                    <div className="flex flex-col gap-1.5">
                      <p className="font-normal text-[12px] leading-[100%] text-[#949494] mb-0"> {dayjs(event.slot_date).format(' dddd, D MMM YYYY') || ''}</p>
                      <p className="font-medium text-[14px] leading-[100%] mb-0">{event.student_name}</p>
                      <p className="font-medium text-[12px] leading-[100%] mb-0">
                        {event.slot_time} -{' '}
                        {dayjs(event.slot_date + ' ' + event.slot_time)
                          .add(30, 'minute')
                          .format('HH:mm')}{' '}
                        | Follow up patient
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-[16px] rounded-[8px] border-2 border-[#5389FF] p-[20px] w-full">
                    <Image alt="School logo" src={event?.school_image || '/brand-logos/school-logo.svg'} className="h-58px w-58px" width={58} height={58} />
                    <div className="flex flex-col gap-1.5">
                      <p className="font-normal text-[12px] leading-[100%] text-[#949494] mb-0"> {dayjs(event.date).format(' dddd, D MMM YYYY') || ''}</p>
                      <p className="font-medium text-[14px] leading-[100%] mb-0">{event.school_name}</p>
                      {/* <p className="font-medium text-[12px] leading-[100%] mb-0">08:00 - 16:00 | 8 Hours</p> */}
                      <p className="font-medium text-[12px] leading-[100%] mb-0">
                        {event?.slot_time} - {event?.to_time}
                        {/* | Follow up patient */}
                      </p>
                    </div>
                  </div>
                )}
              </Link>
            ))
          ) : (
            <p className="text-gray-700 text-xs font-medium">No upcoming events scheduled</p>
          )}
          {/* <div className="flex gap-[16px] rounded-[8px] border-2 border-[#B3CBFF] p-[20px] w-full">
            <Image alt="company logo" src="/brand-logos/school-logo.svg" className="h-58px w-58px" width={58} height={58} />
            <div className="flex flex-col gap-1.5">
              <p className="font-normal text-[12px] leading-[100%] text-[#949494] mb-0">Thursday, 19 Sept 2025</p>
              <p className="font-medium text-[14px] leading-[100%] mb-0">International School of India</p>
              <p className="font-medium text-[12px] leading-[100%] mb-0">08:00 - 16:00 | 8 Hours</p>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
