import { StateGraph, START, END } from "@langchain/langgraph";
import { model } from "../model";
import { leadAnalysisSchema, suggestedResponseSchema } from "../schemas";
import { analyzeLeadPrompt, suggestResponsePrompt } from "../prompts";
import { LeadState, LeadStateAnnotation } from "../state/lead-state";
import { calculateLeadScore } from "../../scoring";
import { getProperties } from "../../db/properties";

async function analyzeLeadNode(state: LeadState): Promise<Partial<LeadState>> {
  try {
    const { lead } = state;
    
    // Bind structured output to the model using the Zod schema
    const modelWithStructure = model.withStructuredOutput(leadAnalysisSchema);
    
    // Format the prompt
    const prompt = await analyzeLeadPrompt.format({
      name: lead.name,
      location: lead.location,
      propertyRequirement: lead.propertyRequirement,
      budget: lead.budget,
      buyingTimeline: lead.buyingTimeline,
      customerMessage: lead.customerMessage,
    });

    // Invoke model
    const analysis = await modelWithStructure.invoke(prompt);
    
    return { analysis };
  } catch (error) {
    console.error("Error in analyzeLeadNode:", error);
    return { error: "Failed to analyze lead: " + (error instanceof Error ? error.message : String(error)) };
  }
}

async function calculateScoreNode(state: LeadState): Promise<Partial<LeadState>> {
  try {
    const { lead, analysis } = state;
    
    if (!analysis) {
      return { error: "Analysis missing for scoring." };
    }

    const properties = await getProperties();
    const { score, priority } = calculateLeadScore(lead, analysis, properties);
    
    return { score, priority };
  } catch (error) {
    console.error("Error in calculateScoreNode:", error);
    return { error: "Failed to calculate score." };
  }
}

async function generateResponseNode(state: LeadState): Promise<Partial<LeadState>> {
  try {
    const { lead, analysis } = state;
    
    if (!analysis) {
      return { error: "Analysis missing for response generation." };
    }
    
    const modelWithStructure = model.withStructuredOutput(suggestedResponseSchema);

    const prompt = await suggestResponsePrompt.format({
      name: lead.name,
      location: lead.location,
      propertyRequirement: lead.propertyRequirement,
      budget: lead.budget,
      buyingTimeline: lead.buyingTimeline,
      customerMessage: lead.customerMessage,
      leadSummary: analysis.leadSummary,
      customerIntent: analysis.customerIntent,
      keyRequirements: analysis.keyRequirements.join(", "),
      objections: analysis.objections.join(", "),
      recommendedNextAction: analysis.recommendedNextAction,
    });

    const response = await modelWithStructure.invoke(prompt);
    
    return { suggestedResponse: response.suggestedResponse };
  } catch (error) {
    console.error("Error in generateResponseNode:", error);
    return { error: "Failed to generate suggested response." };
  }
}

export const leadAnalysisGraph = new StateGraph(LeadStateAnnotation)
  .addNode("analyzeLead", analyzeLeadNode)
  .addNode("calculateScore", calculateScoreNode)
  .addNode("generateResponse", generateResponseNode)
  .addEdge(START, "analyzeLead")
  .addConditionalEdges("analyzeLead", (state: LeadState) => state.error ? END : "calculateScore")
  .addConditionalEdges("calculateScore", (state: LeadState) => state.error ? END : "generateResponse")
  .addEdge("generateResponse", END)
  .compile();
