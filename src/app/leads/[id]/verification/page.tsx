'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { VerificationDocumentType } from '@/models/VerificationDocument';

export default function VerificationPage() {
  const { id } = useParams();
  const [documents, setDocuments] = useState<VerificationDocumentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/leads/${id}/verification`);
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileUpload = async (documentType: string, file: File | null) => {
    try {
      setError('');

      const formData = new FormData();
      formData.append('documentType', documentType);
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch(`/api/leads/${id}/verification`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Failed to upload document');
    }
  };

  const renderDocumentUpload = (type: string, label: string) => {
    const url = documents?.[type as keyof VerificationDocumentType] as string;
    
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="flex items-center space-x-4">
          {url ? (
            <div className="flex items-center space-x-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                View Document
              </a>
              <button
                onClick={() => handleFileUpload(type, null)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(type, file);
                }
              }}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Verification Documents</h1>
          <Link
            href={`/leads/${id}`}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Lead Details
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          {renderDocumentUpload('panCard', 'PAN Card')}
          {renderDocumentUpload('aadharCard', 'Aadhaar Card')}
          {renderDocumentUpload('photo', 'Photo')}
          {renderDocumentUpload('cancelledCheque', 'Cancelled Cheque')}
          {renderDocumentUpload('bankStatement', 'Bank Statement')}
        </div>
      </div>
    </div>
  );
} 