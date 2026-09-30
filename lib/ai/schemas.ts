import { z } from "zod";

export const leadAnalysisSchema = z.object({
  leadSummary: z.string().describe("A concise summary of the lead's profile and inquiry."),
  customerIntent: z.string().describe("The primary intent or goal of the customer (e.g., 'Looking to buy a family home in the next 6 months')."),
  keyRequirements: z.array(z.string()).describe("Concrete requirements extracted from the lead, such as '3 BHK', 'Bangalore', or 'Budget 1.2 Cr'."),
  objections: z.array(z.string()).describe("Any explicit or implied concerns, objections, or hurdles mentioned by the customer."),
  recommendedNextAction: z.string().describe("A practical and actionable next step for the real estate salesperson to take."),
});

export type LeadAnalysis = z.infer<typeof leadAnalysisSchema>;

export const suggestedResponseSchema = z.object({
  suggestedResponse: z.string().describe("A concise, professional email or message response for the salesperson to send to the lead."),
});

export type SuggestedResponse = z.infer<typeof suggestedResponseSchema>;

export const chatRequestSchema = z.object({
  leadId: z.string().optional().nullable(),
  message: z.string().min(1, "Message is required"),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string()
  })).default([]),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
