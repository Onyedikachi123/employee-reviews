import React from 'react';
import Link from 'next/link';

const Navbar: React.FC = () => {
  return (
    <nav className="w-full py-4 px-6 flex justify-between items-center bg-white shadow-md">
      <Link href="/" className="text-primaryBlue text-xl font-bold">Logo</Link>
      <Link href="#" className="text-grayMain hover:text-primaryBlue">About</Link>
    </nav>
  );
};

export default Navbar;