'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import ExpertCard from '@/components/ExpertCard';
import PlusButton from '@/components/UI/PlusButton';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getExpertsList } from '@/services/secureApis';
import { formatFullName, toastMessage } from '@/helpers/utilities';
import InlineSpinner from '@/components/UI/InlineSpinner';

const tabs = [
  { name: 'Pediatrician', href: '#', id: 'Pediatrician' },
  { name: 'Dentist', href: '#', id: 'Dentist' },
  { name: 'Ophthalmologist', href: '#', id: 'EYE_SPECIALIST' },
  { name: 'Nutritionist', href: '#', id: 'Nutritionist' },
  { name: 'Psychiatrist', href: '#', id: 'PSYCHOLOGIST' },
];

const Experts = () => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('Pediatrician');
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

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
        setResults(groupByUserRoleExperts);
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
    fetchData();
  }, []);

  // Handle search input change
  const handleSearchChange = value => {
    setSearchQuery(value);
  };

  const experts = results[activeTab.toUpperCase()] || [];
  const filteredExperts = experts.filter(expert => {
    const lowerCaseSearchTerm = searchQuery.toLowerCase();
    return (
      formatFullName(expert).toLowerCase().includes(lowerCaseSearchTerm) ||
      expert.location.toLowerCase().includes(lowerCaseSearchTerm) ||
      expert.education.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const renderTabContent = () => {
    return (
      <div className="flex flex-col gap-[27px] mt-5 sm:mt-5">
        <div className="flex flex-col gap-[27px]">
          {filteredExperts.length > 0 ? (
            <div className="grid grid-cols-3 gap-[35px]">
              {filteredExperts.map((expert, index) => (
                <ExpertCard key={index} expert={expert} />
              ))}
            </div>
          ) : (
            <div className="w-full mt-10 sm:mt-10 text-center text-gray-500 text-sm font-medium">{activeTab} experts data not available</div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <InlineSpinner />
      </div>
    );
  }

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Header />
      <div className="p-4 sm:p-6 md:p-[28px] md:px-12 lg:px-18">
        <div className="w-full p-4">
          <h2>Experts</h2>
        </div>
        <div className="w-full flex flex-row justify-between">
          <div className="flex items-center">
            <nav aria-label="Tabs" className="mb-[30px] sm:mb-[18px] space-x-4 overflow-x-auto border border-[#ECF2FF] p-1 rounded-lg">
              {tabs.map(tab => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  className={classNames(
                    activeTab === tab.id ? 'text-[#000000] bg-[#ECF2FF]' : 'text-gray-500 hover:text-gray-700',
                    'rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap'
                  )}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
            {/* {renderTabContent()} */}
          </div>
          <div className="flex gap-4 justify-normal items-center ">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#5389FF" className="size-6 cursor-pointer">
              <path d="M6 12a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 1 1 1.5 0v7.5A.75.75 0 0 1 6 12ZM18 12a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 1.5 0v7.5A.75.75 0 0 1 18 12ZM6.75 20.25v-1.5a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0ZM18.75 18.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 1.5 0ZM12.75 5.25v-1.5a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0ZM12 21a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 1.5 0v7.5A.75.75 0 0 1 12 21ZM3.75 15a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0ZM12 11.25a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5ZM15.75 15a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z" />
            </svg>
            <div className="flex">
              <div className="-mr-px grid grow grid-cols-1 focus-within:relative">
                <input
                  id="query"
                  name="query"
                  type="text"
                  placeholder="John Smith"
                  onChange={e => handleSearchChange(e.target.value)}
                  value={searchQuery}
                  className="col-start-1 row-start-1 block w-full rounded-md bg-white py-1.5 pr-3 pl-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:pl-9 sm:text-sm/6"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="#5389FF"
                  className="size-5 pointer-events-none col-start-1 row-start-1 ml-3 self-center text-gray-400 sm:size-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {renderTabContent()}
      </div>
      <Link href="/admin/experts/add">
        <PlusButton />
      </Link>
    </Suspense>
  );
};

export default Experts;
