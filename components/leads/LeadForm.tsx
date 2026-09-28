"use client";
import React, { useState } from 'react';
import Link from 'next/link';


// Reusable Lead intake form component
export default function LeadForm() {
  const initialState = {
    name: '',
    location: '',
    propertyRequirement: '',
    budget: '',
    buyingTimeline: '',
    customerMessage: '',
  } as const;

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Customer name is required.';
    if (!formData.location.trim()) newErrors.location = 'Location is required.';
    if (!formData.propertyRequirement.trim())
      newErrors.propertyRequirement = 'Property requirement is required.';
    if (!formData.budget.trim()) newErrors.budget = 'Budget is required.';
    if (!formData.buyingTimeline) newErrors.buyingTimeline = 'Please select a buying timeline.';
    if (!formData.customerMessage.trim())
      newErrors.customerMessage = 'Customer message is required.';
    return newErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      
      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to save lead');
        }
        
        setIsSuccess(true);
      } catch (error) {
        console.error('Error saving lead:', error);
        alert('Unable to save the lead. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const resetForm = () => {
    setFormData(initialState);
    setErrors({});
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Lead saved successfully</h2>
        <p className="mb-4 text-gray-700">
          {formData.name} has been added to your lead pipeline.
        </p>
        <div className="flex space-x-4">
          <Link href="/" className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">
            View Dashboard
          </Link>
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Add Another Lead
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Add New Lead</h1>
      <p className="text-gray-600">Enter the customer&apos;s details to analyze and prioritize this lead.</p>

      {/* Two‑column grid for desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="e.g. Rahul Sharma"
            className={`mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 ${errors.name ? 'border-red-500' : ''}`}
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>
        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            placeholder="e.g. Bangalore"
            className={`mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 ${errors.location ? 'border-red-500' : ''}`}
            value={formData.location}
            onChange={handleChange}
          />
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Property Requirement */}
        <div>
          <label htmlFor="propertyRequirement" className="block text-sm font-medium text-gray-700 mb-1">
            Property Requirement
          </label>
          <input
            type="text"
            id="propertyRequirement"
            name="propertyRequirement"
            placeholder="e.g. 3 BHK apartment in Whitefield"
            className={`mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 ${errors.propertyRequirement ? 'border-red-500' : ''}`}
            value={formData.propertyRequirement}
            onChange={handleChange}
          />
          {errors.propertyRequirement && (
            <p className="mt-1 text-sm text-red-600">{errors.propertyRequirement}</p>
          )}
        </div>
        {/* Budget */}
        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
            Budget
          </label>
          <input
            type="text"
            id="budget"
            name="budget"
            placeholder="e.g. ₹1.2 Cr"
            className={`mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 ${errors.budget ? 'border-red-500' : ''}`}
            value={formData.budget}
            onChange={handleChange}
          />
          {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
        </div>
      </div>

      {/* Buying Timeline */}
      <div>
        <label htmlFor="buyingTimeline" className="block text-sm font-medium text-gray-700 mb-1">
          Buying Timeline
        </label>
        <select
          id="buyingTimeline"
          name="buyingTimeline"
          className={`mt-1 block w-full rounded border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 ${errors.buyingTimeline ? 'border-red-500' : ''}`}
          value={formData.buyingTimeline}
          onChange={handleChange}
        >
          <option value="">Select buying timeline</option>
          <option value="Within 1 month">Within 1 month</option>
          <option value="1–3 months">1–3 months</option>
          <option value="3–6 months">3–6 months</option>
          <option value="6–12 months">6–12 months</option>
          <option value="More than 12 months">More than 12 months</option>
          <option value="Just exploring">Just exploring</option>
        </select>
        {errors.buyingTimeline && (
          <p className="mt-1 text-sm text-red-600">{errors.buyingTimeline}</p>
        )}
      </div>

      {/* Customer Message */}
      <div>
        <label htmlFor="customerMessage" className="block text-sm font-medium text-gray-700 mb-1">
          Customer Message
        </label>
        <p className="text-sm text-gray-500 mb-1">Paste the customer&apos;s original message or inquiry.</p>
        <textarea
          id="customerMessage"
          name="customerMessage"
          placeholder="e.g. Looking for a 3 BHK apartment in Whitefield.\nBudget is around ₹1.2 Cr. Prefer a gated community with good connectivity. Planning to buy within 2 months."
          className={`mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 h-36 ${errors.customerMessage ? 'border-red-500' : ''}`}
          value={formData.customerMessage}
          onChange={handleChange}
        />
        {errors.customerMessage && (
          <p className="mt-1 text-sm text-red-600">{errors.customerMessage}</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-3">
        <Link href="/" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Lead'}
        </button>
      </div>
    </form>
  );
}
