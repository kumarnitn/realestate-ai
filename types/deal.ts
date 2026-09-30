export type DealType = 'LEAD_AND_PROPERTY' | 'LEAD_ONLY' | 'PROPERTY_ONLY';

export interface FinalizedDeal {
  id: string;
  dealType: DealType;
  finalizedAt: string; // ISO date string
  clientName: string;
  propertyTitle?: string;
  agreedPrice: string; // e.g. "₹4.4 Cr"
  tokenAdvance?: string; // e.g. "₹10 Lakhs"
  closingDate?: string; // e.g. "2026-10-15"
  agentNotes?: string;
  leadId?: string;
  propertyId?: string;
  leadDetails?: {
    id: string;
    name: string;
    location: string;
    budget: string;
    propertyRequirement: string;
    buyingTimeline: string;
    priority?: string;
    score?: number;
    customerMessage?: string;
  };
  propertyDetails?: {
    id: string;
    title: string;
    location: string;
    price: string;
    propertyType: string;
    areaSqft?: number;
    floorNumber?: string;
  };
}
