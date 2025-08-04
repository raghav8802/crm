'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LeadType } from '@/models/Lead';
import { UserType } from '@/models/User';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface StatusStat {
  _id: string;
  count: number;
}

interface AssignedStat {
  _id: string | null;
  count: number;
}

interface StatsData {
  statusStats: StatusStat[];
  assignedStats: AssignedStat[];
}

export default function Home() {
  const router = useRouter();
  const [totalLeads, setTotalLeads] = useState(0);
  const [activeLeads, setActiveLeads] = useState(0);
  const [interestedLeads, setInterestedLeads] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [recentLeads, setRecentLeads] = useState<LeadType[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [chartData, setChartData] = useState({
    labels: ['Fresh', 'Interested', 'Callback Later', 'Wrong Number', 'Won', 'Lost'],
    datasets: [{
      label: 'Leads by Status',
      data: [0, 0, 0, 0, 0, 0],
      backgroundColor: [
        'rgba(59, 130, 246, 0.5)',  // Fresh - Blue
        'rgba(34, 197, 94, 0.5)',   // Interested - Green
        'rgba(234, 179, 8, 0.5)',   // Callback Later - Yellow
        'rgba(239, 68, 68, 0.5)',   // Wrong Number - Red
        'rgba(168, 85, 247, 0.5)',  // Won - Purple
        'rgba(156, 163, 175, 0.5)'  // Lost - Gray
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(34, 197, 94)',
        'rgb(234, 179, 8)',
        'rgb(239, 68, 68)',
        'rgb(168, 85, 247)',
        'rgb(156, 163, 175)'
      ],
      borderWidth: 1,
    }]
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch user data first
        const userRes = await fetch('/api/auth/check', {
          credentials: 'include',
        });
        if (!userRes.ok) {
          throw new Error('Failed to fetch user data');
        }
        const userData = await userRes.json();
        console.log('Full User Data Response:', userData);
        
        if (!userData.authenticated || !userData.user || !userData.user._id) {
          console.error('User data structure:', userData);
          throw new Error('User data not found in response');
        }

        const currentUserId = userData.user._id;
        const isAdmin = userData.user.role === 'admin';
        console.log('Current User ID:', currentUserId, 'Is Admin:', isAdmin);
        setUserName(userData.user.name || 'User');
        setIsAdmin(isAdmin);

        // Fetch all data in parallel
        const [statsRes, totalRes, recentRes, usersRes] = await Promise.all([
          fetch('/api/leads/stats'),
          fetch('/api/leads'),
          fetch('/api/leads/recent'),
          fetch('/api/users')
        ]);

        if (!statsRes.ok || !totalRes.ok || !recentRes.ok || !usersRes.ok) {
          throw new Error('Failed to fetch some data');
        }

        const [statsData, totalData, recentData, usersData] = await Promise.all([
          statsRes.json(),
          totalRes.json(),
          recentRes.json(),
          usersRes.json()
        ]);

        
        console.log('Recent Leads:', recentData);
        console.log('Current User ID:', currentUserId);
        console.log('Is Admin:', isAdmin);

        setStats(statsData);
        setUsers(usersData);

        // For admin users, show all leads. For regular users, show only assigned leads
        const userLeads = isAdmin ? totalData : totalData.filter((lead: LeadType) => {
          const leadAssignedTo = String(lead.assignedTo);
          const userId = String(currentUserId);
          const isAssigned = leadAssignedTo === userId;
          return isAssigned;
        });
        console.log('Filtered User Leads:', userLeads);
        setTotalLeads(userLeads.length);

        // Calculate active leads and conversion rate from user's leads
        const activeCount = userLeads.filter((lead: LeadType) => 
          ['Fresh', 'Callback Later', 'Interested','Follow Up','Ringing'].includes(lead.status)
        ).length;
        setActiveLeads(activeCount);

        // Calculate interested leads count for the monthly target calculation
        const interestedCount = userLeads.filter((lead: LeadType) => lead.status === 'Interested').length;
        setInterestedLeads(interestedCount);

        // Calculate conversion rate for user's leads
        const rate = userLeads.length > 0 ? Math.round((interestedCount / userLeads.length) * 100) : 0;
        setConversionRate(rate);

        // For admin users, show all recent leads. For regular users, show only assigned recent leads
        const userRecentLeads = recentData;
        console.log('Recent Leads:', userRecentLeads);
        setRecentLeads(userRecentLeads);

        // Update chart data
        setChartData(prev => ({
          ...prev,
          datasets: [{
            ...prev.datasets[0],
            label: isAdmin ? 'Leads by Status' : 'Your Leads by Status',
            data: [
              userLeads.filter((lead: LeadType) => lead.status === 'Fresh').length,
              userLeads.filter((lead: LeadType) => lead.status === 'Interested').length,
              userLeads.filter((lead: LeadType) => lead.status === 'Callback Later').length,
              userLeads.filter((lead: LeadType) => lead.status === 'Wrong Number').length,
              userLeads.filter((lead: LeadType) => lead.status === 'Won').length,
              userLeads.filter((lead: LeadType) => lead.status === 'Lost').length,
            ]
          }]
        }));

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load dashboard data. Please try logging in again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getUserName = (userId: string | undefined) => {
    if (!userId) return 'Unassigned';
    if (!Array.isArray(users)) return 'Loading...';
    const user = users.find(u => u._id?.toString() === userId.toString());
    return user ? user.name : 'Unassigned';
  };

  const pieChartData = {
    labels: stats?.assignedStats.map((stat) => {
      if (!stat._id) return 'Unassigned';
      if (!users?.length) return 'Loading...';
      const user = users.find(u => u._id?.toString() === (stat._id || '').toString());
      return user ? user.name : 'Unknown User';
    }),
    datasets: [
      {
        label: 'Leads',
        data: stats?.assignedStats.map((stat) => stat.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <div className="mt-4 space-y-2">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
            <button 
              onClick={() => window.location.href = '/login'} 
              className="block w-full mt-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Message */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Welcome, {userName}!
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Here&apos;s your dashboard overview</p>
          </div>
          <div className="text-right">
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-700 transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium">Profile</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push('/profile');
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile</span>
                    </div>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">
                {isAdmin ? 'Total Leads' : 'Your Assigned Leads'}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{totalLeads}</h3>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <span className="text-green-500 text-xs sm:text-sm font-semibold">
              {isAdmin ? 'All Leads' : 'Your Leads'}
            </span>
            <span className="text-gray-500 text-xs sm:text-sm ml-2">
              {isAdmin ? 'in the system' : 'assigned to you'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Active Leads</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{activeLeads}</h3>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-full">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <span className="text-green-500 text-xs sm:text-sm font-semibold">Active</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Conversion Rate</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{conversionRate}%</h3>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-full">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <span className="text-purple-500 text-xs sm:text-sm font-semibold">Interested</span>
            <span className="text-gray-500 text-xs sm:text-sm ml-2">out of total leads</span>
          </div>
        </div>

        {isAdmin ? (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Team Members</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{users.length}</h3>
            </div>
            <div className="bg-yellow-100 p-2 sm:p-3 rounded-full">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <span className="text-green-500 text-xs sm:text-sm font-semibold">Active</span>
            <span className="text-gray-500 text-xs sm:text-sm ml-2">team members</span>
          </div>
        </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Monthly Target</p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {Math.round((interestedLeads / 10) * 100)}%
                </h3>
              </div>
              <div className="bg-indigo-100 p-2 sm:p-3 rounded-full">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="mt-2 sm:mt-4">
              <span className="text-indigo-500 text-xs sm:text-sm font-semibold">Progress</span>
              <span className="text-gray-500 text-xs sm:text-sm ml-2">towards monthly goal</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full" 
                style={{ width: `${Math.min(Math.round((interestedLeads / 10) * 100), 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              {isAdmin ? 'Recent Leads (All Users)' : 'Your Recent Leads'}
            </h2>
            <Link 
              href="/leads"
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 text-sm sm:text-base"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentLeads.length > 0 ? (
                recentLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/leads/${lead._id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {lead.name}
                      </Link>
                    </td>
                    <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-gray-500">
                      {lead.phoneNumber}
                    </td>
                    <td className="px-2 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${lead.status === 'Fresh' ? 'bg-blue-100 text-blue-800' : 
                          lead.status === 'Interested' ? 'bg-green-100 text-green-800' :
                          lead.status === 'Callback Later' ? 'bg-yellow-100 text-yellow-800' :
                          lead.status === 'Wrong Number' ? 'bg-red-100 text-red-800' :
                          lead.status === 'Won' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-gray-500">
                      {getUserName(lead.assignedTo)}
                    </td>
                    <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(lead.createdAt || '').toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-2 sm:px-6 py-4 text-center text-gray-500">
                    {isAdmin ? 'No recent leads found' : 'No recent leads assigned to you'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Section */}
      <div className={`grid gap-4 sm:gap-6 ${isAdmin ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">
            {isAdmin ? 'Leads by Status' : 'Your Leads by Status'}
          </h2>
          <div className="h-64">
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const data = context.dataset.data as number[];
                        const total = data.reduce((sum, val) => sum + (val || 0), 0);
                        const percentage = Math.round((context.raw as number / total) * 100);
                        return `${context.raw} (${percentage}%)`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        const data = chartData.datasets[0].data;
                        const total = data.reduce((sum, val) => sum + (val || 0), 0);
                        const percentage = Math.round((Number(value) / total) * 100);
                        return `${value} (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">Leads by Assignee</h2>
            <div className="h-64">
              <Pie
                data={pieChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right'
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
