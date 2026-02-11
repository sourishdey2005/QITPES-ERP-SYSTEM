import { createClient } from '@supabase/supabase-js';

// QITPES ERP - Verified Production Connection
// Project Name: ERP
// Project ID: asvkyztwnjgeajoyccuo
const supabaseUrl = 'https://asvkyztwnjgeajoyccuo.supabase.co';
const supabaseAnonKey = 'sb_publishable_UiqrTs3LbymTSLOTH5tDag_Zjye5owE'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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