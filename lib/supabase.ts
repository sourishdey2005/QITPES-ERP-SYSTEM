
import { createClient } from '@supabase/supabase-js';

// QITPES ERP - Supabase Configuration
const supabaseUrl = 'https://asvkyztwnjgeajoyccuo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzdmt5enR3bmpnZWFqb3ljY3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTYwNjksImV4cCI6MjA4NjM5MjA2OX0.YW60fWMya6hhc4PuKWCIXqIog2AZaOs67AzVhqVgVbo'; 

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
