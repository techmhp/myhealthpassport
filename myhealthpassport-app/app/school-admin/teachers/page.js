'use client';

import React, { useState, useEffect } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import Header from '@/components/Header';
import ViewAllTeachers from '@/components/ViewAllTeachers';
import PlusButton from '@/components/UI/PlusButton';
import Link from 'next/link';
import { teachersList } from '@/services/secureApis';
import Image from 'next/image';
import InlineSpinner from '@/components/UI/InlineSpinner';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTeachersData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch Teachers List
        const teachersResponse = await teachersList();
        const teachersResults = JSON.parse(teachersResponse);
        if (teachersResults.status === true) {
          const teachersData = teachersResults.data.teachers_list;
          setTeachers(teachersData);
          setFilteredTeachers(teachersData);
        } else {
          setError('Failed to fetch teachers: ' + teachersResults.message);
        }
      } catch (error) {
        setError('Error fetching teachers data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeachersData();
  }, []);

  // Handle search functionality
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTeachers(teachers);
    } else {
      const filtered = teachers.filter(
        teacher =>
          `${teacher.first_name} ${teacher.middle_name} ${teacher.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.phone.includes(searchTerm) ||
          teacher.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.class_room.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTeachers(filtered);
    }
  }, [searchTerm, teachers]);

  const handleSearchChange = e => {
    setSearchTerm(e.target.value);
  };

  return (
    <>
      <Header />
      <div className="p-4 px-[80px]">
        <div className="">
          <Breadcrumbs
            items={[
              {
                name: 'View All Teachers',
                href: '#',
                current: true,
              },
            ]}
            homeLabel="Teachers"
            homeHref="/school-admin/teachers"
          />
        </div>

        {/* Content Area with Loading/Error States */}
        <div className="bg-white rounded-lg pt-2">
          {loading ? (
            <div className="p-8 text-center">
              <InlineSpinner />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-500">{error}</div>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">{searchTerm ? 'No teachers found matching your search.' : 'No teachers found.'}</div>
            </div>
          ) : (
            <ViewAllTeachers teachers={filteredTeachers} />
          )}
        </div>
      </div>
      <Link href={'/school-admin/teachers/add'}>
        <PlusButton />
      </Link>
    </>
  );
};

export default Teachers;
