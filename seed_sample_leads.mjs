import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Connecting to Supabase at:', supabaseUrl);

async function cleanAndSeed() {
  console.log('1. Deleting all existing leads...');
  const { data: existingLeads, error: fetchErr } = await supabase.from('leads').select('id');
  if (fetchErr) {
    console.error('Error fetching leads to delete:', fetchErr);
    return;
  }

  if (existingLeads && existingLeads.length > 0) {
    const ids = existingLeads.map(l => l.id);
    const { error: delErr } = await supabase.from('leads').delete().in('id', ids);
    if (delErr) {
      console.error('Error deleting leads:', delErr);
      return;
    }
    console.log(`Successfully deleted ${ids.length} existing leads.`);
  } else {
    console.log('No existing leads found to delete.');
  }

  // 2. Define rich, diverse sample leads representing edge cases and standard scenarios
  const sampleLeads = [
    {
      name: 'Vikramaditya Roy',
      location: 'Indiranagar, Bangalore',
      property_requirement: '4 BHK Luxury Penthouse or Duplex with private terrace',
      budget: '₹4.5 Cr',
      buying_timeline: 'Within 1 month',
      customer_message: 'Currently living on rent in Indiranagar. Lease expires next month. Need a ready-to-move 4 BHK penthouse or duplex with at least 2 reserved car parks and 100% power backup. Ready with pre-approved loan from HDFC, can finalize token payment this week if property matches.',
      analysis_status: 'completed',
      score: 95,
      priority: 'HOT',
      lead_summary: 'High-net-worth urgent buyer whose lease expires next month. Pre-approved ₹4.5 Cr loan from HDFC and ready for immediate token payment upon finding a suitable ready-to-move 4 BHK penthouse/duplex in Indiranagar.',
      customer_intent: 'Immediate luxury residential purchase with ready financing and urgent 3-4 week move-in timeline.',
      key_requirements: [
        '4 BHK Luxury Penthouse or Duplex',
        'Location: Indiranagar, Bangalore',
        'Budget: ₹4.5 Cr',
        'Ready-to-move condition',
        'Private terrace garden',
        'At least 2 reserved car parks',
        '100% power backup'
      ],
      objections: [
        'Strict 30-day move-in deadline due to lease expiration',
        'Zero tolerance for delayed possession or incomplete amenities'
      ],
      recommended_next_action: 'Arrange private walkthroughs for 2 shortlisted ready-to-move luxury penthouses in Indiranagar within 48 hours.',
      suggested_response: 'Dear Vikramaditya, thank you for reaching out. We have 2 exclusive ready-to-move 4 BHK duplex/penthouse residences in Indiranagar matching your ₹4.5 Cr budget, complete with private terraces and dedicated parking. Since your lease expires next month, could we arrange a private walkthrough for you this Thursday or Friday?'
    },
    {
      name: 'Dr. Sameer Al-Mansoor (NRI)',
      location: 'MG Road / CBD, Bangalore',
      property_requirement: 'Commercial Office Space or Grade-A Retail Unit (1,500 - 2,500 sq ft)',
      budget: '₹3.2 Cr',
      buying_timeline: 'Within 1 month',
      customer_message: 'NRI based in Dubai visiting Bangalore next week from Oct 5-12. Looking to acquire pre-leased commercial office space with minimum 7.5% ROI. Funds ready in NRE account. Need appointments booked in advance.',
      analysis_status: 'completed',
      score: 90,
      priority: 'HOT',
      lead_summary: 'Dubai-based NRI investor visiting Bangalore for 7 days with liquid NRE capital to purchase a pre-leased commercial asset offering >7.5% rental yield.',
      customer_intent: 'Acquire cash-flow generating pre-leased commercial real estate during upcoming Bangalore visit.',
      key_requirements: [
        'Grade-A Commercial Office or Retail Unit (1,500 - 2,500 sq ft)',
        'Location: MG Road / CBD / Central Bangalore',
        'Budget: ₹3.2 Cr',
        'Pre-leased with minimum 7.5% gross rental yield',
        'Clean title and Grade-A tenant covenant'
      ],
      objections: [
        'Very tight travel window (Oct 5–12)',
        'Requires documented tenant lease agreements and yield proof'
      ],
      recommended_next_action: 'Prepare comprehensive financial models and tenant dossiers for 3 pre-leased CBD commercial assets and lock in meeting for Oct 6.',
      suggested_response: 'Dr. Sameer, welcome. We have curated 3 pre-leased Grade-A commercial spaces in Central Bangalore yielding between 7.8% and 8.4% with multinational tenants. All legal titles and lease contracts are ready for your due diligence. Let us confirm an in-person meeting on October 6th during your visit.'
    },
    {
      name: 'Ananya Deshmukh',
      location: 'Whitefield, Bangalore',
      property_requirement: '3 BHK Apartment in Gated Community near ITPL',
      budget: '₹1.6 Cr',
      buying_timeline: '1–3 months',
      customer_message: 'Looking for a 3 BHK in a reputed gated society with clubhouse and kids play area. Walking distance or quick commute to ITPL/Prestige Shantiniketan. Possession within 60 days. Please share brochures and floor plans; free for site visits on Saturday.',
      analysis_status: 'completed',
      score: 82,
      priority: 'HOT',
      lead_summary: 'Tech professional working near ITPL looking for a 3 BHK family apartment in a gated society with active lifestyle amenities. Ready to purchase within 60 days.',
      customer_intent: 'End-use family home purchase near workplace with quick possession.',
      key_requirements: [
        '3 BHK Apartment (1,500 - 1,800 sq ft)',
        'Location: Whitefield (near ITPL / Prestige Shantiniketan)',
        'Budget: ₹1.6 Cr',
        'Gated community with clubhouse and children’s play area',
        'Possession within 60 days'
      ],
      objections: [
        'Commute distance to ITPL is critical',
        'Demands reputable builder with clear occupancy certificate (OC)'
      ],
      recommended_next_action: 'Send floor plans and brochure links for 2 premium societies near ITPL and confirm site visit this Saturday at 11 AM.',
      suggested_response: 'Hi Ananya, thank you for contacting us. We have two exceptional 3 BHK options in gated communities just 10 minutes from ITPL with full clubhouse facilities and ready OC, perfectly within your ₹1.6 Cr budget. Would this Saturday at 11:00 AM work for a guided site walkthrough?'
    },
    {
      name: 'Rajesh & Sunita Mehra',
      location: 'Outer Ring Road / Bellandur, Bangalore',
      property_requirement: '2 BHK or 2.5 BHK for rental investment',
      budget: '₹95 Lakhs - ₹1.1 Cr (Flexible for good rental yield)',
      buying_timeline: '1–3 months',
      customer_message: 'We are looking to invest in a 2 BHK apartment along the ORR corridor specifically for high tenant demand and rental yield. Prefer under-construction nearing possession or newly completed project with A-Khata.',
      analysis_status: 'completed',
      score: 72,
      priority: 'WARM',
      lead_summary: 'Couple seeking high-demand rental asset along tech corridor. Flexible on budget up to ₹1.1 Cr if property delivers strong tenant occupancy and A-Khata documentation.',
      customer_intent: 'Passive income and capital appreciation through residential rental investment along ORR tech belt.',
      key_requirements: [
        '2 BHK or 2.5 BHK Apartment',
        'Location: Bellandur / ORR / Marathahalli corridor',
        'Budget: ₹95 Lakhs - ₹1.1 Cr',
        'High tenant demand / rental yield',
        'Clear A-Khata title'
      ],
      objections: [
        'Skeptical about construction delay on under-construction projects',
        'Wants verified local rental rate benchmarks'
      ],
      recommended_next_action: 'Share historic rental yield data for Bellandur projects and schedule a consultation call on Saturday.',
      suggested_response: 'Hello Rajesh and Sunita, investing along the ORR corridor is an excellent strategy—properties here currently command ₹38k–₹45k monthly rental for 2 BHKs. We have verified A-Khata projects within your ₹95L–₹1.1 Cr budget. Could we set up a brief phone call tomorrow to share rental benchmarks?'
    },
    {
      name: 'Meenakshi & Suresh Iyer',
      location: 'Jayanagar / Banashankari, Bangalore',
      property_requirement: '3 BHK East-facing Vastu compliant apartment',
      budget: '₹2.1 Cr',
      buying_timeline: '1–3 months',
      customer_message: 'Strictly looking for 100% East-facing entrance, kitchen in Southeast (Agneya). Must be on middle floor (between 4th and 8th floor). No ground floor or top floor units. Have checked 2 properties already but rejected due to Vastu flaws.',
      analysis_status: 'completed',
      score: 68,
      priority: 'WARM',
      lead_summary: 'Discerning buyers with strict Vastu requirements (East entrance, Southeast kitchen) and middle floor preference in South Bangalore. Has ₹2.1 Cr budget and active intent.',
      customer_intent: 'Purchase an authentic Vastu-compliant 3 BHK home in established South Bangalore neighborhood.',
      key_requirements: [
        '3 BHK Apartment',
        'Location: Jayanagar / Banashankari',
        'Budget: ₹2.1 Cr',
        '100% Vastu compliance (East entrance, Agneya kitchen)',
        'Middle floor (Floor 4 to 8 only)'
      ],
      objections: [
        'High rejection rate on previous properties due to architectural non-compliance with Vastu',
        'Refuses ground and top floors'
      ],
      recommended_next_action: 'Pre-screen architectural floor plans with a certified Vastu consultant before presenting to the client.',
      suggested_response: 'Namaste Meenakshi and Suresh, we completely understand and respect your strict Vastu specifications. We have pre-audited unit floor plans in Jayanagar with 100% East-facing entry and Southeast kitchen on the 5th and 6th floors within your ₹2.1 Cr budget. May I send you the architectural drawings for your review?'
    },
    {
      name: 'Karthik Venkat',
      location: 'Electronic City Phase 1, Bangalore',
      property_requirement: '2 BHK Apartment near Metro Station',
      budget: '₹65 Lakhs (Strict upper cap)',
      buying_timeline: '3–6 months',
      customer_message: 'First time homebuyer. Need a compact 2 BHK close to the upcoming yellow line metro. Maximum all-inclusive budget is 65L including registration. Need builder tie-ups with SBI for 85% home loan.',
      analysis_status: 'completed',
      score: 58,
      priority: 'WARM',
      lead_summary: 'Salaried first-time buyer with strict ₹65 Lakh all-inclusive budget cap dependent on 85% SBI home loan financing. Targeting metro-adjacent properties in Electronic City.',
      customer_intent: 'First-time home ownership with high sensitivity to total out-of-pocket costs and bank financing.',
      key_requirements: [
        '2 BHK compact apartment',
        'Location: Electronic City Phase 1 (close to metro)',
        'Budget: ₹65 Lakhs all-inclusive (with registration)',
        'SBI approved project for 85% home loan',
        'Timeline: 3–6 months'
      ],
      objections: [
        'Strict financial ceiling (cannot stretch beyond 65L)',
        'Apprehensive about hidden builder costs or registration extras'
      ],
      recommended_next_action: 'Provide all-inclusive cost sheets showing zero hidden charges and introduce to designated SBI loan officer.',
      suggested_response: 'Hi Karthik, congratulations on taking the step toward your first home! We have RERA-approved 2 BHK units 800m from the Electronic City metro station with all-inclusive pricing under ₹65 Lakhs, pre-approved by SBI for 85% funding. Would you like a transparent cost sheet breakdown?'
    },
    {
      name: 'Nitin Shukla',
      location: 'North Bangalore / Hebbal',
      property_requirement: '3 BHK or Row House near Airport Road',
      budget: '₹2.5 Cr',
      buying_timeline: 'More than 12 months',
      customer_message: 'I want to buy a house eventually in North Bangalore near the airport road, but definitely not this year. Just casually exploring price appreciation trends and upcoming mega townships for late 2027 or 2028.',
      analysis_status: 'completed',
      score: 28,
      priority: 'COLD',
      lead_summary: 'High-budget prospective buyer planning for late 2027 or 2028. Explicitly confirmed he is NOT buying this year and is only gathering long-term market intelligence.',
      customer_intent: 'Early-stage research and price trend monitoring for long-term residential acquisition.',
      key_requirements: [
        '3 BHK or Row House',
        'Location: North Bangalore / Bellary Road corridor',
        'Budget: ~₹2.5 Cr',
        'Timeline: Late 2027 or 2028 (Not this year)'
      ],
      objections: [
        'Explicitly stated: NOT purchasing this year',
        'Will disengage if subjected to hard selling or immediate visit requests'
      ],
      recommended_next_action: 'Enroll in quarterly North Bangalore infrastructure & price appreciation newsletter; check in mid-2027.',
      suggested_response: 'Hi Nitin, thank you for reaching out! We completely respect that you are planning ahead for late 2027/2028 and not looking to purchase this year. We will add you to our quarterly North Bangalore price index update so you can track market trends at your own pace without any sales pressure.'
    },
    {
      name: 'Amitabh Sen',
      location: 'Sarjapur Road, Bangalore',
      property_requirement: 'Plot / Villa / Land',
      budget: 'Flexible / Unsure',
      buying_timeline: 'Just exploring',
      customer_message: 'Just checking out what gated plots or villas are going for around Sarjapur. Send whatever catalogs you have.',
      analysis_status: 'completed',
      score: 18,
      priority: 'COLD',
      lead_summary: 'Casual browser with unformed requirements and unspecified budget asking for broad promotional catalogs.',
      customer_intent: 'Passive curiosity without defined timeline, budget, or purchasing readiness.',
      key_requirements: [
        'Plot or Villa (Undecided)',
        'Location: Sarjapur Road',
        'Budget: Undefined / Flexible',
        'Timeline: Indefinite / Exploring'
      ],
      objections: [
        'No commitment, no defined budget, no timeline'
      ],
      recommended_next_action: 'Share digital overview catalog via email with a 1-question qualifying survey.',
      suggested_response: 'Hello Amitabh, here is our Sarjapur Road residential master brochure featuring current gated community plots and villa developments. When you have a moment, take a look and let us know if a particular development catches your interest!'
    }
  ];

  console.log(`2. Inserting ${sampleLeads.length} sample leads into Supabase...`);
  const { data: inserted, error: insertErr } = await supabase
    .from('leads')
    .insert(sampleLeads)
    .select();

  if (insertErr) {
    console.error('Error inserting sample leads:', insertErr);
    return;
  }

  console.log(`Successfully seeded ${inserted.length} sample leads:`);
  for (const lead of inserted) {
    console.log(`- [${lead.priority}] (${lead.score} pts) ${lead.name} -> ${lead.property_requirement} (${lead.budget}, ${lead.buying_timeline})`);
  }

  console.log('\nSeed completed successfully!');
}

cleanAndSeed();
