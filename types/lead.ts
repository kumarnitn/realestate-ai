export interface Lead {
  id: string;
  name: string;
  location: string;
  propertyRequirement: string;
  budget: string;
  buyingTimeline: string;
  customerMessage: string;
  createdAt?: string;
  updatedAt?: string;
  leadSummary?: string;
  customerIntent?: string;
  keyRequirements?: string[];
  objections?: string[];
  recommendedNextAction?: string;
  suggestedResponse?: string;
  score?: number;
  priority?: "HOT" | "WARM" | "COLD";
  analysisStatus?: "pending" | "completed" | "failed";
  analyzedAt?: string;
  matchedProperty?: {
    id: string;
    title: string;
    propertyType: string;
    location: string;
    price: string;
    status: string;
    matchScore: number;
    matchReason: string;
    isPerfectMatch: boolean;
  };
  matchedProperties?: Array<{
    id: string;
    title: string;
    propertyType: string;
    location: string;
    price: string;
    status: string;
    matchScore: number;
    matchReason: string;
    isPerfectMatch: boolean;
  }>;
}
