import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';
import { FinalizedDeal } from '@/types/deal';

const DATA_DIR = path.join(process.cwd(), 'data');
const DEALS_FILE = path.join(DATA_DIR, 'finalized_deals.json');

function readLocalDeals(): FinalizedDeal[] {
  try {
    if (!fs.existsSync(DEALS_FILE)) {
      return [];
    }
    const content = fs.readFileSync(DEALS_FILE, 'utf-8');
    return JSON.parse(content) as FinalizedDeal[];
  } catch (err) {
    console.error('Error reading local finalized deals:', err);
    return [];
  }
}

function writeLocalDeals(deals: FinalizedDeal[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DEALS_FILE, JSON.stringify(deals, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local finalized deals:', err);
  }
}

export async function getFinalizedDeals(): Promise<FinalizedDeal[]> {
  try {
    const { data, error } = await supabase
      .from('finalized_deals')
      .select('*')
      .order('finalized_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        dealType: row.deal_type,
        finalizedAt: row.finalized_at,
        clientName: row.client_name,
        propertyTitle: row.property_title,
        agreedPrice: row.agreed_price,
        tokenAdvance: row.token_advance,
        closingDate: row.closing_date,
        agentNotes: row.agent_notes,
        leadId: row.lead_details?.id,
        propertyId: row.property_details?.id,
        leadDetails: row.lead_details,
        propertyDetails: row.property_details,
      }));
    }
  } catch (err) {
    // If Supabase table is not yet created, fallback to local storage
  }

  return readLocalDeals();
}

export async function addFinalizedDeal(
  dealData: Omit<FinalizedDeal, 'id' | 'finalizedAt'>
): Promise<FinalizedDeal> {
  const newId = `deal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newDeal: FinalizedDeal = {
    ...dealData,
    id: newId,
    finalizedAt: now,
  };

  // Attempt Supabase insert
  try {
    const { data, error } = await supabase
      .from('finalized_deals')
      .insert([{
        id: newDeal.id,
        deal_type: newDeal.dealType,
        finalized_at: newDeal.finalizedAt,
        client_name: newDeal.clientName,
        property_title: newDeal.propertyTitle,
        agreed_price: newDeal.agreedPrice,
        token_advance: newDeal.tokenAdvance,
        closing_date: newDeal.closingDate,
        agent_notes: newDeal.agentNotes,
        lead_details: newDeal.leadDetails,
        property_details: newDeal.propertyDetails,
      }])
      .select()
      .single();

    if (!error && data) {
      const local = readLocalDeals();
      writeLocalDeals([newDeal, ...local]);
      return newDeal;
    }
  } catch (err) {
    // Fallback to local
  }

  const local = readLocalDeals();
  const updated = [newDeal, ...local];
  writeLocalDeals(updated);
  return newDeal;
}

export async function deleteFinalizedDeal(id: string): Promise<boolean> {
  try {
    await supabase.from('finalized_deals').delete().eq('id', id);
  } catch {
    // Ignore
  }

  const local = readLocalDeals();
  const filtered = local.filter((d) => d.id !== id);
  writeLocalDeals(filtered);
  return true;
}
