export type PropertyStatus = "Available" | "Reserved" | "Under Offer" | "Sold";

export interface Property {
  id: string;
  title: string;
  propertyType: string; // e.g. "3 BHK", "2 BHK", "4 BHK Penthouse", "Villa", "Commercial"
  location: string; // e.g. "Indiranagar, Bangalore"
  price: string; // e.g. "₹4.5 Cr", "₹95 Lakhs"
  numericPrice?: number; // Normalized price in Lakhs (e.g. 450 for 4.5 Cr, 95 for 95 Lakhs)
  areaSqft?: number; // e.g. 1850
  status: PropertyStatus;
  amenities: string[]; // ["East-facing", "Gated Community", "Swimming Pool"]
  description?: string;
  floorNumber?: string;
  possessionStatus?: string; // "Ready to Move", "Under Construction"
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyMatch {
  property: Property;
  matchScore: number; // 0 - 100
  matchReason: string;
  isPerfectMatch: boolean;
  isStrongMatch: boolean;
  matchedCriteria: {
    location: boolean;
    propertyType: boolean;
    budget: boolean;
  };
}
