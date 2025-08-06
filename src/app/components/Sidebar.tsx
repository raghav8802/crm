'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Sidebar() {
  const pathname = usePathname();
  const [callbackLaterCount, setCallbackLaterCount] = useState(0);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    // Only fetch data if we are not on the login page
    if (pathname !== '/login') {
      const fetchUserData = async () => {
        try {
          const response = await fetch('/api/auth/check');
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.user.role);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };

      const fetchCallbackLaterCount = async () => {
        try {
          const response = await fetch('/api/leads/count?status=Callback Later');
          if (response.ok) {
            const data = await response.json();
            setCallbackLaterCount(data.count);
          }
        } catch (error) {
          console.error('Error fetching callback later count:', error);
        }
      };

      fetchUserData();
      fetchCallbackLaterCount();
    }
  }, [pathname]);

  // Hide sidebar on login page
  if (pathname === '/login') {
    return null;
  }

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="w-60 bg-gray-800 text-white min-h-screen">
      <div className=" flex justify-left ms-7 items-center">
        <Image
          src="/logo.png"
          alt="Go Pro Logo"
          width={130}
          height={50}
          priority
        />
      </div>
      <nav className="mt-3">
        <div className="px-4">
          <div className="space-y-2">
            {(userRole === 'admin' || userRole === 'sales_manager') && (
              <Link
                href="/"
                className={`flex items-center px-4 py-3 text-base font-medium rounded-md ${
                  isActive('/')
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <svg
                  className="h-6 w-6 mr-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Dashboard
              </Link>
            )}

            {(userRole === 'admin' || userRole === 'sales_manager' || userRole === 'payment_coordinator') && (
              <Link
                href="/leads"
                className={`flex items-center justify-between px-4 py-3 text-base font-medium rounded-md ${
                  isActive('/leads')
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <svg
                    className="h-6 w-6 mr-3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Leads
                </div>
                {callbackLaterCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {callbackLaterCount}
                  </span>
                )}
              </Link>
            )}

            {userRole === 'admin' && (
              <Link
                href="/users"
                className={`flex items-center px-4 py-3 text-base font-medium rounded-md ${
                  isActive('/users')
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <svg
                  className="h-6 w-6 mr-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Users
              </Link>
            )}

            <Link
              href="/verification"
              className={`flex items-center px-4 py-3 text-base font-medium rounded-md ${
                isActive('/verification')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <svg
                className="h-6 w-6 mr-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Verification
            </Link>

            <Link
              href="/renewal"
              className={`flex items-center px-4 py-3 text-base font-medium rounded-md ${
                isActive('/renewal')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <svg
                className="h-6 w-6 mr-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Renewal
            </Link>
          </div>
        </div>
      </nav>
      <div className="mt-auto p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
        >
          <svg
            className="h-6 w-6 mr-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
} 