import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { singleLeadChatPrompt, pipelineChatPrompt } from "@/lib/ai/prompts";
import { model } from "@/lib/ai/model";
import { Lead } from "@/types/lead";
import { LeadAnalysis } from "@/lib/ai/schemas";
import { getProperties } from "@/lib/db/properties";
import { getBestPropertyMatch } from "@/lib/matching";

export const ChatStateAnnotation = Annotation.Root({
  lead: Annotation<Lead | undefined>({
    reducer: (x, y) => y ?? x,
  }),
  allLeads: Annotation<Lead[] | undefined>({
    reducer: (x, y) => y ?? x,
  }),
  analysis: Annotation<LeadAnalysis | undefined>({
    reducer: (x, y) => y ?? x,
  }),
  score: Annotation<number | undefined>({
    reducer: (x, y) => y ?? x,
  }),
  priority: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
  }),
  suggestedResponse: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
  }),
  history: Annotation<{ role: string; content: string }[]>({
    reducer: (x, y) => y ?? x,
  }),
  question: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  response: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
  }),
  error: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
  }),
});

export type ChatState = typeof ChatStateAnnotation.State;

const generateResponseNode = async (state: ChatState): Promise<Partial<ChatState>> => {
  try {
    const historyStr = (state.history || [])
      .map((msg: { role: string; content: string }) => `${msg.role === 'user' ? 'Salesperson' : 'AI Assistant'}: ${msg.content}`)
      .join("\n\n");

    const properties = await getProperties();

    // Case 1: Specific lead in context
    if (state.lead) {
      const chain = singleLeadChatPrompt.pipe(model).pipe(new StringOutputParser());
      const noInfo = "Not specified";
      
      const bestMatch = state.lead ? getBestPropertyMatch(state.lead, properties) : null;
      const matchingPropertyInfo = bestMatch 
        ? `${bestMatch.property.title} (${bestMatch.property.propertyType} in ${bestMatch.property.location}, Price: ${bestMatch.property.price}, Status: ${bestMatch.property.status}, Amenities: ${bestMatch.property.amenities?.join(', ') || 'N/A'})\nMatch Note: ${bestMatch.matchReason}`
        : "No currently held apartment directly matches their requirements in our inventory.";

      const response = await chain.invoke({
        name: state.lead?.name || noInfo,
        location: state.lead?.location || noInfo,
        propertyRequirement: state.lead?.propertyRequirement || noInfo,
        budget: state.lead?.budget || noInfo,
        buyingTimeline: state.lead?.buyingTimeline || noInfo,
        customerMessage: state.lead?.customerMessage || noInfo,
        leadSummary: state.analysis?.leadSummary || "Not yet formally summarized (dynamically analyze requirements from profile above)",
        customerIntent: state.analysis?.customerIntent || "Dynamically determine from lead requirements and message",
        keyRequirements: state.analysis?.keyRequirements?.length ? state.analysis.keyRequirements.join(", ") : (state.lead?.propertyRequirement || noInfo),
        objections: state.analysis?.objections?.length ? state.analysis.objections.join(", ") : "Analyze from customer message context",
        recommendedNextAction: state.analysis?.recommendedNextAction || "Analyze requirements to suggest next best action",
        suggestedResponse: state.suggestedResponse || "None recorded yet",
        score: state.score != null ? String(state.score) : (state.lead?.score != null ? String(state.lead.score) : "Not scored"),
        priority: state.priority || state.lead.priority || "Pending",
        matchingPropertyInfo,
        history: historyStr || "No previous messages in this conversation.",
        question: state.question
      });

      return { response };
    }

    // Case 2: Pipeline-wide chat on the dashboard
    if (state.allLeads && state.allLeads.length > 0) {
      const chain = pipelineChatPrompt.pipe(model).pipe(new StringOutputParser());
      
      const inventoryList = properties.length > 0
        ? properties.map((p) => `• ${p.title} (${p.propertyType} | ${p.location} | Price: ${p.price} | Status: ${p.status} | Amenities: ${p.amenities?.join(', ') || 'Standard'})\n  Description: ${p.description || 'Verified property unit'}`).join("\n\n")
        : "No active properties currently stored in inventory.";

      const leadsList = state.allLeads.map((l) => {
        const match = getBestPropertyMatch(l, properties);
        const matchStr = match ? `\n  🎯 Matched Inventory: ${match.property.title} (${match.property.price} in ${match.property.location}) - ${match.matchReason}` : '';
        return `• ${l.name} (${l.location || 'Location unspecified'} | ${l.propertyRequirement || 'Requirement unspecified'} | Budget: ${l.budget || 'Unspecified'} | Timeline: ${l.buyingTimeline || 'Unspecified'} | Priority: ${l.priority || 'Unscored'} [Score: ${l.score ?? 'N/A'}])${matchStr}
  Inquiry: "${l.customerMessage || 'No message provided'}"
  Summary: ${l.leadSummary || 'Pending'}`;
      }).join("\n\n");

      const response = await chain.invoke({
        leadsList,
        inventoryList,
        history: historyStr || "No previous messages in this conversation.",
        question: state.question
      });

      return { response };
    }

    // Case 3: Empty pipeline fallback
    return {
      response: "I'm your AI Real Estate Sales Assistant. There are currently no leads in your pipeline. Once you add a new lead or select one, I can analyze their requirements and generate customized responses, emails, WhatsApp messages, and action plans for you."
    };
  } catch (error) {
    console.error("Error in generateResponseNode:", error);
    return { error: error instanceof Error ? error.message : "Failed to generate response" };
  }
};

export const leadChatGraph = new StateGraph(ChatStateAnnotation)
  .addNode("generateResponse", generateResponseNode)
  .addEdge(START, "generateResponse")
  .addEdge("generateResponse", END)
  .compile();

