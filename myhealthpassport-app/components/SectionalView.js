'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import nookies from 'nookies';
import InlineSpinner from '@/components/UI/InlineSpinner';
import { studentListByCategory } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';

const SectionalView = ({ school = [] }) => {
  const cookies = nookies.get();
  const [root, setRoot] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [studentsByCategory, setStudentsByCategory] = useState({});

  useEffect(() => {
    if (cookies.root && cookies.root !== 'undefined') {
      setRoot(cookies.root);
    }

    if (Object.keys(school).length > 0) {
      // Fetch Student List by Category
      studentListByCategory(school.school_id)
        .then(response => {
          const studentResults = JSON.parse(response);
          if (studentResults.status === true) {
            setStudentsByCategory(studentResults.data);

            // Initialize expanded sections
            const initialExpandedSections = {};
            Object.keys(categoryDisplayNames).forEach(category => {
              if (studentResults.data[category] && studentResults.data[category].length > 0) {
                initialExpandedSections[categoryDisplayNames[category]] = false;
              }
            });
            setExpandedSections(initialExpandedSections);

            // Initialize expanded classes
            const initialExpandedClasses = {};
            Object.keys(studentResults.data).forEach(category => {
              if (studentResults.data[category] && studentResults.data[category].length > 0) {
                studentResults.data[category].forEach((classData, index) => {
                  const classNumber = classData.class.replace('th Class', '').replace('st Class', '').replace('nd Class', '').replace('rd Class', '');
                  const className = `Class ${classNumber}`;
                  initialExpandedClasses[className] = false;
                });
              }
            });
            setExpandedClasses(initialExpandedClasses);
          }
        })
        .catch(err => {
          console.log('err', err);
          toastMessage(err.message || 'An error occurred while fetching data', 'error');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [school]);

  const baseUrlMap = {
    admin: `/admin/schools/${school?.school_id}`,
    'school-admin': `/school-admin/students`,
    screening: `/screening/roster/${school?.school_id}`,
    analyst: `/analyst/roster/${school?.school_id}`,
    teacher: `/teacher/home`,
    parent: `/parent/view`,
    onground: `/onground/roster/${school?.school_id}`,
    'health-buddy': `/health-buddy/roster/${school?.school_id}`,
  };
  const href = baseUrlMap[root] || '/';

  // Initialize expanded sections state dynamically
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedClasses, setExpandedClasses] = useState({});
  const [selectedSection, setSelectedSection] = useState('');

  // Map API categories to display names
  const categoryDisplayNames = {
    higher_secondary: 'High School',
    secondary: 'Secondary School',
    upper_primary: 'Middle School',
    primary: 'Primary School',
    pre_primary: 'Pre-Primary School',
  };

  const toggleSection = section => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const toggleClass = classGroup => {
    setExpandedClasses({
      ...expandedClasses,
      [classGroup]: !expandedClasses[classGroup],
    });
  };

  const selectSection = section => {
    setSelectedSection(section);
  };

  // Helper function to render sections for a class
  const renderSections = (sections, classNumber) => {
    if (!sections || sections.length === 0) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {sections.map((sectionData, index) => {
          const sectionLetter = sectionData.section;
          const studentCount = sectionData.studnets_count || sectionData.students?.length || 0;

          return (
            <Link key={`${classNumber}-${sectionLetter}`} href={`${href}/class/${encodeURI(classNumber)}-${sectionLetter}`}>
              <div
                className={`p-4 rounded-lg cursor-pointer flex flex-col items-center gap-4 border ${
                  selectedSection === `${classNumber}${sectionLetter}` ? 'border-blue-400 ring-2 ring-blue-400' : 'border-[#DCDCDC]'
                }`}
                onClick={() => selectSection(`${classNumber}${sectionLetter}`)}
              >
                <span className="w-full text-center font-medium text-xl bg-[#F3F7FA] p-5 border border-[#F3F7FA] rounded-[10px]">{sectionLetter}</span>
                <div className="flex text-center">
                  <div className="flex-col p-2">
                    <span className="text-md font-bold block p-1">{classNumber}</span>
                    <span className="text-sm text-gray-600 block p-1">Class</span>
                  </div>
                  <div className="flex-col p-2">
                    <span className="text-md font-bold block p-1">{studentCount}</span>
                    <span className="text-sm text-gray-600 block p-1">Students</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  // Helper function to render classes for a category
  const renderClasses = classes => {
    if (!classes || classes.length === 0) return null;

    return classes.map((classData, index) => {
      const classNumber = classData.class.replace('th Class', '').replace('st Class', '').replace('nd Class', '').replace('rd Class', '');
      const className = `Class ${classNumber}`;

      return (
        <div key={`${className}-${index}`}>
          <div
            className="flex justify-between items-center px-6 py-2.5 border-2 border-[#B5CCFF] rounded-lg cursor-pointer"
            onClick={() => toggleClass(className)}
          >
            <span className="text-sm font-medium">{className}</span>
            {expandedClasses[className] ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#464646" className="size-5">
                <path
                  fillRule="evenodd"
                  d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#464646" className="size-5">
                <path
                  fillRule="evenodd"
                  d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          {expandedClasses[className] && (
            <div className="mx-[15px] px-8 py-9 border border-[#DCDCDC] border-t-0 rounded-b-lg">{renderSections(classData.sections, classNumber)}</div>
          )}
        </div>
      );
    });
  };

  // Helper function to render category section
  const renderCategorySection = (categoryKey, displayName) => {
    const schoolData = studentsByCategory;
    if (!schoolData || !schoolData[categoryKey] || schoolData[categoryKey].length === 0) {
      return null;
    }

    return (
      <div className="mb-4" key={categoryKey}>
        <div className="flex justify-between items-center px-6 py-2.5 bg-[#ECF2FF] cursor-pointer rounded-lg" onClick={() => toggleSection(displayName)}>
          <h2 className="font-medium text-sm">{displayName}</h2>
          {expandedSections[displayName] ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#464646" className="size-5">
              <path
                fillRule="evenodd"
                d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#464646" className="size-5">
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {expandedSections[displayName] && <div className="mt-4 space-y-4 mx-4">{renderClasses(schoolData[categoryKey])}</div>}
      </div>
    );
  };

  // Check if studentData exists and has content
  // const hasStudentData = studentsByCategory && Object.keys(categoryDisplayNames).some(categoryKey => studentsByCategory[categoryKey] && studentsByCategory[categoryKey].length > 0);

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full mx-auto py-8">
        <InlineSpinner />
      </div>
    );
  }

  // Show no data message (in red) only if not loading and no data
  // if (!isLoading && !hasStudentData) {
  //   return (
  //     <div className="w-full mx-auto">
  //       <div className="text-center py-8 text-red-500">No student data available</div>
  //     </div>
  //   );
  // }

  return (
    <div className="w-full mx-auto">
      {/* Render all categories dynamically */}
      {Object.entries(categoryDisplayNames).map(([categoryKey, displayName]) => renderCategorySection(categoryKey, displayName))}
    </div>
  );
};

export default SectionalView;
