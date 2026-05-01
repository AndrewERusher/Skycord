import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const myId = '3701edfc-c5dc-4018-8e6c-8612039d4856';
  
  // Try fetching conversations with their parent
  const { data, error } = await supabase.from('conversations').select('id, name, parent_group_id, parent_group:parent_group_id(name)').limit(5);
  console.log("Groups with parent:", JSON.stringify(data, null, 2));
  if (error) console.error(error);
}

check();
