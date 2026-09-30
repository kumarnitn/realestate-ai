import { Lead } from "@/types/lead";
import { Property, PropertyMatch } from "@/types/property";
import { LeadAnalysis } from "./ai/schemas";
import { getBestPropertyMatch, findMatchingProperties } from "./matching";

export interface LeadScoreResult {
  score: number;
  priority: "HOT" | "WARM" | "COLD";
  matchedProperty?: PropertyMatch | null;
  hasInventoryMatch?: boolean;
  matchReason?: string;
}

/**
 * Rule-based lead scoring and priority calculation with Inventory Matching Factor.
 * Evaluates:
 * 1. Timeline & Urgency (0 - 30 pts) + Negative Overrides
 * 2. Intent & Buying Readiness (0 - 25 pts) + Negative Overrides
 * 3. Budget Clarity & Realism (0 - 20 pts)
 * 4. Requirement Specificity (0 - 15 pts)
 * 5. Engagement & Actionability (0 - 10 pts)
 * 6. INVENTORY MATCH FACTOR (Flats/Apartments held in stock):
 *    - If an inventory property matches the lead's requirement, location, or budget,
 *      it makes the lead HOT (or significantly boosts priority & score)!
 */
export function calculateLeadScore(
  lead: Lead,
  analysis?: LeadAnalysis | null,
  inventoryOrMatch?: Property[] | PropertyMatch | Property | null
): LeadScoreResult {
  let score = 0;

  const timelineRaw = (lead.buyingTimeline || "").toLowerCase().trim();
  const messageRaw = (lead.customerMessage || "").toLowerCase().trim();
  const budgetRaw = (lead.budget || "").toLowerCase().trim();
  const reqRaw = (lead.propertyRequirement || "").toLowerCase().trim();
  const intentRaw = (analysis?.customerIntent || "").toLowerCase().trim();

  // Combine full text for contextual intent scanning
  const combinedContext = `${timelineRaw} ${messageRaw} ${intentRaw}`;

  // =========================================================================
  // 1. TIMELINE & NEGATIVE OVERRIDE CHECK (Max 30 points)
  // =========================================================================
  let timelineScore = 0;
  let isExplicitlyNotBuyingNow = false;

  // Check for negative timeline or deferred buying signals
  const negativeTimelinePatterns = [
    "not this year",
    "not buying this year",
    "not now",
    "not looking to buy now",
    "after a year",
    "after 1 year",
    "after 2 years",
    "sometime in future",
    "casually exploring",
    "just window shopping",
    "no plan to buy soon",
    "late 2027",
    "2028",
    "2029",
    "far off",
  ];

  for (const pattern of negativeTimelinePatterns) {
    if (combinedContext.includes(pattern)) {
      isExplicitlyNotBuyingNow = true;
      break;
    }
  }

  if (isExplicitlyNotBuyingNow) {
    timelineScore = 0;
  } else if (
    timelineRaw.includes("within 1 month") ||
    timelineRaw.includes("immediate") ||
    timelineRaw.includes("15 days") ||
    timelineRaw.includes("asap") ||
    timelineRaw.includes("urgent") ||
    combinedContext.includes("lease expires") ||
    combinedContext.includes("ready to close") ||
    combinedContext.includes("ready to move")
  ) {
    timelineScore = 30; // Immediate buyer
  } else if (
    timelineRaw.includes("1-3 months") ||
    timelineRaw.includes("1–3 months") ||
    timelineRaw.includes("1 to 3 months") ||
    timelineRaw.includes("2 months") ||
    timelineRaw.includes("60 days")
  ) {
    timelineScore = 22; // Active near-term buyer
  } else if (
    timelineRaw.includes("3-6 months") ||
    timelineRaw.includes("3–6 months") ||
    timelineRaw.includes("3 to 6 months") ||
    timelineRaw.includes("half year") ||
    timelineRaw.includes("next quarter")
  ) {
    timelineScore = 12; // Mid-term planner
  } else if (
    timelineRaw.includes("6-12 months") ||
    timelineRaw.includes("6–12 months") ||
    timelineRaw.includes("6 to 12 months") ||
    timelineRaw.includes("end of year") ||
    timelineRaw.includes("next year")
  ) {
    timelineScore = 5; // Long-term pipeline
  } else {
    // "Just exploring", ">12 months", or unspecified
    timelineScore = 0;
  }

  score += timelineScore;

  // =========================================================================
  // 2. INTENT & BUYING READINESS (Max 25 points)
  // =========================================================================
  let intentScore = 0;

  if (isExplicitlyNotBuyingNow) {
    // Lead explicitly stated they are not buying soon
    intentScore = 5;
  } else {
    const highReadinessPatterns = [
      "pre-approved",
      "token payment",
      "downpayment ready",
      "ready with funds",
      "loan approved",
      "cash ready",
      "site visit this weekend",
      "book appointment",
      "ready to close",
      "immediate possession",
      "nre account",
      "visiting next week",
    ];

    const activeInterestPatterns = [
      "buy",
      "purchase",
      "looking to buy",
      "investment",
      "rental yield",
      "end use",
      "relocating",
      "interested in",
      "shortlist",
      "possession",
    ];

    const hasHighReadiness = highReadinessPatterns.some((p) => combinedContext.includes(p));
    const hasActiveInterest = activeInterestPatterns.some((p) => combinedContext.includes(p));

    if (hasHighReadiness) {
      intentScore = 25; // Transaction ready
    } else if (hasActiveInterest) {
      intentScore = 18; // Serious buyer
    } else if (combinedContext.includes("exploring") || combinedContext.includes("checking") || combinedContext.includes("looking")) {
      intentScore = 8; // Window shopping / informational
    } else {
      intentScore = 3; // Ambiguous or minimal intent
    }
  }

  score += intentScore;

  // =========================================================================
  // 3. BUDGET CLARITY & REALISM (Max 20 points)
  // =========================================================================
  let budgetScore = 0;

  if (budgetRaw && budgetRaw !== "" && budgetRaw !== "0" && budgetRaw !== "n/a") {
    const hasNumbers = /\d/.test(budgetRaw);
    const hasCurrencyUnit =
      budgetRaw.includes("cr") ||
      budgetRaw.includes("crore") ||
      budgetRaw.includes("lakh") ||
      budgetRaw.includes("lac") ||
      budgetRaw.includes("l") ||
      budgetRaw.includes("k") ||
      budgetRaw.includes("m") ||
      budgetRaw.includes("₹") ||
      budgetRaw.includes("rs") ||
      budgetRaw.includes("$");

    const isVague =
      budgetRaw.includes("flexible") ||
      budgetRaw.includes("unsure") ||
      budgetRaw.includes("not sure") ||
      budgetRaw.includes("not decided") ||
      budgetRaw.includes("open") ||
      budgetRaw.includes("depends");

    if (hasNumbers && hasCurrencyUnit && !isVague) {
      budgetScore = 20; // Clear, explicit figure (e.g. ₹1.6 Cr, 65L)
    } else if (hasNumbers || (hasCurrencyUnit && isVague)) {
      budgetScore = 14; // Approximate or flexible around a figure
    } else if (isVague) {
      budgetScore = 8; // Vague / flexible
    } else {
      budgetScore = 4;
    }
  } else {
    budgetScore = 0; // Completely missing budget
  }

  score += budgetScore;

  // =========================================================================
  // 4. REQUIREMENT SPECIFICITY (Max 15 points)
  // =========================================================================
  let reqScore = 0;

  const keyReqCount = analysis?.keyRequirements?.length || 0;
  const hasConfig =
    reqRaw.includes("bhk") ||
    reqRaw.includes("penthouse") ||
    reqRaw.includes("villa") ||
    reqRaw.includes("plot") ||
    reqRaw.includes("duplex") ||
    reqRaw.includes("commercial") ||
    reqRaw.includes("office") ||
    reqRaw.includes("retail") ||
    reqRaw.includes("apartment");

  const hasSpecificLocation =
    (lead.location && lead.location.trim().length > 3 && !lead.location.toLowerCase().includes("unspecified")) || false;

  const hasExtraSpecs =
    reqRaw.includes("vastu") ||
    reqRaw.includes("terrace") ||
    reqRaw.includes("gated") ||
    reqRaw.includes("sq ft") ||
    reqRaw.includes("sqft") ||
    reqRaw.includes("east") ||
    reqRaw.includes("floor") ||
    reqRaw.includes("ready to move");

  if (keyReqCount >= 3 || (hasConfig && hasSpecificLocation && hasExtraSpecs)) {
    reqScore = 15; // Highly detailed and qualified requirements
  } else if (keyReqCount >= 1 || (hasConfig && hasSpecificLocation)) {
    reqScore = 10; // Good concrete requirement
  } else if (hasConfig || hasSpecificLocation) {
    reqScore = 5; // Basic requirement
  } else {
    reqScore = 2; // Generic or minimal
  }

  score += reqScore;

  // =========================================================================
  // 5. ENGAGEMENT & ACTIONABILITY (Max 10 points)
  // =========================================================================
  let engagementScore = 0;

  const msgLength = lead.customerMessage ? lead.customerMessage.trim().length : 0;
  const hasActionableCue =
    combinedContext.includes("site visit") ||
    combinedContext.includes("call me") ||
    combinedContext.includes("contact") ||
    combinedContext.includes("brochure") ||
    combinedContext.includes("floor plan") ||
    combinedContext.includes("appointment") ||
    combinedContext.includes("reach out");

  if (msgLength > 60 && hasActionableCue) {
    engagementScore = 10; // High engagement with clear CTA
  } else if (msgLength > 30 || hasActionableCue) {
    engagementScore = 6; // Moderate engagement
  } else if (msgLength > 5) {
    engagementScore = 3;
  } else {
    engagementScore = 0;
  }

  score += engagementScore;

  // =========================================================================
  // 6. INVENTORY MATCH CALCULATION & INVENTORY FACTOR
  // =========================================================================
  let bestMatch: PropertyMatch | null = null;
  if (Array.isArray(inventoryOrMatch)) {
    bestMatch = getBestPropertyMatch(lead, inventoryOrMatch);
  } else if (inventoryOrMatch && "property" in inventoryOrMatch) {
    bestMatch = inventoryOrMatch as PropertyMatch;
  } else if (inventoryOrMatch && "id" in inventoryOrMatch) {
    bestMatch = {
      property: inventoryOrMatch as Property,
      matchScore: 90,
      matchReason: `Direct inventory alignment with ${(inventoryOrMatch as Property).title}`,
      isPerfectMatch: true,
      isStrongMatch: true,
      matchedCriteria: { location: true, propertyType: true, budget: true },
    };
  }

  // =========================================================================
  // FINAL SCORE NORMALIZATION & CRITICAL OVERRIDES
  // =========================================================================
  score = Math.min(Math.max(score, 0), 100);

  // OVERRIDE 1: Explicitly not buying now (e.g. "not this year", "just exploring for 2028")
  // MUST be categorized as COLD regardless of budget or inventory
  if (isExplicitlyNotBuyingNow) {
    score = Math.min(score, 35);
    return {
      score,
      priority: "COLD",
      matchedProperty: bestMatch,
      hasInventoryMatch: Boolean(bestMatch),
      matchReason: bestMatch?.matchReason,
    };
  }

  // OVERRIDE 2: Inventory Match Factor (Explicit User Requirement)
  // "if we have a matching apartment as of the lead, we will make it hot"
  if (bestMatch && (bestMatch.isPerfectMatch || bestMatch.isStrongMatch || bestMatch.matchScore >= 60)) {
    // Add significant inventory match boost
    score = Math.min(Math.max(score + 25, 82), 100);
    return {
      score,
      priority: "HOT",
      matchedProperty: bestMatch,
      hasInventoryMatch: true,
      matchReason: bestMatch.matchReason,
    };
  }

  // OVERRIDE 3: Casual browsing with no budget or timeline
  if (timelineRaw.includes("just exploring") && budgetScore <= 8) {
    score = Math.min(score, 40);
    return {
      score,
      priority: "COLD",
      matchedProperty: bestMatch,
      hasInventoryMatch: Boolean(bestMatch),
      matchReason: bestMatch?.matchReason,
    };
  }

  // OVERRIDE 4: Immediate buyer (< 1 month) with verified budget and high readiness
  if (timelineScore === 30 && budgetScore >= 14 && intentScore >= 18) {
    score = Math.max(score, 80);
    return {
      score,
      priority: "HOT",
      matchedProperty: bestMatch,
      hasInventoryMatch: Boolean(bestMatch),
      matchReason: bestMatch?.matchReason,
    };
  }

  // STANDARD THRESHOLDS
  let priority: "HOT" | "WARM" | "COLD" = "COLD";
  if (score >= 75) {
    priority = "HOT";
  } else if (score >= 45) {
    priority = "WARM";
  } else {
    priority = "COLD";
  }

  return {
    score,
    priority,
    matchedProperty: bestMatch,
    hasInventoryMatch: Boolean(bestMatch),
    matchReason: bestMatch?.matchReason,
  };
}

