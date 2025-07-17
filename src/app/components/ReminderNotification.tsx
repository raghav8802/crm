'use client';

import { useState, useEffect } from 'react';

interface ReminderType {
  _id: string;
  leadId: {
    name: string;
    phoneNumber: string;
    status: string;
  };
  scheduledTime: string;
  status: string;
}

interface PopulatedReminder extends ReminderType {
  _id: string;
  leadId: {
    name: string;
    phoneNumber: string;
    status: string;
  };
}

export default function ReminderNotification() {
  const [reminders, setReminders] = useState<PopulatedReminder[]>([]);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const response = await fetch('/api/reminders?status=pending');
        if (response.ok) {
          const data = await response.json() as PopulatedReminder[];
          const now = new Date();
          const pendingReminders = data.filter((reminder) => 
            new Date(reminder.scheduledTime) <= now
          );
          setReminders(pendingReminders);
          setShowNotification(pendingReminders.length > 0);
        }
      } catch (error) {
        console.error('Error fetching reminders:', error);
      }
    };

    fetchReminders();
    // Check for new reminders every minute
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = async (reminderId: string) => {
    try {
      const response = await fetch('/api/reminders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reminderId,
          status: 'dismissed',
        }),
      });

      if (response.ok) {
        setReminders(reminders.filter(r => r._id !== reminderId));
        if (reminders.length === 1) {
          setShowNotification(false);
        }
      }
    } catch (error) {
      console.error('Error dismissing reminder:', error);
    }
  };

  if (!showNotification) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {reminders.map((reminder) => (
        <div
          key={reminder._id}
          className="bg-white shadow-lg rounded-lg p-4 mb-4 w-96 border-l-4 border-blue-500"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-900">Callback Reminder</h3>
              <p className="text-sm text-gray-600 mt-1">
                Lead: {reminder.leadId.name}
              </p>
              <p className="text-sm text-gray-600">
                Phone: {reminder.leadId.phoneNumber}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Scheduled for: {new Date(reminder.scheduledTime).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => handleDismiss(reminder._id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 