"use client";
import React, { useState } from 'react';
import { Property, PropertyStatus } from '@/types/property';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyAdded: (newProp: Property) => void;
}

export default function AddPropertyModal({
  isOpen,
  onClose,
  onPropertyAdded,
}: AddPropertyModalProps) {
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('3 BHK Apartment');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [areaSqft, setAreaSqft] = useState('');
  const [status, setStatus] = useState<PropertyStatus>('Available');
  const [floorNumber, setFloorNumber] = useState('');
  const [possessionStatus, setPossessionStatus] = useState('Ready to Move');
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !price.trim()) {
      setError('Please fill in Property Title, Location, and Price.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const amenities = amenitiesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          propertyType,
          location,
          price,
          areaSqft: areaSqft ? Number(areaSqft) : undefined,
          status,
          floorNumber,
          possessionStatus,
          amenities,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add property');
      }

      onPropertyAdded(data.property);
      onClose();
      // Reset form
      setTitle('');
      setLocation('');
      setPrice('');
      setAreaSqft('');
      setDescription('');
      setAmenitiesInput('');
      setFloorNumber('');
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error adding property');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🏢</span> Add Apartment / Flat to Inventory
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Add a property currently held in stock. Leads matching this unit will be prioritized as HOT.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Property / Apartment Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Prestige Boulevard - Tower C Unit 804"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Property Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Configuration / Type <span className="text-red-500">*</span>
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="1 BHK Apartment">1 BHK Apartment</option>
                <option value="2 BHK Apartment">2 BHK Apartment</option>
                <option value="2.5 BHK Apartment">2.5 BHK Apartment</option>
                <option value="3 BHK Apartment">3 BHK Apartment</option>
                <option value="4 BHK Penthouse">4 BHK Penthouse</option>
                <option value="5 BHK Luxury Villa">5 BHK Luxury Villa</option>
                <option value="Commercial Office Space">Commercial Office Space</option>
                <option value="Retail Showroom Unit">Retail Showroom Unit</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asking Price <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ₹1.6 Cr or ₹95 Lakhs"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location / Neighborhood <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Whitefield, Bangalore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Area Sqft */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Carpet Area (Sq Ft)
              </label>
              <input
                type="number"
                placeholder="e.g. 1750"
                value={areaSqft}
                onChange={(e) => setAreaSqft(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Under Offer">Under Offer</option>
                <option value="Sold">Sold</option>
              </select>
            </div>

            {/* Floor Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Floor</label>
              <input
                type="text"
                placeholder="e.g. 8th Floor"
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Possession */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Possession</label>
              <select
                value={possessionStatus}
                onChange={(e) => setPossessionStatus(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Ready to Move">Ready to Move</option>
                <option value="Under Construction">Under Construction</option>
                <option value="Immediate Possession">Immediate</option>
              </select>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Key Amenities & Features (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. East Facing, 100% Vastu, Gated Community, Club House, 2 Car Parking"
              value={amenitiesInput}
              onChange={(e) => setAmenitiesInput(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Property Description / Sales Notes
            </label>
            <textarea
              rows={2}
              placeholder="Key selling points, high rental yield, proximity to tech parks or metro..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50 shadow-sm flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving to Inventory...</span>
                </>
              ) : (
                <span>+ Save Property Unit</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