/**
 * Calibrates the entire pipeline of leads with currently held inventory properties.
 * Identifies matches, upgrades priority to HOT for matching apartments,
 * and attaches full match details.
 */
export function applyInventoryCalibration(leads: Lead[], properties: Property[]): Lead[] {
  if (!properties || properties.length === 0) return leads;

  return leads.map((lead) => {
    const matches = findMatchingProperties(lead, properties);
    const best = matches.length > 0 ? matches[0] : null;

    if (!best) {
      return {
        ...lead,
        matchedProperty: undefined,
        matchedProperties: [],
      };
    }

    const { score, priority } = calculateLeadScore(lead, {
      leadSummary: lead.leadSummary || "",
      customerIntent: lead.customerIntent || "",
      keyRequirements: lead.keyRequirements || [],
      objections: lead.objections || [],
      recommendedNextAction: lead.recommendedNextAction || "",
    }, best);

    const formattedMatchedProperty = {
      id: best.property.id,
      title: best.property.title,
      propertyType: best.property.propertyType,
      location: best.property.location,
      price: best.property.price,
      status: best.property.status,
      matchScore: best.matchScore,
      matchReason: best.matchReason,
      isPerfectMatch: best.isPerfectMatch,
    };

    const formattedAllMatches = matches.map((m) => ({
      id: m.property.id,
      title: m.property.title,
      propertyType: m.property.propertyType,
      location: m.property.location,
      price: m.property.price,
      status: m.property.status,
      matchScore: m.matchScore,
      matchReason: m.matchReason,
      isPerfectMatch: m.isPerfectMatch,
    }));

    return {
      ...lead,
      priority,
      score,
      matchedProperty: formattedMatchedProperty,
      matchedProperties: formattedAllMatches,
    };
  });
}

