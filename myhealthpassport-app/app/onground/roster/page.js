'use client';

import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const RosterHome = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('roster/1');
  }, []);

  return <div></div>;
};

export default RosterHome;
