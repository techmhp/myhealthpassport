'use client';

import Image from 'next/image';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import ExpertCard from '@/components/ExpertCard';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getExpertsList } from '@/services/secureApis';
import { toastMessage, formatFullName } from '@/helpers/utilities';
import InlineSpinner from '@/components/UI/InlineSpinner';

const tabs = [
  { name: 'Pediatrician', href: '#', id: 'PEDIATRICIAN' },
  { name: 'Dentist', href: '#', id: 'DENTIST' },
  { name: 'Ophthalmologist', href: '#', id: 'EYE_SPECIALIST' },
  { name: 'Nutritionist', href: '#', id: 'NUTRITIONIST' },
  { name: 'Psychiatrist', href: '#', id: 'PSYCHOLOGIST' },
];

const Book = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('PEDIATRICIAN');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const fetchData = async () => {
    setLoading(true);
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
        setResults(groupByUserRoleExperts);
      } else if (result.status === false) {
        toastMessage(result.message, 'error');
      }
    } catch (err) {
      toastMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle search input change
  const handleSearchChange = value => {
    setSearchQuery(value);
  };

  // Get experts for active tab
  const experts = results[activeTab] || [];

  // Filter experts by search query
  const filteredExperts = experts.filter(expert => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();

    const name = formatFullName(expert).toLowerCase();
    const location = (expert.location || '').toLowerCase();
    const education = (expert.education || '').toLowerCase();

    return name.includes(q) || location.includes(q) || education.includes(q);
  });

  if (loading) {
    return (
      <div className="w-full justify-center items-center h-screen flex">
        <InlineSpinner />
      </div>
    );
  }

  return (
    <main>
      <Header />
      <div className="p-3 sm:p-4 md:p-[28px] md:px-8 lg:px-12 xl:px-18">
        <div className="mt-3 sm:mt-4 mb-4 sm:mb-6">
          <Breadcrumbs items={[{ name: 'Expert Consultation', href: '#', current: true }]} homeLabel="Book" homeHref="/parent/book-consultation" />
        </div>
        <div className="w-full flex flex-col lg:flex-row justify-between mb-4 sm:mb-5 md:mb-[27px] gap-4 sm:gap-0">
          <div className="flex items-center w-full sm:w-auto overflow-x-auto">
            <nav aria-label="Tabs" className="mb-4 sm:mb-[18px] space-x-2 sm:space-x-4 overflow-x-auto border border-[#ECF2FF] p-1 rounded-lg w-full sm:w-auto">
              {tabs.map(tab => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  className={classNames(
                    activeTab === tab.id ? 'text-[#000000] bg-[#ECF2FF]' : 'text-gray-500 hover:text-gray-700',
                    'rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap cursor-pointer'
                  )}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex gap-3 sm:gap-4 justify-between sm:justify-normal items-center w-full sm:w-auto">
            <Image src="/iconx/filter.svg" width={24} height={24} alt="filter" className="size-5" />
            <div className="flex flex-1 sm:flex-none">
              <div className="-mr-px grid grow grid-cols-1 focus-within:relative">
                <input
                  id="query"
                  name="query"
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="col-start-1 row-start-1 block w-full rounded-md bg-white py-1.5 pr-3 pl-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:pl-9 sm:text-sm/6"
                />
                <Image
                  src="/iconx/search.svg"
                  width={16}
                  height={16}
                  alt="search"
                  className="size-5 pointer-events-none col-start-1 row-start-1 ml-3 self-center text-gray-400 sm:size-4"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Render experts - no switch needed */}
        <div className="flex flex-col gap-4 sm:gap-5 md:gap-[27px]">
          <h1 className="font-inter font-medium text-sm md:text-[14px] leading-[100%] tracking-[0]">All Experts</h1>
          {filteredExperts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-[35px]">
              {filteredExperts.map((expert, index) => (
                <ExpertCard key={index} expert={expert} />
              ))}
            </div>
          ) : (
            <div className="w-full mt-10 sm:mt-10 text-center text-gray-500 text-sm font-medium">
              {searchQuery.trim() ? `No experts found matching "${searchQuery.trim()}"` : 'No data found'}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Book;
