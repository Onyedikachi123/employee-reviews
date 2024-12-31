import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 px-6 bg-lightGray text-grayMain text-sm flex justify-between">
      <div className="flex gap-4">
        <Link href="#" className="hover:text-primaryBlue">Privacy</Link>
        <Link href="#" className="hover:text-primaryBlue">Terms</Link>
      </div>
      <div className="flex gap-4">
        <Link href="#" className="hover:text-primaryBlue">How Search Works</Link>
        <Link href="#" className="hover:text-primaryBlue">Contact Us</Link>
      </div>
    </footer>
  );
};

export default Footer;