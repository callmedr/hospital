
import React from 'react';
import { HospitalIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 dark:bg-blue-700 text-white p-4 flex items-center space-x-3 shadow-md z-10">
      <HospitalIcon className="w-7 h-7" />
      <h1 className="text-xl font-bold tracking-wide">병원 예약 챗봇</h1>
    </header>
  );
};

export default Header;
