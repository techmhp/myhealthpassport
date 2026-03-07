'use client';

import { useState, useEffect, use } from 'react';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import ClassesListView from '@/components/ClassesListView';
import FilterSection from '@/components/FilterSection';
import StaffMembers from '@/components/StaffMembers';
import Labs from '@/components/Labs';
import YearSelect from '@/components/YearSelect';
import { getExpertsList, schoolList } from '@/services/secureApis';
import Spinner from '@/components/UI/Spinner';
import { formatFullName, toastMessage } from '@/helpers/utilities';
import ExpertCard from '@/components/ExpertCard';

const Payments = () => {
  const [openAccordion, setOpenAccordion] = useState(0);
  const [activeTab, setActiveTab] = useState('Schools');
  const [schools, setSchools] = useState([]);
  const [allExperts, setAllExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { name: 'Schools', href: '#', id: 'Schools' },
    { name: 'Experts', href: '#', id: 'Experts' },
    { name: 'Labs', href: '#', id: 'Labs' },
  ];

  // Define the accordion items with associated components
  const accordionItems = [
    { name: 'Pediatrician', href: '#', id: 'Pediatrician' },
    { name: 'Dentist', href: '#', id: 'Dentist' },
    { name: 'Ophthalmologist', href: '#', id: 'Ophthalmologist' },
    { name: 'Nutritionist', href: '#', id: 'Nutritionist' },
    { name: 'Psychiatrist', href: '#', id: 'Psychiatrist' },
  ];

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const toggleAccordion = index => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  const fetchData = async () => {
    try {
      const response = await getExpertsList();
      const result = await JSON.parse(response);
      if (result.status === true) {
        // Group by user_role
        const groupByUserRoleExperts = result.data.experts.reduce((userRoleGroup, expert) => {
          if (!userRoleGroup[expert.user_role]) {
            userRoleGroup[expert.user_role] = [];
          }
          userRoleGroup[expert.user_role].push(expert);
          return userRoleGroup;
        }, {});
        setAllExperts(groupByUserRoleExperts);
      } else if (result.status === false) {
        toastMessage(result.message, 'error');
      }
    } catch (err) {
      // console.error('Error fetching data:', err);
      toastMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    schoolList()
      .then(res => {
        const response = JSON.parse(res);

        if (response.status === true) {
          setSchools(response.data.schools_list);
        } else if (response.status === false) {
          setError(response.message || 'Failed to fetch schools');
        }
      })
      .catch(err => {})
      .finally(() => {
        setLoading(false);
      });
    fetchData();
  }, []);

  // Handle search input change
  const handleSearchChange = value => {
    setSearchQuery(value);
  };

  const filteredSchools = schools?.items?.filter(school => {
    const lowerCaseSearchTerm = searchQuery.toLowerCase();
    return school.school_full_name.toLowerCase().includes(lowerCaseSearchTerm);
  });

  const filteredExperts = experts => {
    const filteredResults = experts.filter(expert => {
      const lowerCaseSearchTerm = searchQuery.toLowerCase();
      return (
        formatFullName(expert).toLowerCase().includes(lowerCaseSearchTerm) ||
        expert.location.toLowerCase().includes(lowerCaseSearchTerm) ||
        expert.education.toLowerCase().includes(lowerCaseSearchTerm)
      );
    });
    return filteredResults;
  };

  const renderExpertTabContent = specialty => {
    const experts = allExperts[specialty.toUpperCase()] || [];
    const filteredData = filteredExperts(experts);
    return (
      <div className="flex flex-col gap-[27px] mt-5 sm:mt-5">
        <div className="flex flex-col gap-[27px]">
          {Object.keys(filteredData).length > 0 ? (
            <div className="grid grid-cols-3 gap-[35px]">
              {filteredData.map((expert, index) => (
                <ExpertCard key={index} expert={expert} />
              ))}
            </div>
          ) : (
            <div className="w-full mt-10 mb-10 sm:mt-10 sm:mb-10 text-center text-gray-500 text-sm font-medium">{specialty} experts data not available</div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <Spinner status={loading} />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Schools':
        return (
          <div className="bg-white rounded-lg">
            <div className="flex flex-col gap-5">
              {Object.keys(filteredSchools).length > 0 ? (
                filteredSchools.map((item, index) => (
                  <div key={index} className="w-full">
                    {/* Accordion Header */}
                    <div
                      className="w-full h-11 flex justify-between items-center rounded-lg px-6 py-2.5 bg-[#ECF2FF] cursor-pointer"
                      onClick={() => toggleAccordion(index)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-Inter font-medium text-sm leading-6 text-center">
                          {item.school_full_name ? item.school_full_name : item.school_name}
                        </span>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`w-5 h-5 transition-transform ${openAccordion === index ? 'transform rotate-180' : ''}`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    {/* Accordion Content */}
                    {openAccordion === index && (
                      <div className="mx-4 py-4">
                        <ClassesListView school={item} />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="w-full flex justify-center items-center h-[200px]">
                  <p className="text-gray-500">No schools found.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'Experts':
        return (
          <div className="bg-white rounded-lg">
            <div className="flex flex-col gap-5">
              {accordionItems.map((item, index) => (
                <div key={index} className="w-full">
                  {/* Accordion Header */}
                  <div
                    className="w-full h-11 flex justify-between items-center rounded-lg px-6 py-2.5 bg-[#ECF2FF] cursor-pointer"
                    onClick={() => toggleAccordion(index)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-Inter font-medium text-sm leading-6 text-center">{item.name}</span>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`w-5 h-5 transition-transform ${openAccordion === index ? 'transform rotate-180' : ''}`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>

                  {/* Accordion Content */}
                  {openAccordion === index && <div className="mx-4">{renderExpertTabContent(item.name)}</div>}
                </div>
              ))}
            </div>
          </div>
        );
      case 'Labs':
        return (
          <div className="bg-white rounded-lg">
            <Labs />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className="p-4 sm:p-6 md:p-[28px] md:px-12 lg:px-18">
        <div className="px-2 sm:px-6 md:px-10 lg:px-14 grid gap-4 md:gap-8 lg:gap-13">
          <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <Breadcrumbs
              items={[
                {
                  name: 'Schools',
                  href: '#',
                  current: true,
                },
              ]}
              homeLabel="Accounts"
              homeHref="/admin/accounts"
            />
            {/* <YearSelect /> */}
          </div>
          <div className="flex items-center justify-center">
            <div className="flex space-x-1 overflow-x-auto gap-2.5 rounded-lg border border-[#ECF2FF] p-1.5">
              {tabs.map(tab => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  className={classNames(
                    activeTab === tab.id ? 'text-[#000000] bg-[#ECF2FF]' : 'text-gray-500 hover:text-gray-700',
                    'rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out cursor-pointer'
                  )}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
          <FilterSection searchQuery={searchQuery} onSearchChange={handleSearchChange} />
          {renderTabContent()}
        </div>
      </div>
    </>
  );
};

export default Payments;
