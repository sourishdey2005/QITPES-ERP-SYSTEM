import { createClient } from '@supabase/supabase-js';
import { withDemoData } from './demo/client';

// QITPES ERP - Verified Production Connection
// Project Name: ERP
// Project ID: asvkyztwnjgeajoyccuo
const supabaseUrl = 'https://asvkyztwnjgeajoyccuo.supabase.co';
const supabaseAnonKey = 'sb_publishable_UiqrTs3LbymTSLOTH5tDag_Zjye5owE'; 

// The demo layer fills empty/unreachable tables with realistic local data so the
// portal stays usable without a seeded database. Disable with VITE_DEMO_DATA=false.
export const supabase = withDemoData(createClient(supabaseUrl, supabaseAnonKey));

/**
 * Formats a number into Indian Rupee (INR) currency format.
 * Used across the ERP system for financial consistency.
 */
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};