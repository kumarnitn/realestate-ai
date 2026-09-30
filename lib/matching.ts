import { Lead } from '@/types/lead';
import { Property, PropertyMatch } from '@/types/property';
import { parsePriceToLakhs } from './pricing';

/**
 * Extracts BHK or key property category from text
 */
function extractPropertyCategory(text?: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const categories: string[] = [];

  // BHK checks
  if (lower.includes('1 bhk') || lower.includes('1bhk') || lower.includes('1 bedroom') || lower.includes('studio')) {
    categories.push('1 bhk');
  }
  if (lower.includes('2 bhk') || lower.includes('2bhk') || lower.includes('2 bedroom')) {
    categories.push('2 bhk');
  }
  if (lower.includes('2.5 bhk') || lower.includes('2.5bhk')) {
    categories.push('2.5 bhk');
    categories.push('2 bhk');
    categories.push('3 bhk');
  }
  if (lower.includes('3 bhk') || lower.includes('3bhk') || lower.includes('3 bedroom')) {
    categories.push('3 bhk');
  }
  if (lower.includes('4 bhk') || lower.includes('4bhk') || lower.includes('4 bedroom')) {
    categories.push('4 bhk');
  }
  if (lower.includes('5 bhk') || lower.includes('5bhk') || lower.includes('5 bedroom')) {
    categories.push('5 bhk');
  }

  // Types
  if (lower.includes('penthouse')) categories.push('penthouse');
  if (lower.includes('villa') || lower.includes('row house')) categories.push('villa');
  if (lower.includes('duplex')) categories.push('duplex');
  if (lower.includes('commercial') || lower.includes('office') || lower.includes('retail')) categories.push('commercial');
  if (lower.includes('apartment') || lower.includes('flat')) categories.push('apartment');

  return categories;
}

/**
 * Parses min/max budget in Lakhs from lead budget string
 */
function parseBudgetRange(budgetStr?: string): { min: number; max: number } {
  if (!budgetStr) return { min: 0, max: 999999 };
  const lower = budgetStr.toLowerCase().replace(/,/g, '');

  // Look for range like "95 lakhs - 1.1 cr" or "1.5 - 2 cr"
  const rangeMatch = lower.match(/([\d.]+)\s*(?:lakh|lacs|cr|crore)?\s*(?:-|to)\s*([\d.]+)\s*(cr|crore|lakh|lacs|lac)?/);
  if (rangeMatch) {
    let minVal = parseFloat(rangeMatch[1]);
    let maxVal = parseFloat(rangeMatch[2]);
    const unit = rangeMatch[3] || (lower.includes('cr') ? 'cr' : 'lakh');

    if (unit.startsWith('cr')) {
      if (minVal < 10) minVal = minVal * 100;
      if (maxVal < 10) maxVal = maxVal * 100;
    }
    return { min: minVal * 0.85, max: maxVal * 1.15 };
  }

  const singleVal = parsePriceToLakhs(budgetStr);
  if (singleVal > 0) {
    return { min: singleVal * 0.8, max: singleVal * 1.2 };
  }

  return { min: 0, max: 999999 };
}

/**
 * Checks if two location strings have meaningful geographic overlap
 */
function checkLocationOverlap(loc1?: string, loc2?: string): boolean {
  if (!loc1 || !loc2) return false;
  const l1 = loc1.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const l2 = loc2.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

  const stopWords = new Set(['bangalore', 'bengaluru', 'mumbai', 'pune', 'delhi', 'road', 'phase', 'near', 'in', 'and', 'the', 'or', 'at', 'city']);

  const tokens1 = l1.split(/\s+/).filter((t) => t.length > 2 && !stopWords.has(t));
  const tokens2 = l2.split(/\s+/).filter((t) => t.length > 2 && !stopWords.has(t));

  for (const t1 of tokens1) {
    if (l2.includes(t1)) return true;
  }
  for (const t2 of tokens2) {
    if (l1.includes(t2)) return true;
  }

  // If both mention the same major city or neighborhood
  if (loc1.toLowerCase().includes('bangalore') && loc2.toLowerCase().includes('bangalore')) {
    // Both in Bangalore, but check if neighborhood matches
    const subAreas = ['indiranagar', 'whitefield', 'bellandur', 'jayanagar', 'banashankari', 'electronic city', 'mg road', 'cbd', 'sarjapur', 'hebbal', 'koramangala', 'h辩'];
    for (const area of subAreas) {
      if (l1.includes(area) && l2.includes(area)) return true;
    }
  }

  return false;
}

