'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

const options = [
  {
    id: 'team',
    title: 'Term Insurance',
    description: 'Comprehensive insurance coverage for your team members',
    icon: '👥',
  },
  {
    id: 'life',
    title: 'Life Insurance',
    description: 'Secure your family\'s future with our life insurance plans',
    icon: '💖',
  },
  {
    id: 'health',
    title: 'Health Insurance',
    description: 'Protect your health with our comprehensive health insurance plans',
    icon: '🏥',
  },
  {
    id: 'car',
    title: 'Car Insurance',
    description: 'Secure your vehicle with our reliable car insurance solutions',
    icon: '🚗',
  },
];

export default function SelectInsuranceType() {
  const { id } = useParams();
  const router = useRouter();

  const handleSelect = (type: string) => {
    if (type === 'team') {
      router.push(`/leads/${id}/select/termInsurance`);
    } else if (type === 'car') {
      router.push(`/leads/${id}/select/carinsurance`);
    } else if (type === 'health') {
      router.push(`/leads/${id}/select/Healthinsurance`);
    } else if (type === 'life') {
      router.push(`/leads/${id}/select/lifeinsurance`);
    } else {
      // For now, just show an alert for health and life options
      alert(`${type} insurance form will be available soon!`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Select Insurance Type</h1>
          <Link
            href={`/leads/${id}`}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Lead Details
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {options.map((option) => (
            <motion.div
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 cursor-pointer hover:shadow-xl hover:bg-blue-100 transition-shadow"
              onClick={() => handleSelect(option.id)}
            >
              <div className="text-6xl mb-4">{option.icon}</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {option.title}
              </h2>
              <p className="text-gray-600">{option.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 