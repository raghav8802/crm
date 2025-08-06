'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Calendar, User, Phone, Mail, Building, FileText, Eye } from 'lucide-react';

interface RenewalPolicy {
  _id: string;
  leadId: string | { _id: string; toString(): string };
  insuranceType: 'term_insurance' | 'health_insurance' | 'life_insurance' | 'car_insurance';
  status: 'PLVC_done';
  createdAt: string;
  updatedAt: string;
  lead: {
    _id: string;
    name: string;
    phoneNumber: string;
    email?: string;
    status: string;
  };
  selectedCompany?: string;
  productName?: string;
  premium?: string;
  sumAssured?: string;
  pt?: string;
  ppt?: string;
  // Car insurance specific fields
  vehicleType?: string;
  registrationNumber?: string;
  vehicleBrand?: string;
  // Health insurance specific fields
  proposerName?: string;
  planName?: string;
  sumInsured?: string;
  // Life insurance specific fields
  name?: string;
  modeOfPayment?: string;
  // Policy Management (Payment Coordinator Fields) - for all insurance types
  policyIssueDate?: string;
  renewalType?: 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Yearly';
}

const RenewalPage = () => {
  const [policies, setPolicies] = useState<RenewalPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updatedAt');

  useEffect(() => {
    fetchRenewalPolicies();
  }, []);

  const fetchRenewalPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/renewal');
      if (!response.ok) {
        throw new Error('Failed to fetch renewal policies');
      }
      const data = await response.json();
      setPolicies(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };

  const getInsuranceTypeLabel = (type: string) => {
    switch (type) {
      case 'term_insurance':
        return 'Term Insurance';
      case 'health_insurance':
        return 'Health Insurance';
      case 'life_insurance':
        return 'Life Insurance';
      case 'car_insurance':
        return 'Car Insurance';
      default:
        return type;
    }
  };

  const getInsuranceTypeColor = (type: string) => {
    switch (type) {
      case 'term_insurance':
        return 'bg-blue-100 text-blue-800';
      case 'health_insurance':
        return 'bg-green-100 text-green-800';
      case 'life_insurance':
        return 'bg-purple-100 text-purple-800';
      case 'car_insurance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPolicyDetails = (policy: RenewalPolicy) => {
    switch (policy.insuranceType) {
      case 'car_insurance':
        return {
          title: `${policy.vehicleBrand} ${policy.vehicleType}`,
          subtitle: `Reg: ${policy.registrationNumber}`,
          details: [
            { label: 'Company', value: policy.selectedCompany },
            { label: 'Cover', value: policy.vehicleType },
            { label: 'Brand', value: policy.vehicleBrand },
            { label: 'Policy Issue Date', value: policy.policyIssueDate ? new Date(policy.policyIssueDate).toLocaleDateString() : 'Not set' },
            { label: 'Renewal Type', value: policy.renewalType || 'Not set' }
          ]
        };
      case 'health_insurance':
        return {
          title: policy.proposerName || 'Health Insurance',
          subtitle: policy.planName || 'Health Plan',
          details: [
            { label: 'Company', value: policy.selectedCompany },
            { label: 'Plan', value: policy.planName },
            { label: 'Sum Insured', value: policy.sumInsured },
            { label: 'Policy Issue Date', value: policy.policyIssueDate ? new Date(policy.policyIssueDate).toLocaleDateString() : 'Not set' },
            { label: 'Renewal Type', value: policy.renewalType || 'Not set' }
          ]
        };
      case 'life_insurance':
        return {
          title: policy.name || 'Life Insurance',
          subtitle: policy.productName || 'Life Plan',
          details: [
            { label: 'Company', value: policy.selectedCompany },
            { label: 'Product', value: policy.productName },
            { label: 'Premium', value: policy.premium },
            { label: 'Policy Issue Date', value: policy.policyIssueDate ? new Date(policy.policyIssueDate).toLocaleDateString() : 'Not set' },
            { label: 'Renewal Type', value: policy.renewalType || 'Not set' }
          ]
        };
      case 'term_insurance':
        return {
          title: policy.name || 'Term Insurance',
          subtitle: policy.productName || 'Term Plan',
          details: [
            { label: 'Company', value: policy.selectedCompany },
            { label: 'Product', value: policy.productName },
            { label: 'Sum Assured', value: policy.sumAssured },
            { label: 'Policy Issue Date', value: policy.policyIssueDate ? new Date(policy.policyIssueDate).toLocaleDateString() : 'Not set' },
            { label: 'Renewal Type', value: policy.renewalType || 'Not set' }
          ]
        };
      default:
        return {
          title: 'Insurance Policy',
          subtitle: 'Policy Details',
          details: []
        };
    }
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = 
      policy.lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.lead.phoneNumber.includes(searchTerm) ||
      policy.selectedCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || policy.insuranceType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const sortedPolicies = [...filteredPolicies].sort((a, b) => {
    switch (sortBy) {
      case 'updatedAt':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'name':
        return a.lead.name.localeCompare(b.lead.name);
      case 'company':
        return (a.selectedCompany || '').localeCompare(b.selectedCompany || '');
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading renewal policies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchRenewalPolicies}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Renewal Policies</h1>
        <p className="text-gray-600">
          All policies that have completed PLVC verification and are ready for renewal
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Policies</p>
                <p className="text-2xl font-bold text-gray-900">{policies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Car Insurance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {policies.filter(p => p.insuranceType === 'car_insurance').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Health Insurance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {policies.filter(p => p.insuranceType === 'health_insurance').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Life Insurance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {policies.filter(p => p.insuranceType === 'life_insurance').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, phone, company, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="car_insurance">Car Insurance</SelectItem>
              <SelectItem value="health_insurance">Health Insurance</SelectItem>
              <SelectItem value="life_insurance">Life Insurance</SelectItem>
              <SelectItem value="term_insurance">Term Insurance</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Latest Updated</SelectItem>
              <SelectItem value="createdAt">Date Created</SelectItem>
              <SelectItem value="name">Customer Name</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {sortedPolicies.length} of {policies.length} policies
        </p>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPolicies.map((policy) => {
          const details = getPolicyDetails(policy);
          return (
            <Card key={policy._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{details.title}</CardTitle>
                    <p className="text-sm text-gray-600 mb-2">{details.subtitle}</p>
                    <Badge className={getInsuranceTypeColor(policy.insuranceType)}>
                      {getInsuranceTypeLabel(policy.insuranceType)}
                    </Badge>
                  </div>
                  <Link 
                    href={`/leads/${typeof policy.leadId === 'string' ? policy.leadId : policy.leadId._id}`}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Customer Info */}
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="font-medium">{policy.lead.name}</span>
                  </div>
                  <div className="flex items-center mb-1">
                    <Phone className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">{policy.lead.phoneNumber}</span>
                  </div>
                  {policy.lead.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm">{policy.lead.email}</span>
                    </div>
                  )}
                </div>

                {/* Policy Details */}
                <div className="space-y-2">
                  {details.details.map((detail, index) => (
                    detail.value && (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{detail.label}:</span>
                        <span className="font-medium">{detail.value}</span>
                      </div>
                    )
                  ))}
                </div>

                {/* Dates */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Updated: {new Date(policy.updatedAt).toLocaleDateString()}</span>
                    <span>Created: {new Date(policy.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedPolicies.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No renewal policies found</h3>
          <p className="text-gray-600">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'No policies have been marked as PLVC done yet.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default RenewalPage;
