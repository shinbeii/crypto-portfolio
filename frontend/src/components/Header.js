// export default Header;
import React, { useState } from "react";
import { FaTachometerAlt, FaWallet, FaHistory, FaChartLine, FaSignOutAlt, FaSignInAlt, FaBitcoin, FaBars } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

const Header = ({ isAuthenticated, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const tabs = [
    { name: "dashboard", label: "Dashboard", icon: FaTachometerAlt, path: "/dashboard" },
    { name: "portfolio", label: "Portfolio", icon: FaWallet, path: "/portfolio" },
    { name: "history", label: "History", icon: FaHistory, path: "/history" },
    { name: "market", label: "Market", icon: FaChartLine, path: "/market" },
  ];

  const handleAuthClick = () => {
    if (isAuthenticated) {
      onLogout();
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-bold text-gray-800 flex items-center space-x-2 animate-pulse">
            <FaBitcoin className="text-yellow-500 animate-spin-slow" />
            <span>Crypto Portfolio</span>
          </h1>

          {/* Hiển thị icon menu trên thiết bị di động */}
          <div className="flex lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <FaBars className="text-2xl text-gray-800" />
            </button>
          </div>

          {/* Navigation menu cho màn hình lớn */}
          <nav className="hidden lg:flex items-center space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => navigate(tab.path)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                  window.location.pathname === tab.path ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <tab.icon className="mr-2" /> {tab.label}
              </button>
            ))}
            <button
              onClick={handleAuthClick}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                isAuthenticated ? "text-gray-600 hover:bg-gray-100" : "text-blue-600 bg-blue-50"
              }`}
            >
              {isAuthenticated ? <FaSignOutAlt className="mr-2" /> : <FaSignInAlt className="mr-2" />}
              {isAuthenticated ? "Logout" : "Login"}
            </button>
          </nav>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <nav className="flex flex-col lg:hidden bg-gray-50 p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => {
                  navigate(tab.path);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                  window.location.pathname === tab.path ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <tab.icon className="mr-2" /> {tab.label}
              </button>
            ))}
            <button
              onClick={() => {
                handleAuthClick();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                isAuthenticated ? "text-gray-600 hover:bg-gray-100" : "text-blue-600 bg-blue-50"
              }`}
            >
              {isAuthenticated ? <FaSignOutAlt className="mr-2" /> : <FaSignInAlt className="mr-2" />}
              {isAuthenticated ? "Logout" : "Login"}
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