/**
 * Match a lead against a list of inventory properties
 */
export function findMatchingProperties(lead: Lead, properties: Property[]): PropertyMatch[] {
  if (!properties || properties.length === 0) return [];

  const leadReqCategories = extractPropertyCategory(`${lead.propertyRequirement} ${lead.customerMessage}`);
  const leadBudget = parseBudgetRange(lead.budget);
  const matches: PropertyMatch[] = [];

  for (const prop of properties) {
    // Exclude sold units
    if (prop.status === 'Sold') continue;

    const propCategories = extractPropertyCategory(`${prop.propertyType} ${prop.title} ${prop.description || ''}`);
    const propPriceLakhs = prop.numericPrice || parsePriceToLakhs(prop.price);

    // 1. Property Type match
    let typeMatches = false;
    if (leadReqCategories.length > 0 && propCategories.length > 0) {
      typeMatches = leadReqCategories.some((cat) => propCategories.includes(cat));
    } else if (leadReqCategories.length === 0) {
      // If lead requirement is broad ("Apartment"), check generic
      typeMatches = true;
    }

    // 2. Location match
    const locationMatches = checkLocationOverlap(lead.location, prop.location);

    // 3. Budget match
    let budgetMatches = false;
    if (propPriceLakhs > 0) {
      budgetMatches = propPriceLakhs >= leadBudget.min && propPriceLakhs <= leadBudget.max;
    } else {
      budgetMatches = true;
    }

    // Calculate score
    let score = 0;
    const reasons: string[] = [];

    if (locationMatches) {
      score += 40;
      reasons.push(`Location aligned with ${prop.location}`);
    }
    if (typeMatches) {
      score += 35;
      reasons.push(`Configuration matches (${prop.propertyType})`);
    }
    if (budgetMatches) {
      score += 25;
      reasons.push(`Price fits budget range (${prop.price})`);
    }

    // Check location specificity
    const hasSpecifiedLocation = Boolean(
      lead.location && 
      lead.location.trim().length > 3 && 
      !lead.location.toLowerCase().includes('any') && 
      !lead.location.toLowerCase().includes('flexible') &&
      !lead.location.toLowerCase().includes('unspecified')
    );

    const isPerfect = locationMatches && typeMatches && budgetMatches;
    const isStrong = locationMatches && (typeMatches || (budgetMatches && score >= 65));
    const isQualifyingMatch = isPerfect || isStrong || (!hasSpecifiedLocation && typeMatches && budgetMatches);

    if (isQualifyingMatch && score >= 60) {
      matches.push({
        property: prop,
        matchScore: score,
        matchReason: isPerfect 
          ? `🎯 Perfect 100% Match: ${reasons.join(', ')}` 
          : `🔥 Inventory Match: ${reasons.join(', ')}`,
        isPerfectMatch: isPerfect,
        isStrongMatch: isStrong,
        matchedCriteria: {
          location: locationMatches,
          propertyType: typeMatches,
          budget: budgetMatches,
        },
      });
    }
  }

  // Sort best matches first
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Finds best single matching property for a lead
 */
export function getBestPropertyMatch(lead: Lead, properties: Property[]): PropertyMatch | null {
  const matches = findMatchingProperties(lead, properties);
  return matches.length > 0 ? matches[0] : null;
}
