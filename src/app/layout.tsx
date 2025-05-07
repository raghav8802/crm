import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from '@/app/components/Sidebar';
import { Suspense } from 'react';
import ReminderNotification from './components/ReminderNotification';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM Dashboard",
  description: "Customer Relationship Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <div className="flex">
          <Suspense fallback={<div>Loading...</div>}>
            <Sidebar />
          </Suspense>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
        <ReminderNotification />
      </body>
    </html>
  );
}
