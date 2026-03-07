'use client';

import { useEffect, useState } from 'react';
import StaffCardView from './StaffCardView';
import { useParams } from 'next/navigation';
import { usersList } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import Loading from './Loading';
import InlineSpinner from './UI/InlineSpinner';

const StaffMembers = ({ team_type, role }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const { schoolid } = useParams();

  const GetUsersList = async () => {
    try {
      if (!team_type) {
        return null;
      }

      let filterObj = {
        team_type: team_type,
        role: role,
        is_active: 'true',
        search: '',
        school_id: schoolid || '',
      };
      const response = await usersList(filterObj);
      const result = await JSON.parse(response);

      if (result.status === true) {
        setResults(result);
      }
    } catch (err) {
      toastMessage(err, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    GetUsersList();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-8">
        <InlineSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-4">
      {results.status === true ? (
        <div className="pt-6 grid grid-cols-3 gap-[30px]">
          {results.data.users.map((user, index) => (
            <StaffCardView key={index} user={user} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-gray-500">{results.message}</div>
        </div>
      )}
    </div>
  );
};

export default StaffMembers;
