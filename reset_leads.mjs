import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPendingLeads() {
  const { error } = await supabase
    .from('leads')
    .update({ analysis_status: 'unanalyzed' })
    .eq('analysis_status', 'pending');
    
  console.log('Reset pending leads:', error ? error.message : 'Success');
}

resetPendingLeads();
