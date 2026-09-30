import { Lead } from "@/types/lead";
import { LeadAnalysis } from "../schemas";
import { Annotation } from "@langchain/langgraph";

export const LeadStateAnnotation = Annotation.Root({
  lead: Annotation<Lead>(),
  analysis: Annotation<LeadAnalysis>(),
  score: Annotation<number>(),
  priority: Annotation<"HOT" | "WARM" | "COLD">(),
  suggestedResponse: Annotation<string>(),
  error: Annotation<string>(),
});

export type LeadState = typeof LeadStateAnnotation.State;
