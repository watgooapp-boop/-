
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white p-2 rounded-full shadow-inner">
          <img 
            src="https://img5.pic.in.th/file/secure-sv1/nw_logo-removebg.png" 
            alt="Logo" 
            className="h-20 w-20 object-contain"
          />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight">ระบบงานชุมนุม</h1>
          <p className="text-indigo-100 mt-1">โรงเรียนหนองบัวแดงวิทยา (Management Information System)</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
