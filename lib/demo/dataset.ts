// QITPES ERP - Deterministic demo dataset
//
// Generates realistic Indian ERP data (names, RTO vehicle numbers, INR amounts)
// entirely on the client. The demo fallback in lib/demo/client.ts serves these
// rows when Supabase is unreachable or a table is still empty, so the portal
// always looks populated without any database seeding.
//
// Everything is seeded per table, which keeps values stable between reloads.

export type DemoRow = Record<string, any>;

const NOW = new Date();
const DAY = 86_400_000;

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Rng {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  chance: (p: number) => boolean;
  money: (min: number, max: number) => number;
  pastDate: (minDaysAgo: number, maxDaysAgo: number) => Date;
  futureDate: (minDaysAhead: number, maxDaysAhead: number) => Date;
}

const makeRng = (table: string): Rng => {
  const next = mulberry32(hashString(`qitpes-demo:${table}`));
  const int = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min;
  return {
    next,
    int,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    chance: (p: number) => next() < p,
    money: (min: number, max: number) => Math.round((min + next() * (max - min)) / 100) * 100,
    pastDate: (minDaysAgo: number, maxDaysAgo: number) =>
      new Date(NOW.getTime() - int(minDaysAgo, maxDaysAgo) * DAY),
    futureDate: (minDaysAhead: number, maxDaysAhead: number) =>
      new Date(NOW.getTime() + int(minDaysAhead, maxDaysAhead) * DAY),
  };
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
const isoTime = (d: Date) => d.toISOString();
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);

/** Stable, valid-looking UUID derived from a table + row index. */
export function demoId(table: string, index: number): string {
  const prefix = hashString(table).toString(16).padStart(8, '0').slice(0, 8);
  return `${prefix}-0000-4000-8000-${index.toString(16).padStart(12, '0')}`;
}

// ---------------------------------------------------------------------------
// Reference pools
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Dhruv', 'Kartik', 'Rudra', 'Yash', 'Rohan', 'Siddharth',
  'Ananya', 'Diya', 'Aadhya', 'Ira', 'Pari', 'Anika', 'Navya', 'Myra', 'Saanvi', 'Kiara',
  'Riya', 'Aaradhya', 'Sneha', 'Pooja', 'Neha', 'Priya', 'Shreya', 'Kavya', 'Meera', 'Ishita',
  'Rahul', 'Amit', 'Suresh', 'Rakesh', 'Vikram', 'Rajesh', 'Manoj', 'Deepak', 'Nitin', 'Akash',
  'Sunita', 'Kavita', 'Anjali', 'Radhika', 'Swati', 'Vaishali', 'Shalini', 'Manisha', 'Ritu', 'Preeti',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Deshmukh', 'Kulkarni', 'Joshi', 'Iyer', 'Reddy', 'Nair', 'Menon',
  'Gupta', 'Agarwal', 'Mehta', 'Shah', 'Chauhan', 'Rathore', 'Singh', 'Yadav', 'Kumar', 'Naidu',
  'Pillai', 'Bhat', 'Kamat', 'Shenoy', 'Deshpande', 'Bhosale', 'Jadhav', 'Patil', 'More', 'Shinde',
  'Chavan', 'Gaikwad', 'Pawar', 'Sawant', 'Kadam', 'Salvi', 'Shetty', 'Hegde', 'Rao', 'Das',
  'Banerjee', 'Chatterjee', 'Mukherjee', 'Ghosh', 'Bose', 'Dutta', 'Sarkar', 'Mishra', 'Tiwari', 'Pandey',
];

const CITIES = [
  'Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Kolhapur', 'Solapur', 'Satara', 'Sangli',
  'Ahmednagar', 'Delhi', 'Gurugram', 'Noida', 'Bengaluru', 'Hyderabad', 'Chennai', 'Ahmedabad', 'Surat', 'Jaipur',
  'Indore', 'Bhopal', 'Lucknow', 'Kanpur', 'Patna', 'Ranchi', 'Bhubaneswar', 'Kolkata', 'Guwahati', 'Kochi',
  'Coimbatore', 'Visakhapatnam', 'Vadodara', 'Rajkot', 'Ludhiana', 'Chandigarh', 'Dehradun', 'Raipur', 'Jodhpur', 'Udaipur',
];

// Real RTO prefixes (state + district code)
const RTO_CODES = [
  'MH-12', 'MH-01', 'MH-02', 'MH-03', 'MH-04', 'MH-05', 'MH-09', 'MH-10', 'MH-11', 'MH-13',
  'MH-14', 'MH-15', 'MH-16', 'MH-20', 'MH-21', 'MH-31', 'DL-01', 'DL-8C', 'HR-26', 'HR-51',
  'UP-16', 'UP-32', 'UP-78', 'KA-01', 'KA-05', 'KA-51', 'TS-09', 'TS-10', 'AP-31', 'AP-39',
  'TN-01', 'TN-10', 'TN-38', 'GJ-01', 'GJ-05', 'GJ-06', 'GJ-18', 'RJ-14', 'RJ-19', 'RJ-27',
  'MP-09', 'MP-04', 'BR-01', 'JH-01', 'OD-02', 'WB-02', 'WB-06', 'AS-01', 'KL-01', 'KL-07',
  'PB-10', 'CH-01', 'UK-07', 'CG-04',
];

const VEHICLE_TYPES = [
  'Tata Prima 2830K Tipper', 'Ashok Leyland 2820 Tipper', 'BharatBenz 2823R Tipper',
  'Mahindra Blazo X 28 Tipper', 'Tata Signa 2823.K Tipper', 'JCB 3DX Backhoe Loader',
  'JCB 220LC Excavator', 'Hitachi ZX220LC Excavator', 'Volvo EC210 Excavator',
  'Case 770 EX Backhoe', 'ACE 14XW Hydra Crane', 'Escorts TRX 15 Crane',
  'Schwing Stetter S30 Concrete Mixer', 'AJAX Fiori Concrete Mixer', 'Putzknecht Transit Mixer',
  'Mahindra Bolero Pickup', 'Tata Ace Gold', 'Tata Yodha 1700', 'Isuzu D-Max',
  'Ashok Leyland Dost', 'Eicher Pro 3015 Truck', 'Tata LPT 1618 Truck',
  'BharatBenz 1917R Truck', 'Water Tanker 10 KL', 'Diesel Bowser 6 KL',
  'JCB VMT 860 Compactor', 'Case 845 Compactor', 'Bomag BW 212 Paver',
  'Wirtgen W 100 CF Milling Machine', 'Mahindra Scorpio N', 'Toyota Innova Crysta',
  'Force Traveller 17 Seater', 'Tata Starbus Staff Bus', 'Ambulance - Force Tempo',
  'Forklift Godrej 3 Ton', 'Caterpillar 120K Motor Grader', 'Komatsu D65 Dozer',
  'MAN CLA 49.300 Trailer', 'Tata 3718.K Trailer', 'Hyundai Robex 140 Excavator',
];

const COMPANY_BASES = [
  'Larsen & Toubro', 'Tata Projects', 'Shapoorji Pallonji', 'Afcons Infrastructure', 'GMR Infrastructure',
  'Adani Infra', 'Mahindra Lifespaces', 'Godrej Properties', 'DLF', 'National Highways Authority of India',
  'Maharashtra State Road Development Corp', 'Pune Municipal Corporation', 'Brihanmumbai Municipal Corporation',
  'IRCON International', 'RVNL', 'NBCC India', 'Hindustan Construction Co', 'JMC Projects',
  'KEC International', 'Sterling & Wilson', 'PNC Infratech', 'Dilip Buildcon', 'NCC Limited',
  'APCO Infratech', 'Sadbhav Engineering', 'Ashoka Buildcon', 'IRB Infrastructure', 'Gayatri Projects',
  'Megha Engineering', 'Ramky Infrastructure', 'Vishvaraj Infrastructure', 'Welspun Enterprises',
  'Ceigall India', 'HG Infra Engineering', 'Oriental Structural Engineers', 'Bharat Heavy Electricals',
  'Tata Consulting Engineers', 'AECOM India', 'WSP India', 'Aarvee Associates',
  'RITES Limited', 'Engineers India Limited', 'NBCC Services', 'Shapoorji Pallonji Engineering',
  'Tata Realty', 'Prestige Group', 'Sobha Limited', 'Brigade Group', 'Kolte-Patil Developers',
  'Puravankara', 'Sunteck Realty', 'Oberoi Realty', 'Lodha Group', 'Hiranandani Group',
];

const COMPANY_SUFFIXES = ['', ' Pvt Ltd', ' Limited', ' Infra', ' Constructions', ' Projects', ' Engineering'];

const PROJECT_TYPES = [
  'Metro Viaduct Package', 'Flyover Extension', 'Elevated Corridor', 'Ring Road Widening',
  'IT Park Phase', 'Residential Township', 'Industrial Warehouse', 'Water Treatment Plant',
  'Sewage Network Upgrade', 'Solar Rooftop Project', 'Transmission Line', 'Bridge Construction',
  'Hospital Block', 'Educational Campus', 'Commercial Tower', 'Logistics Hub',
  'Smart City Command Centre', 'Riverfront Development', 'Sports Complex', 'Bus Rapid Transit',
  'Airport Terminal Expansion', 'Railway Overbridge', 'Cement Plant Expansion', 'Data Centre Build',
  'Cold Storage Facility', 'Highway Strengthening', 'Canal Lining Work', 'Solid Waste Plant',
  'Skill Development Centre', 'Affordable Housing Cluster',
];

const SITE_AREAS = [
  'Hinjewadi', 'Kharadi', 'Baner', 'Wakad', 'Hadapsar', 'Magarpatta', 'Kothrud', 'Pimpri',
  'Chinchwad', 'Bhosari', 'Viman Nagar', 'Talegaon', 'Chakan', 'Ranjangaon', 'Shirwal',
  'Lonavala', 'Talaja', 'Panvel', 'Vashi', 'Airoli', 'Ghansoli', 'Koparkhairane',
];

const DEPARTMENTS = [
  'Operations', 'Projects', 'Engineering', 'Procurement', 'Finance & Accounts', 'Human Resources',
  'Health & Safety', 'Quality Assurance', 'Plant & Machinery', 'Fleet & Logistics', 'IT & Systems',
  'Business Development', 'Contracts & Legal', 'Planning & Scheduling', 'Stores & Inventory',
  'Survey & Design', 'Environment & Sustainability', 'Corporate Affairs', 'Audit & Compliance',
  'Sales & Marketing', 'Production', 'Maintenance', 'Administration', 'Training & Development',
];

const ROLES = [
  'Project Manager', 'Site Engineer', 'Senior Site Engineer', 'Project Engineer', 'Civil Engineer',
  'Structural Engineer', 'Quantity Surveyor', 'Planning Engineer', 'Safety Officer', 'Quality Inspector',
  'Supervisor', 'Foreman', 'Accounts Executive', 'Senior Accountant', 'Finance Manager',
  'HR Executive', 'HR Manager', 'Procurement Officer', 'Purchase Manager', 'Store Keeper',
  'Equipment Manager', 'Mechanic', 'Electrician', 'Welder', 'Fitter', 'Draughtsman', 'Surveyor',
  'Operations Head', 'General Manager', 'Deputy General Manager', 'Vice President - Projects',
  'Managing Director', 'Director - Operations', 'Tender Executive', 'Contracts Manager', 'Legal Advisor',
];

const MATERIALS = [
  'OPC 53 Grade Cement', 'PPC Cement', 'TMT Steel Bar Fe500D 12mm', 'TMT Steel Bar Fe500D 16mm',
  'TMT Steel Bar Fe500D 25mm', 'River Sand Grade II', 'Crushed Aggregate 20mm', 'Crushed Aggregate 10mm',
  'Ready Mix Concrete M25', 'Ready Mix Concrete M30', 'Ready Mix Concrete M40', 'AAC Block 600x200x100',
  'Solid Concrete Block 200mm', 'Red Clay Brick', 'PVC Pipe 110mm', 'PVC Pipe 160mm',
  'RCC Hume Pipe 600mm', 'Electrical Cable 4C x 16sqmm', 'Electrical Cable 3C x 6sqmm',
  'Copper Earthing Strip', 'MS Angle 50x50x5', 'MS Plate 10mm', 'MS Channel 100x50',
  'Structural Steel Section ISMB 200', 'Binding Wire 18 Gauge', 'Shuttering Plywood 12mm',
  'Steel Scaffolding Pipe', 'Waterproofing Membrane', 'Bitumen VG-30', 'Emulsion Paint Interior',
  'Weather Coat Exterior Paint', 'Ceramic Floor Tile 600x600', 'Vitrified Tile 800x800',
  'Sanitary Ware Set', 'CPVC Pipe 25mm', 'GI Pipe 50mm', 'Diesel HSD', 'Hydraulic Oil 68',
  'Engine Oil 15W40', 'Gear Oil EP90', 'Air Filter Element', 'Oil Filter Element',
  'Grease Lithium EP2', 'Safety Helmet', 'Reflective Jacket', 'Safety Harness', 'Fire Extinguisher ABC 6kg',
  'Cement Mortar Mix', 'Epoxy Grout', 'Plywood 19mm', 'MS Nails 3 inch', 'Welding Rod 3.15mm',
  'Abrasive Cutting Wheel', 'Diesel Generator 125 KVA', 'LED Flood Light 200W', 'Street Light Pole 9m',
];

const UNIT_BY_MATERIAL = (name: string): string => {
  if (/Cement|Sand|Aggregate|Block|Brick|Pipe|Tile|Paint|Bitumen|Concrete|Steel|Rod|Wire|Plate|Angle|Channel|Section|Plywood|Sheet/i.test(name)) return 'Units';
  if (/Diesel|Oil|Grease|Fluid/i.test(name)) return 'Litres';
  if (/Cable|Earthing/i.test(name)) return 'Meters';
  return 'Nos';
};

const WORK_TRADES = [
  'Mason', 'Carpenter', 'Bar Bender', 'Steel Fixer', 'Plumber', 'Electrician', 'Painter',
  'Welder', 'Fitter', 'Helper', 'Scaffolder', 'Concrete Vibrator Operator', 'Excavator Operator',
  'Crane Operator', 'Tipper Driver', 'Surveyor', 'Lab Technician', 'Safety Steward',
];

const CITIES_AND_STATES: Array<[string, string, string]> = [
  ['Pune', 'Maharashtra', '411057'], ['Mumbai', 'Maharashtra', '400001'], ['Nagpur', 'Maharashtra', '440001'],
  ['Nashik', 'Maharashtra', '422001'], ['Thane', 'Maharashtra', '400601'], ['Aurangabad', 'Maharashtra', '431001'],
  ['Kolhapur', 'Maharashtra', '416001'], ['Solapur', 'Maharashtra', '413001'], ['Satara', 'Maharashtra', '415001'],
  ['Sangli', 'Maharashtra', '416416'], ['Ahmednagar', 'Maharashtra', '414001'], ['Delhi', 'Delhi', '110001'],
  ['Gurugram', 'Haryana', '122001'], ['Noida', 'Uttar Pradesh', '201301'], ['Bengaluru', 'Karnataka', '560001'],
  ['Hyderabad', 'Telangana', '500001'], ['Chennai', 'Tamil Nadu', '600001'], ['Ahmedabad', 'Gujarat', '380001'],
  ['Surat', 'Gujarat', '395001'], ['Jaipur', 'Rajasthan', '302001'], ['Indore', 'Madhya Pradesh', '452001'],
  ['Bhopal', 'Madhya Pradesh', '462001'], ['Lucknow', 'Uttar Pradesh', '226001'], ['Kanpur', 'Uttar Pradesh', '208001'],
  ['Patna', 'Bihar', '800001'], ['Ranchi', 'Jharkhand', '834001'], ['Bhubaneswar', 'Odisha', '751001'],
  ['Kolkata', 'West Bengal', '700001'], ['Guwahati', 'Assam', '781001'], ['Kochi', 'Kerala', '682001'],
];

const cli = (r: Rng) => r.pick(COMPANY_BASES) + r.pick(COMPANY_SUFFIXES);
const person = (r: Rng) => `${r.pick(FIRST_NAMES)} ${r.pick(LAST_NAMES)}`;
const city = (r: Rng) => r.pick(CITIES);

const projectName = (r: Rng) => `${r.pick(COMPANY_BASES).split(' ')[0]} ${r.pick(PROJECT_TYPES)} - ${r.pick(SITE_AREAS)}`;

const gstin = (r: Rng) => {
  const states = ['27', '29', '07', '09', '33', '24', '36', '19', '23', '03', '22', '06', '32', '20', '21', '30', '10', '08'];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const L = () => letters[r.int(0, 25)];
  return `${r.pick(states)}${L()}${L()}${L()}${L()}${L()}${r.int(1000, 9999)}${L()}1Z${r.int(0, 9)}`;
};

const pan = (r: Rng) => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const L = () => letters[r.int(0, 25)];
  return `${L()}${L()}${L()}${L()}${L()}${r.int(1000, 9999)}${L()}`;
};

const phone = (r: Rng) => `+91 ${r.int(70, 99)}${r.int(10000000, 99999999)}`;
const emailFor = (name: string, domain: string) =>
  `${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@${domain}`;

// ---------------------------------------------------------------------------
// Table builders
// ---------------------------------------------------------------------------

export const DEMO_COUNTS = {
  profiles: 60,
  approved_users: 45,
  employees: 220,
  projects: 220,
  project_cost_breakdown: 260,
  project_risks: 220,
  planning_tasks: 240,
  inventory: 220,
  vendors: 220,
  vendor_performance: 220,
  purchase_orders: 220,
  fleet: 220,
  assets: 220,
  finance_transactions: 300,
  payroll_records: 220,
  leave_requests: 220,
  leave_balances: 220,
  contract_workers: 220,
  contract_attendance: 260,
  customers: 220,
  sales_leads: 220,
  crm_clients: 220,
  crm_leads: 240,
  crm_interactions: 240,
  crm_contracts: 220,
  tenders: 220,
  client_invoices: 220,
  general_ledger: 240,
  ledger_entries: 240,
  journal_entries: 220,
  journal_lines: 240,
  expense_approvals: 220,
  petty_cash: 220,
  fixed_expenses: 220,
  capital_expenditure: 220,
  material_requisitions: 220,
  procurement_rfqs: 220,
  vendor_quotes: 240,
  warehouse_stock: 240,
  grns: 220,
  client_contracts: 220,
  subcontracts: 220,
  running_bills: 220,
  variation_orders: 220,
  contract_claims: 220,
  security_deposits: 220,
  rate_analysis: 220,
  boq_estimates: 240,
  competitor_analysis: 220,
  bid_approvals: 220,
  tax_records: 220,
  okrs: 220,
  shift_assignments: 260,
  meetings: 220,
  employee_appraisals: 220,
  employee_promotions: 220,
  transfer_requests: 220,
  exit_clearances: 220,
  grievances: 220,
  internal_memos: 220,
  employee_documents: 220,
  production_logs: 220,
  workflows: 60,
  cost_centers: 40,
  budget_allocations: 48,
  budget_revision_logs: 40,
  departments: 24,
  shifts: 6,
  conference_rooms: 10,
  holidays: 25,
  cashflow_forecasts: 24,
  company_targets: 12,
  chart_of_accounts: 30,
  financial_years: 3,
  warehouses: 12,
  enterprise_settings: 1,
};

const builders: Record<string, () => DemoRow[]> = {
  profiles: () => {
    const r = makeRng('profiles');
    return Array.from({ length: DEMO_COUNTS.profiles }, (_, i) => {
      const name = person(r);
      return {
        id: demoId('profiles', i),
        full_name: name,
        role: i === 0 ? 'owner' : r.pick(['owner', 'director', 'accounting']),
        phone: phone(r),
        avatar_url: '',
        updated_at: isoTime(r.pastDate(1, 240)),
      };
    });
  },

  approved_users: () => {
    const r = makeRng('approved_users');
    return Array.from({ length: DEMO_COUNTS.approved_users }, (_, i) => {
      const name = i === 0 ? 'Arunima Dutta' : person(r);
      return {
        id: demoId('approved_users', i),
        email: i === 0 ? 'duttaarunima50@gmail.com' : emailFor(name, 'qitpes.in'),
        full_name: name,
        role: i === 0 ? 'owner' : r.pick(['accounting', 'accounting', 'director']),
        initial_password: '123456789',
        approved_by: demoId('profiles', 0),
        approved_at: isoTime(r.pastDate(30, 800)),
        is_active: i === 0 ? true : r.chance(0.86),
        created_at: isoTime(r.pastDate(30, 900)),
        updated_at: isoTime(r.pastDate(0, 60)),
      };
    });
  },

  departments: () => {
    const r = makeRng('departments');
    const profs = getDemoRows('profiles')!;
    return DEPARTMENTS.map((name, i) => ({
      id: demoId('departments', i),
      name,
      parent_id: null,
      head_id: profs[i % profs.length].id,
      budget_limit: r.money(2_000_000, 45_000_000),
      created_at: isoTime(r.pastDate(120, 1200)),
    }));
  },

  employees: () => {
    const r = makeRng('employees');
    return Array.from({ length: DEMO_COUNTS.employees }, (_, i) => {
      const name = person(r);
      const gross = r.money(18_000, 285_000);
      return {
        id: demoId('employees', i),
        employee_id: `QIT-${String(1001 + i)}`,
        full_name: name,
        department: r.pick(DEPARTMENTS),
        role: r.pick(ROLES),
        gross_salary: gross,
        monthly_deductions: Math.round(gross * (0.08 + r.next() * 0.12)),
        employee_status: r.chance(0.88) ? 'Active' : r.chance(0.6) ? 'On Leave' : 'Terminated',
        created_at: isoTime(r.pastDate(30, 1800)),
      };
    });
  },

  projects: () => {
    const r = makeRng('projects');
    const statuses = ['Active', 'Active', 'Active', 'On Hold', 'Completed', 'Planning'];
    return Array.from({ length: DEMO_COUNTS.projects }, (_, i) => {
      const contract = r.money(8_500_000, 1_450_000_000);
      const completion = r.int(2, 100);
      const start = r.pastDate(30, 1400);
      return {
        id: demoId('projects', i),
        name: projectName(r),
        client_name: cli(r),
        description: `${r.pick(PROJECT_TYPES)} executed for ${cli(r)} at ${r.pick(SITE_AREAS)}, ${city(r)}. Scope covers civil, structural and finishing works as per approved drawings.`,
        contract_value: contract,
        paid_amount: Math.round(contract * (completion / 100) * (0.72 + r.next() * 0.24)),
        budget: Math.round(contract * (0.78 + r.next() * 0.15)),
        estimated_cost: Math.round(contract * (0.7 + r.next() * 0.2)),
        completion_percentage: completion,
        status: statuses[r.int(0, statuses.length - 1)],
        start_date: iso(start),
        end_date: iso(addDays(start, r.int(180, 1100))),
        created_at: isoTime(start),
      };
    });
  },

  project_cost_breakdown: () => {
    const r = makeRng('project_cost_breakdown');
    const projects = getDemoRows('projects')!;
    const categories = ['Material', 'Labour', 'Machinery', 'Subcontract', 'Overheads'];
    return Array.from({ length: DEMO_COUNTS.project_cost_breakdown }, (_, i) => {
      const planned = r.money(500_000, 85_000_000);
      return {
        id: demoId('project_cost_breakdown', i),
        project_id: projects[i % projects.length].id,
        category: categories[i % categories.length],
        planned_amount: planned,
        actual_amount: Math.round(planned * (0.62 + r.next() * 0.5)),
        created_at: isoTime(r.pastDate(10, 500)),
      };
    });
  },

  project_risks: () => {
    const r = makeRng('project_risks');
    const projects = getDemoRows('projects')!;
    const risks = [
      'Monsoon delay in earthwork', 'Labour shortage during festival season', 'Steel price escalation',
      'Delay in utility shifting approval', 'Land acquisition dispute', 'Design revision pending from client',
      'Subcontractor cash-flow issue', 'Crane breakdown during girder launch', 'Statutory NOC delay',
      'Aggregate availability constraint', 'Site access restriction by local authority',
      'Quality rejection of RMC batch', 'Payment milestone delay', 'Heavy rain flooding site',
    ];
    return Array.from({ length: DEMO_COUNTS.project_risks }, (_, i) => {
      const level = r.int(1, 5);
      return {
        id: demoId('project_risks', i),
        project_id: projects[i % projects.length].id,
        risk_title: risks[i % risks.length],
        description: `${risks[i % risks.length]} observed at site. Impact assessment under review by the project control team.`,
        impact_level: level,
        probability_level: r.int(1, 5),
        mitigation_plan: 'Weekly review with client, buffer in schedule and alternate vendor identified.',
        status: r.chance(0.6) ? 'Open' : r.chance(0.6) ? 'Mitigated' : 'Closed',
        created_at: isoTime(r.pastDate(5, 600)),
      };
    });
  },

  planning_tasks: () => {
    const r = makeRng('planning_tasks');
    const projects = getDemoRows('projects')!;
    const tasks = [
      'Excavation and levelling', 'PCC bed preparation', 'Raft reinforcement', 'Foundation concreting',
      'Column shuttering', 'Slab reinforcement', 'Slab concreting', 'Blockwork - Level 1',
      'Plastering - internal', 'Waterproofing terrace', 'Electrical conduiting', 'Plumbing rough-in',
      'Structural steel erection', 'Girder launching', 'Deck slab casting', 'Approach road work',
      'Boundary wall construction', 'Landscaping and finishing', 'Snag rectification', 'Handover documentation',
    ];
    return Array.from({ length: DEMO_COUNTS.planning_tasks }, (_, i) => ({
      id: demoId('planning_tasks', i),
      task_name: tasks[i % tasks.length],
      project_id: projects[i % projects.length].id,
      due_date: iso(r.chance(0.6) ? r.futureDate(2, 120) : r.pastDate(1, 180)),
      owner_name: person(r),
      status: r.pick(['Pending', 'In Progress', 'Completed']),
      created_at: isoTime(r.pastDate(3, 400)),
    }));
  },

  inventory: () => {
    const r = makeRng('inventory');
    return Array.from({ length: DEMO_COUNTS.inventory }, (_, i) => {
      const name = i < MATERIALS.length ? MATERIALS[i] : `${r.pick(MATERIALS)} - ${r.pick(['Grade A', 'Grade B', 'Bulk Pack', 'Retail Pack'])} ${i + 1}`;
      const price = r.money(45, 285_000);
      return {
        id: demoId('inventory', i),
        sku: `SKU-${String(10001 + i)}`,
        name,
        stock_level: r.int(0, 9000),
        reorder_level: r.int(50, 1200),
        unit_price: price,
        unit: UNIT_BY_MATERIAL(name),
        cogs: r.money(20, 180_000),
        category: r.pick(['Construction', 'Material', 'Consumables', 'Mechanical', 'Electrical', 'Safety']),
        last_updated: isoTime(r.pastDate(0, 120)),
        created_at: isoTime(r.pastDate(30, 1400)),
      };
    });
  },

  vendors: () => {
    const r = makeRng('vendors');
    return Array.from({ length: DEMO_COUNTS.vendors }, (_, i) => {
      const name = `${COMPANY_BASES[i % COMPANY_BASES.length]} ${r.pick(['Traders', 'Enterprises', 'Industries', 'Distributors', 'Agency', 'Suppliers'])} - ${city(r)}`;
      const [c, state, pin] = r.pick(CITIES_AND_STATES);
      return {
        id: demoId('vendors', i),
        name: i < COMPANY_BASES.length ? COMPANY_BASES[i] : name,
        category: r.pick(['Material', 'Service', 'Subcontractor', 'Equipment']),
        gstin: gstin(r),
        pan: pan(r),
        contact_person: person(r),
        phone: phone(r),
        email: emailFor(`vendor${i + 1}`, 'qitpes-vendors.in'),
        office_address: `${r.int(1, 120)}, ${r.pick(['Industrial Estate', 'MIDC', 'Trade Centre', 'Business Park'])}, ${c}, ${state} ${pin}`,
        is_active: r.chance(0.92),
        bank_details: { bank: r.pick(['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank']), ifsc: `HDFC000${r.int(1000, 9999)}`, account: String(r.int(10000000000, 99999999999)) },
        created_at: isoTime(r.pastDate(60, 1800)),
      };
    });
  },

  vendor_performance: () => {
    const r = makeRng('vendor_performance');
    const vendors = getDemoRows('vendors')!;
    return vendors.map((v, i) => {
      const q = r.int(55, 100);
      const d = r.int(50, 100);
      const c = r.int(55, 100);
      return {
        id: demoId('vendor_performance', i),
        vendor_name: v.name,
        quality_score: q,
        delivery_score: d,
        cost_score: c,
        overall_rating: Math.round(((q + d + c) / 30) * 100) / 100,
        created_at: isoTime(r.pastDate(20, 700)),
      };
    });
  },

  purchase_orders: () => {
    const r = makeRng('purchase_orders');
    const vendors = getDemoRows('vendors')!;
    return Array.from({ length: DEMO_COUNTS.purchase_orders }, (_, i) => {
      const order = r.pastDate(2, 500);
      return {
        id: demoId('purchase_orders', i),
        po_number: `PO/2026/${String(10001 + i)}`,
        vendor_name: vendors[i % vendors.length].name,
        total_amount: r.money(25_000, 32_000_000),
        status: r.pick(['Draft', 'Pending', 'Approved', 'Shipped', 'Delivered', 'Delivered']),
        description: `${r.int(10, 900)} ${UNIT_BY_MATERIAL(r.pick(MATERIALS))} of ${r.pick(MATERIALS)} for ${r.pick(SITE_AREAS)} site`,
        delivery_date: iso(addDays(order, r.int(5, 45))),
        created_at: isoTime(order),
      };
    });
  },

  fleet: () => {
    const r = makeRng('fleet');
    const locations = SITE_AREAS.map((a) => `${a}, ${r.pick(['Pune', 'Mumbai', 'Nashik', 'Nagpur'])}`);
    return Array.from({ length: DEMO_COUNTS.fleet }, (_, i) => {
      const rto = RTO_CODES[i % RTO_CODES.length];
      const series = `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + (Math.floor(i / 26) % 26))}`;
      const vehicleNumber = `${rto} ${series} ${String(1000 + i).padStart(4, '0')}`;
      return {
        id: demoId('fleet', i),
        vehicle_number: vehicleNumber,
        vehicle_type: VEHICLE_TYPES[i % VEHICLE_TYPES.length],
        current_location: locations[i % locations.length],
        status: r.pick(['Ready', 'In Transit', 'Returned', 'Maintenance', 'Ready', 'In Transit']),
        last_work_details: `Assigned to ${r.pick(['earthwork', 'concreting', 'material haulage', 'girder lifting', 'dewatering', 'bituminous paving'])} at ${r.pick(SITE_AREAS)} site`,
        odometer_reading: r.int(1_200, 285_000),
        created_at: isoTime(r.pastDate(60, 1600)),
        updated_at: isoTime(r.pastDate(0, 20)),
      };
    });
  },

  assets: () => {
    const r = makeRng('assets');
    return Array.from({ length: DEMO_COUNTS.assets }, (_, i) => {
      const planned = r.int(120, 3200);
      return {
        id: demoId('assets', i),
        name: `${r.pick(['JCB 3DX', 'JCB 220LC', 'Hitachi ZX220', 'Volvo EC210', 'ACE Hydra 14T', 'Schwing Stetter S30', 'Bomag Compactor', 'Caterpillar Grader', 'Komatsu Dozer', 'Crane 50T', 'Batching Plant CP30', 'Transit Mixer'])} #${String(101 + i)}`,
        type: r.pick(['Earthmoving', 'Lifting', 'Concrete', 'Compaction', 'Road', 'Plant', 'Haulage']),
        status: r.pick(['Healthy', 'Healthy', 'Healthy', 'Under Maintenance', 'Idle']),
        site_location: `${r.pick(SITE_AREAS)}, ${city(r)}`,
        engine_hours: r.int(150, 18_500),
        fuel_level: r.int(12, 100),
        downtime_hours: r.int(0, 120),
        fuel_used: r.int(80, 5400),
        distance_traveled: r.int(0, 42_000),
        maintenance_cost: r.money(15_000, 2_400_000),
        actual_output: r.int(40, planned),
        planned_output: planned,
        purchase_cost: r.money(1_800_000, 48_000_000),
        last_telemetry: isoTime(r.pastDate(0, 3)),
        created_at: isoTime(r.pastDate(90, 1900)),
      };
    });
  },

  finance_transactions: () => {
    const r = makeRng('finance_transactions');
    const incomeCats = ['Client Billing', 'Milestone Payment', 'Retention Release', 'Scrap Sale', 'Equipment Hire', 'Consultancy Fee'];
    const expenseCats = ['Material Purchase', 'Labour Wages', 'Equipment Rental', 'Fuel & Diesel', 'Subcontractor Bill', 'Site Overheads', 'Transport', 'Statutory Dues', 'Office Expenses'];
    return Array.from({ length: DEMO_COUNTS.finance_transactions }, (_, i) => {
      const income = i % 5 < 2;
      const when = r.pastDate(0, 360);
      return {
        id: demoId('finance_transactions', i),
        type: income ? 'income' : 'expense',
        amount: r.money(income ? 180_000 : 25_000, income ? 48_000_000 : 8_500_000),
        category: r.pick(income ? incomeCats : expenseCats),
        transaction_date: isoTime(when),
        date: iso(when),
        is_paid: r.chance(0.82),
        due_date: isoTime(addDays(when, 30)),
        client_id: null,
        description: income
          ? `${r.pick(['RA Bill', 'Mobilisation Advance', 'Milestone Invoice'])} from ${cli(r)} for ${r.pick(SITE_AREAS)} project`
          : `${r.pick(MATERIALS)} procurement and site expenses at ${r.pick(SITE_AREAS)}`,
      };
    });
  },

  payroll_records: () => {
    const r = makeRng('payroll_records');
    const employees = getDemoRows('employees')!;
    const payMonth = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, '0')}`;
    return employees.map((e, i) => ({
      id: demoId('payroll_records', i),
      employee_id: e.id,
      pay_month: payMonth,
      gross_amount: e.gross_salary,
      deduction_amount: e.monthly_deductions,
      net_amount: Number(e.gross_salary) - Number(e.monthly_deductions),
      status: r.chance(0.9) ? 'Paid' : 'Pending',
      payment_date: isoTime(r.pastDate(0, 20)),
    }));
  },

  leave_requests: () => {
    const r = makeRng('leave_requests');
    const employees = getDemoRows('employees')!;
    return Array.from({ length: DEMO_COUNTS.leave_requests }, (_, i) => {
      const start = r.chance(0.45) ? daysAgo(r.int(0, 18)) : r.futureDate(1, 60);
      const days = r.int(1, 6);
      return {
        id: demoId('leave_requests', i),
        employee_id: employees[i % employees.length].id,
        leave_type: r.pick(['Casual Leave', 'Sick Leave', 'Earned Leave', 'Comp Off', 'Maternity Leave']),
        start_date: iso(start),
        end_date: iso(addDays(start, days - 1)),
        days,
        reason: r.pick(['Family function', 'Medical treatment', 'Personal work', 'Travel', 'Child care']),
        status: r.pick(['Approved', 'Approved', 'Pending', 'Rejected']),
        created_at: isoTime(r.pastDate(1, 90)),
      };
    });
  },

  leave_balances: () => {
    const r = makeRng('leave_balances');
    const employees = getDemoRows('employees')!;
    return employees.map((e, i) => ({
      id: demoId('leave_balances', i),
      employee_id: e.id,
      casual_leave_balance: r.int(0, 12),
      sick_leave_balance: r.int(0, 10),
      paid_leave_balance: r.int(0, 15),
      year: NOW.getFullYear(),
    }));
  },

  contract_workers: () => {
    const r = makeRng('contract_workers');
    return Array.from({ length: DEMO_COUNTS.contract_workers }, (_, i) => ({
      id: demoId('contract_workers', i),
      worker_id: `CW-${String(5001 + i)}`,
      full_name: person(r),
      trade: r.pick(WORK_TRADES),
      daily_wage: r.money(550, 1450),
      site_location: `${r.pick(SITE_AREAS)}, ${city(r)}`,
      status: r.chance(0.9) ? 'Active' : 'Inactive',
      created_at: isoTime(r.pastDate(20, 900)),
    }));
  },

  contract_attendance: () => {
    const r = makeRng('contract_attendance');
    const workers = getDemoRows('contract_workers')!;
    return Array.from({ length: DEMO_COUNTS.contract_attendance }, (_, i) => ({
      id: demoId('contract_attendance', i),
      worker_id: workers[i % workers.length].id,
      attendance_date: iso(daysAgo(r.int(0, 45))),
      status: r.chance(0.9) ? 'Present' : 'Absent',
    }));
  },

  customers: () => {
    const r = makeRng('customers');
    return Array.from({ length: DEMO_COUNTS.customers }, (_, i) => ({
      id: demoId('customers', i),
      name: cli(r),
      total_spend: r.money(500_000, 420_000_000),
      last_purchase: iso(r.pastDate(1, 300)),
      segment: r.pick(['Government', 'Private', 'Corporate', 'Retail']),
      created_at: isoTime(r.pastDate(90, 1800)),
    }));
  },

  sales_leads: () => {
    const r = makeRng('sales_leads');
    return Array.from({ length: DEMO_COUNTS.sales_leads }, (_, i) => ({
      id: demoId('sales_leads', i),
      client_name: cli(r),
      value: r.money(1_500_000, 380_000_000),
      stage: r.pick(['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed']),
      source: r.pick(['Referral', 'Tender Portal', 'Website', 'Cold Call', 'Existing Client', 'Exhibition']),
      created_at: isoTime(r.pastDate(1, 500)),
    }));
  },

  crm_clients: () => {
    const r = makeRng('crm_clients');
    return Array.from({ length: DEMO_COUNTS.crm_clients }, (_, i) => {
      const [c, state, pin] = r.pick(CITIES_AND_STATES);
      const name = person(r);
      return {
        id: demoId('crm_clients', i),
        name,
        company_name: cli(r),
        email: emailFor(name, `client${i + 1}.co.in`),
        phone: phone(r),
        address: `${r.int(1, 90)}, ${r.pick(['MG Road', 'FC Road', 'Baner Road', 'Link Road', 'Station Road'])}, ${c}, ${state} ${pin}`,
        category: r.pick(['Standard', 'Premium', 'VIP', 'Government']),
        status: r.pick(['Active', 'Active', 'Active', 'Inactive', 'Lead']),
        created_at: isoTime(r.pastDate(10, 1500)),
      };
    });
  },

  crm_leads: () => {
    const r = makeRng('crm_leads');
    const clients = getDemoRows('crm_clients')!;
    const profs = getDemoRows('profiles')!;
    return Array.from({ length: DEMO_COUNTS.crm_leads }, (_, i) => ({
      id: demoId('crm_leads', i),
      client_id: clients[i % clients.length].id,
      title: `${r.pick(['Turnkey', 'EPC', 'Design & Build', 'Civil Works', 'O&M'])} opportunity - ${r.pick(SITE_AREAS)}`,
      description: `${r.pick(PROJECT_TYPES)} proposed at ${r.pick(SITE_AREAS)}, ${city(r)}. Awaiting technical presentation.`,
      value: r.money(2_500_000, 620_000_000),
      source: r.pick(['Referral', 'Tender', 'Website', 'Relationship', 'Cold Outreach']),
      stage: r.pick(['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost']),
      probability: r.int(5, 95),
      assigned_to: profs[i % profs.length].id,
      expected_closing: iso(r.futureDate(5, 180)),
      created_at: isoTime(r.pastDate(2, 420)),
    }));
  },

  crm_interactions: () => {
    const r = makeRng('crm_interactions');
    const leads = getDemoRows('crm_leads')!;
    const clients = getDemoRows('crm_clients')!;
    const profs = getDemoRows('profiles')!;
    return Array.from({ length: DEMO_COUNTS.crm_interactions }, (_, i) => ({
      id: demoId('crm_interactions', i),
      lead_id: leads[i % leads.length].id,
      client_id: clients[i % clients.length].id,
      interaction_type: r.pick(['Call', 'Email', 'Meeting', 'Note']),
      details: r.pick([
        'Discussed BOQ scope and tentative timeline with client team.',
        'Shared updated commercial proposal and requested clarification.',
        'Site visit completed; client requested revised layout.',
        'Follow-up on pending approval from client procurement head.',
        'Negotiated payment terms; legal review in progress.',
      ]),
      interaction_date: isoTime(r.pastDate(0, 240)),
      logged_by: profs[i % profs.length].id,
    }));
  },

  crm_contracts: () => {
    const r = makeRng('crm_contracts');
    const clients = getDemoRows('crm_clients')!;
    return Array.from({ length: DEMO_COUNTS.crm_contracts }, (_, i) => {
      const start = r.pastDate(30, 900);
      return {
        id: demoId('crm_contracts', i),
        client_id: clients[i % clients.length].id,
        contract_number: `CRM/CT/2026/${String(1001 + i)}`,
        title: `${r.pick(PROJECT_TYPES)} Agreement - ${r.pick(SITE_AREAS)}`,
        start_date: iso(start),
        end_date: iso(addDays(start, r.int(180, 1200))),
        value: r.money(5_000_000, 750_000_000),
        status: r.pick(['Draft', 'active', 'active', 'expired', 'terminated']),
        file_url: '',
        created_at: isoTime(start),
      };
    });
  },

  tenders: () => {
    const r = makeRng('tenders');
    const authorities = ['NHAI', 'MSRDC', 'PWD Maharashtra', 'Pune Municipal Corporation', 'MMRDA', 'CIDCO', 'IRCON', 'RVNL', 'Metro Rail Corporation', 'Smart City Ltd', 'Water Resources Dept', 'Public Works Dept'];
    return Array.from({ length: DEMO_COUNTS.tenders }, (_, i) => {
      const value = r.money(25_000_000, 2_800_000_000);
      return {
        id: demoId('tenders', i),
        tender_no: `${r.pick(['NHAI', 'MSRDC', 'PWD', 'PMC', 'MMRDA'])}/2026/${String(1001 + i)}`,
        authority_name: r.pick(authorities),
        description: `${r.pick(PROJECT_TYPES)} at ${r.pick(SITE_AREAS)}, ${city(r)}. Estimated ${r.pick(['24', '30', '36', '48'])} months completion.`,
        estimated_value: value,
        bid_submission_date: iso(r.chance(0.5) ? r.futureDate(3, 90) : r.pastDate(1, 120)),
        technical_status: r.pick(['Preparation', 'Submitted', 'Qualified', 'Disqualified']),
        financial_status: r.pick(['Pending', 'L1', 'L2', 'L3', 'Lost']),
        probability_percentage: r.int(10, 95),
        assigned_manager: getDemoRows('profiles')![i % 60].id,
        boq_status: r.pick(['Draft', 'Estimated', 'Finalized']),
        bid_validity_days: r.pick([90, 120, 150, 180]),
        emd_amount: Math.round(value * 0.02),
        created_at: isoTime(r.pastDate(5, 500)),
      };
    });
  },

  client_invoices: () => {
    const r = makeRng('client_invoices');
    const projects = getDemoRows('projects')!;
    return Array.from({ length: DEMO_COUNTS.client_invoices }, (_, i) => {
      const taxable = r.money(250_000, 95_000_000);
      const gstPct = r.pick([5, 12, 18, 18, 28]);
      const gstAmount = Math.round((taxable * gstPct) / 100);
      const issued = r.pastDate(2, 330);
      return {
        id: demoId('client_invoices', i),
        invoice_number: `INV/2026/${String(10001 + i)}`,
        project_id: projects[i % projects.length].id,
        client_name: projects[i % projects.length].client_name,
        invoice_date: iso(issued),
        due_date: iso(addDays(issued, 30)),
        taxable_amount: taxable,
        gst_percentage: gstPct,
        gst_amount: gstAmount,
        total_amount: taxable + gstAmount,
        status: r.pick(['Draft', 'Sent', 'Paid', 'Paid', 'Overdue', 'Cancelled']),
        gst_type: r.pick(['IGST', 'CGST/SGST']),
        created_at: isoTime(issued),
      };
    });
  },

  general_ledger: () => {
    const r = makeRng('general_ledger');
    const accounts = ['HDFC Main Bank A/c', 'Accounts Receivable', 'Accounts Payable', 'Sales Revenue', 'Employee Salaries', 'Power & Fuel', 'Site Rent', 'Material Purchase', 'GST Payable', 'TDS Payable'];
    return Array.from({ length: DEMO_COUNTS.general_ledger }, (_, i) => ({
      id: demoId('general_ledger', i),
      transaction_date: iso(r.pastDate(0, 340)),
      account_name: r.pick(accounts),
      description: `${r.pick(['Invoice', 'Vendor bill', 'Salary run', 'Bank charge', 'GST remittance', 'Site petty expense'])} - ${r.pick(SITE_AREAS)}`,
      debit: r.chance(0.5) ? r.money(5_000, 6_500_000) : 0,
      credit: r.chance(0.5) ? r.money(5_000, 6_500_000) : 0,
      reference_type: r.pick(['Invoice', 'Bill', 'Salaries', 'Journal', 'Payment']),
      reference_id: null,
      cost_center_id: null,
      created_at: isoTime(r.pastDate(0, 340)),
    }));
  },

  ledger_entries: () => {
    const r = makeRng('ledger_entries');
    const accounts = ['HDFC Main Bank A/c', 'Accounts Receivable', 'Accounts Payable', 'Sales Revenue', 'Material Purchase', 'Labour Wages', 'Plant Hire', 'GST Payable'];
    return Array.from({ length: DEMO_COUNTS.ledger_entries }, (_, i) => {
      const debit = r.chance(0.5);
      const amount = r.money(2_000, 4_500_000);
      return {
        id: demoId('ledger_entries', i),
        account_name: r.pick(accounts),
        reference: `${r.pick(['JV', 'BP', 'BR', 'CR', 'DR'])}/2026/${String(1000 + i)}`,
        debit: debit ? amount : 0,
        credit: debit ? 0 : amount,
        entry_type: r.pick(['Manual', 'Auto', 'Closing']),
        transaction_id: null,
        created_at: isoTime(r.pastDate(0, 330)),
      };
    });
  },

  chart_of_accounts: () => {
    const r = makeRng('chart_of_accounts');
    const base = [
      ['1000', 'HDFC Main Bank A/c', 'Asset', 'Current Asset', 32_500_000],
      ['1001', 'Office Petty Cash', 'Asset', 'Current Asset', 75_000],
      ['1200', 'Accounts Receivable', 'Asset', 'Current Asset', 18_400_000],
      ['1500', 'Fixed Assets - Machinery', 'Asset', 'Fixed Asset', 92_000_000],
      ['2000', 'Accounts Payable', 'Liability', 'Current Liability', 12_800_000],
      ['2100', 'GST Payable', 'Liability', 'Current Liability', 1_950_000],
      ['2200', 'TDS Payable', 'Liability', 'Current Liability', 685_000],
      ['3000', 'Equity Capital', 'Equity', 'Equity', 120_000_000],
      ['3100', 'Retained Earnings', 'Equity', 'Equity', 46_500_000],
      ['4000', 'Sales Revenue', 'Income', 'Operating Income', 285_000_000],
      ['4100', 'Service Income', 'Income', 'Operating Income', 24_600_000],
      ['5000', 'Employee Salaries', 'Expense', 'Operating Expense', 68_000_000],
      ['5100', 'Power & Fuel', 'Expense', 'Operating Expense', 14_200_000],
      ['5200', 'Site Rent', 'Expense', 'Operating Expense', 6_400_000],
      ['5300', 'Global Travel Exp', 'Expense', 'General Expense', 2_850_000],
    ] as const;
    const extra = [
      ['1100', 'ICICI Bank A/c', 'Asset', 'Current Asset'],
      ['1300', 'Advance to Suppliers', 'Asset', 'Current Asset'],
      ['1400', 'Prepaid Expenses', 'Asset', 'Current Asset'],
      ['1600', 'Furniture & Fixtures', 'Asset', 'Fixed Asset'],
      ['1700', 'Vehicles & Fleet', 'Asset', 'Fixed Asset'],
      ['1800', 'Security Deposits', 'Asset', 'Current Asset'],
      ['2300', 'Provident Fund Payable', 'Liability', 'Current Liability'],
      ['2400', 'ESI Payable', 'Liability', 'Current Liability'],
      ['2500', 'Contractor Retention', 'Liability', 'Current Liability'],
      ['3200', 'Reserves & Surplus', 'Equity', 'Equity'],
      ['4200', 'Scrap Sale Income', 'Income', 'Other Income'],
      ['4300', 'Equipment Hire Income', 'Income', 'Operating Income'],
      ['5100', 'Site Electricity', 'Expense', 'Operating Expense'],
      ['5400', 'Subcontractor Charges', 'Expense', 'Operating Expense'],
      ['5500', 'Repair & Maintenance', 'Expense', 'Operating Expense'],
    ] as const;
    return Array.from({ length: DEMO_COUNTS.chart_of_accounts }, (_, i) => {
      const item = i < base.length ? base[i] : extra[i - base.length];
      return {
        id: demoId('chart_of_accounts', i),
        code: item[0],
        name: item[1],
        type: item[2],
        category: item[3],
        balance: i < base.length ? base[i][4] : r.money(100_000, 25_000_000),
        created_at: isoTime(r.pastDate(200, 1200)),
      };
    });
  },

  financial_years: () => {
    const r = makeRng('financial_years');
    return [
      { id: demoId('financial_years', 0), year_label: 'FY 2024-25', start_date: '2024-04-01', end_date: '2025-03-31', is_closed: true, closed_at: isoTime(new Date('2025-05-15')), created_at: isoTime(r.pastDate(900, 1200)) },
      { id: demoId('financial_years', 1), year_label: 'FY 2025-26', start_date: '2025-04-01', end_date: '2026-03-31', is_closed: false, closed_at: null, created_at: isoTime(r.pastDate(600, 800)) },
      { id: demoId('financial_years', 2), year_label: 'FY 2026-27', start_date: '2026-04-01', end_date: '2027-03-31', is_closed: false, closed_at: null, created_at: isoTime(r.pastDate(200, 400)) },
    ];
  },

  journal_entries: () => {
    const r = makeRng('journal_entries');
    return Array.from({ length: DEMO_COUNTS.journal_entries }, (_, i) => {
      const when = r.pastDate(0, 330);
      return {
        id: demoId('journal_entries', i),
        reference_no: `JV/2026/${String(10001 + i)}`,
        date: iso(when),
        description: r.pick([
          'Client RA bill booking', 'Material purchase booking', 'Salary and wages journal',
          'Depreciation for the month', 'GST adjustment entry', 'Subcontractor bill booking',
          'Petty cash reimbursement', 'Bank charges and interest',
        ]),
        financial_year_id: demoId('financial_years', 1),
        status: r.pick(['Posted', 'Posted', 'Posted', 'Draft', 'Void']),
        created_at: isoTime(when),
      };
    });
  },

  journal_lines: () => {
    const r = makeRng('journal_lines');
    const entries = getDemoRows('journal_entries')!;
    const accounts = getDemoRows('chart_of_accounts')!;
    return Array.from({ length: DEMO_COUNTS.journal_lines }, (_, i) => {
      const debit = r.chance(0.5);
      const amount = r.money(5_000, 8_500_000);
      return {
        id: demoId('journal_lines', i),
        journal_id: entries[i % entries.length].id,
        account_id: accounts[i % accounts.length].id,
        debit: debit ? amount : 0,
        credit: debit ? 0 : amount,
        is_reconciled: r.chance(0.7),
        created_at: isoTime(r.pastDate(0, 330)),
      };
    });
  },

  expense_approvals: () => {
    const r = makeRng('expense_approvals');
    const profs = getDemoRows('profiles')!;
    return Array.from({ length: DEMO_COUNTS.expense_approvals }, (_, i) => ({
      id: demoId('expense_approvals', i),
      description: `${r.pick(['Site office supplies', 'Diesel top-up', 'Labour refreshment', 'Equipment spare parts', 'Travel reimbursement', 'Safety consumables'])} - ${r.pick(SITE_AREAS)}`,
      amount: r.money(1_500, 850_000),
      department: r.pick(DEPARTMENTS),
      requested_by: profs[i % profs.length].id,
      status: r.pick(['Pending', 'Approved', 'Approved', 'Rejected']),
      approved_by: profs[(i + 3) % profs.length].id,
      created_at: isoTime(r.pastDate(0, 180)),
    }));
  },

  petty_cash: () => {
    const r = makeRng('petty_cash');
    const profs = getDemoRows('profiles')!;
    return Array.from({ length: DEMO_COUNTS.petty_cash }, (_, i) => ({
      id: demoId('petty_cash', i),
      description: `${r.pick(['Courier charges', 'Stationery', 'Tea and snacks', 'Local conveyance', 'Site guest hospitality', 'Printing'])} - ${r.pick(SITE_AREAS)}`,
      amount: r.money(100, 12_500),
      date: iso(r.pastDate(0, 240)),
      handler_id: profs[i % profs.length].id,
      created_at: isoTime(r.pastDate(0, 240)),
    }));
  },

  fixed_expenses: () => {
    const r = makeRng('fixed_expenses');
    const items = ['Head office rent', 'Site office rent', 'Internet & telecom', 'Software subscriptions', 'Electricity - office', 'Water charges', 'Security services', 'Housekeeping', 'Insurance premium', 'Vehicle lease rental'];
    return Array.from({ length: DEMO_COUNTS.fixed_expenses }, (_, i) => ({
      id: demoId('fixed_expenses', i),
      name: `${items[i % items.length]} - ${r.pick(SITE_AREAS)}`,
      amount: r.money(8_000, 1_200_000),
      frequency: r.pick(['Monthly', 'Quarterly', 'Annual']),
      due_day: r.int(1, 28),
      created_at: isoTime(r.pastDate(60, 900)),
    }));
  },

  capital_expenditure: () => {
    const r = makeRng('capital_expenditure');
    return Array.from({ length: DEMO_COUNTS.capital_expenditure }, (_, i) => ({
      id: demoId('capital_expenditure', i),
      asset_name: `${r.pick(['Tower Crane', 'Batching Plant', 'Excavator', 'Transit Mixer', 'Paver', 'Generator', 'Survey Equipment', 'Site Vehicle', 'Scaffolding System', 'IT Hardware'])} - ${r.pick(['New', 'Replacement', 'Expansion'])} #${i + 1}`,
      amount: r.money(250_000, 42_000_000),
      category: r.pick(['Plant & Machinery', 'Vehicles', 'IT Equipment', 'Site Infrastructure', 'Furniture']),
      purchase_date: iso(r.pastDate(10, 1100)),
      status: r.pick(['Purchased', 'Purchased', 'Under Approval', 'Delivered', 'Cancelled']),
      created_at: isoTime(r.pastDate(10, 1100)),
    }));
  },

  budget_allocations: () => {
    const r = makeRng('budget_allocations');
    return Array.from({ length: DEMO_COUNTS.budget_allocations }, (_, i) => {
      const dept = `${DEPARTMENTS[i % DEPARTMENTS.length]}${i >= DEPARTMENTS.length ? ` - Zone ${Math.floor(i / DEPARTMENTS.length) + 1}` : ''}`;
      const allocated = r.money(1_500_000, 65_000_000);
      return {
        id: demoId('budget_allocations', i),
        department: dept,
        fiscal_year: i % 2 === 0 ? 2026 : 2027,
        allocated_amount: allocated,
        spent_amount: Math.round(allocated * (0.35 + r.next() * 0.6)),
        created_at: isoTime(r.pastDate(30, 400)),
      };
    });
  },

  budget_revision_logs: () => {
    const r = makeRng('budget_revision_logs');
    const budgets = getDemoRows('budget_allocations')!;
    return Array.from({ length: DEMO_COUNTS.budget_revision_logs }, (_, i) => {
      const oldAmount = r.money(1_000_000, 40_000_000);
      return {
        id: demoId('budget_revision_logs', i),
        budget_id: budgets[i % budgets.length].id,
        old_amount: oldAmount,
        new_amount: Math.round(oldAmount * (1.05 + r.next() * 0.35)),
        reason: r.pick(['Scope increase', 'Price escalation', 'Additional site requirement', 'Cost optimisation', 'Client change order']),
        revised_by: getDemoRows('profiles')![i % 60].id,
        created_at: isoTime(r.pastDate(5, 240)),
      };
    });
  },

  cost_centers: () => {
    const r = makeRng('cost_centers');
    const profs = getDemoRows('profiles')!;
    return Array.from({ length: DEMO_COUNTS.cost_centers }, (_, i) => {
      const area = SITE_AREAS[i % SITE_AREAS.length];
      const budget = r.money(2_500_000, 120_000_000);
      return {
        id: demoId('cost_centers', i),
        name: `${area} Site Cost Center ${i + 1}`,
        code: `CC-${String(1001 + i)}`,
        description: `Cost tracking for ${area} operations and site overheads.`,
        manager_id: profs[i % profs.length].id,
        budget: budget,
        spent: Math.round(budget * (0.25 + r.next() * 0.7)),
        created_at: isoTime(r.pastDate(30, 900)),
      };
    });
  },

  material_requisitions: () => {
    const r = makeRng('material_requisitions');
    const projects = getDemoRows('projects')!;
    const profs = getDemoRows('profiles')!;
    return Array.from({ length: DEMO_COUNTS.material_requisitions }, (_, i) => ({
      id: demoId('material_requisitions', i),
      mr_number: `MR/2026/${String(10001 + i)}`,
      project_id: projects[i % projects.length].id,
      item_name: `${r.pick(MATERIALS)} - ${r.pick(['Lot 1', 'Lot 2', 'Bulk', 'Phase I', 'Phase II'])}`,
      quantity: r.int(10, 5000),
      unit: r.pick(['Bags', 'MT', 'Cum', 'Nos', 'Ltr', 'Sqm']),
      priority: r.pick(['Low', 'Normal', 'Normal', 'Urgent', 'Critical']),
      status: r.pick(['Pending', 'Approved', 'RFQ Sent', 'PO Issued', 'Fulfilled', 'Rejected']),
      requested_by: profs[i % profs.length].id,
      created_at: isoTime(r.pastDate(0, 240)),
    }));
  },

  procurement_rfqs: () => {
    const r = makeRng('procurement_rfqs');
    const mrs = getDemoRows('material_requisitions')!;
    const vendors = getDemoRows('vendors')!;
    return Array.from({ length: DEMO_COUNTS.procurement_rfqs }, (_, i) => ({
      id: demoId('procurement_rfqs', i),
      rfq_number: `RFQ/2026/${String(10001 + i)}`,
      mr_id: mrs[i % mrs.length].id,
      vendor_ids: [vendors[i % vendors.length].id, vendors[(i + 1) % vendors.length].id],
      deadline: iso(r.futureDate(1, 30)),
      status: r.pick(['Draft', 'Sent', 'Comparison', 'Closed']),
      created_at: isoTime(r.pastDate(2, 200)),
    }));
  },

  vendor_quotes: () => {
    const r = makeRng('vendor_quotes');
    const rfqs = getDemoRows('procurement_rfqs')!;
    const vendors = getDemoRows('vendors')!;
    return Array.from({ length: DEMO_COUNTS.vendor_quotes }, (_, i) => ({
      id: demoId('vendor_quotes', i),
      rfq_id: rfqs[i % rfqs.length].id,
      vendor_name: vendors[i % vendors.length].name,
      quoted_rate: r.money(400, 4_500_000),
      lead_time_days: r.int(2, 45),
      payment_terms: r.pick(['30 Days Credit', '15 Days Credit', 'Advance 50%', 'Against Delivery', '60 Days Credit']),
      is_shortlisted: r.chance(0.25),
      created_at: isoTime(r.pastDate(1, 200)),
    }));
  },

  warehouses: () => {
    const r = makeRng('warehouses');
    const profs = getDemoRows('profiles')!;
    return Array.from({ length: DEMO_COUNTS.warehouses }, (_, i) => {
      const [c, state] = r.pick(CITIES_AND_STATES);
      return {
        id: demoId('warehouses', i),
        name: `${c} Central Store ${i + 1}`,
        location: `${r.pick(['MIDC', 'Industrial Area', 'Logistics Park'])}, ${c}, ${state}`,
        manager_id: profs[i % profs.length].id,
        is_active: r.chance(0.9),
        created_at: isoTime(r.pastDate(60, 900)),
      };
    });
  },

  warehouse_stock: () => {
    const r = makeRng('warehouse_stock');
    const wh = getDemoRows('warehouses')!;
    const inv = getDemoRows('inventory')!;
    return Array.from({ length: DEMO_COUNTS.warehouse_stock }, (_, i) => ({
      id: demoId('warehouse_stock', i),
      warehouse_id: wh[i % wh.length].id,
      inventory_id: inv[i % inv.length].id,
      quantity: r.int(0, 6500),
      last_inward_date: isoTime(r.pastDate(0, 120)),
    }));
  },

  grns: () => {
    const r = makeRng('grns');
    const pos = getDemoRows('purchase_orders')!;
    const wh = getDemoRows('warehouses')!;
    const profs = getDemoRows('profiles')!;
    return Array.from({ length: DEMO_COUNTS.grns }, (_, i) => ({
      id: demoId('grns', i),
      grn_number: `GRN/2026/${String(10001 + i)}`,
      po_id: pos[i % pos.length].id,
      warehouse_id: wh[i % wh.length].id,
      received_date: iso(r.pastDate(1, 300)),
      received_by: profs[i % profs.length].id,
      inspection_status: r.pick(['Pending', 'Pass', 'Pass', 'Fail', 'Partial']),
      remarks: r.pick(['Received in good condition', 'Minor packing damage', 'Quantity verified', 'Pending third-party inspection', 'Short supply noted']),
      created_at: isoTime(r.pastDate(1, 300)),
    }));
  },

  client_contracts: () => {
    const r = makeRng('client_contracts');
    const projects = getDemoRows('projects')!;
    return Array.from({ length: DEMO_COUNTS.client_contracts }, (_, i) => {
      const value = Number(projects[i % projects.length].contract_value);
      return {
        id: demoId('client_contracts', i),
        project_id: projects[i % projects.length].id,
        contract_number: `QIT/CC/2026/${String(1001 + i)}`,
        contract_date: iso(r.pastDate(30, 900)),
        total_value: value,
        scope_of_work: `Civil, structural and finishing works for ${projects[i % projects.length].name}.`,
        retention_percentage: r.pick([5, 7.5, 10]),
        performance_guarantee: Math.round(value * 0.03),
        status: r.pick(['Active', 'Active', 'Active', 'Closed', 'Suspended']),
        created_at: isoTime(r.pastDate(30, 900)),
      };
    });
  },

  subcontracts: () => {
    const r = makeRng('subcontracts');
    const projects = getDemoRows('projects')!;
    const vendors = getDemoRows('vendors')!;
    return Array.from({ length: DEMO_COUNTS.subcontracts }, (_, i) => ({
      id: demoId('subcontracts', i),
      project_id: projects[i % projects.length].id,
      subcontractor_name: vendors[i % vendors.length].name,
      work_order_number: `WO/2026/${String(10001 + i)}`,
      wo_date: iso(r.pastDate(20, 700)),
      wo_value: r.money(500_000, 85_000_000),
      service_tax_applicable: r.chance(0.7),
      retention_percentage: r.pick([5, 7.5, 10]),
      status: r.pick(['Open', 'Open', 'Completed', 'Cancelled']),
      created_at: isoTime(r.pastDate(20, 700)),
    }));
  },

  running_bills: () => {
    const r = makeRng('running_bills');
    const contracts = getDemoRows('client_contracts')!;
    return Array.from({ length: DEMO_COUNTS.running_bills }, (_, i) => {
      const gross = r.money(300_000, 95_000_000);
      const retention = Math.round(gross * 0.05);
      const tds = Math.round(gross * 0.02);
      const other = Math.round(gross * 0.01);
      return {
        id: demoId('running_bills', i),
        contract_type: r.pick(['Client', 'Subcontractor']),
        contract_id: contracts[i % contracts.length].id,
        bill_number: `RA/2026/${String(1001 + i)}`,
        bill_date: iso(r.pastDate(5, 330)),
        gross_amount: gross,
        retention_deduction: retention,
        tds_deduction: tds,
        other_deductions: other,
        net_payable: gross - retention - tds - other,
        payment_status: r.pick(['Pending', 'Certified', 'Paid', 'Paid']),
        created_at: isoTime(r.pastDate(5, 330)),
      };
    });
  },

  variation_orders: () => {
    const r = makeRng('variation_orders');
    const contracts = getDemoRows('client_contracts')!;
    return Array.from({ length: DEMO_COUNTS.variation_orders }, (_, i) => ({
      id: demoId('variation_orders', i),
      reference_id: contracts[i % contracts.length].id,
      vo_number: `VO/2026/${String(1001 + i)}`,
      vo_date: iso(r.pastDate(5, 260)),
      description: r.pick(['Additional retaining wall', 'Extra excavation in hard rock', 'Upgraded facade specification', 'Extra utility shifting', 'Additional parking level', 'Revised landscaping scope']),
      impact_value: r.money(50_000, 18_000_000),
      approval_status: r.pick(['Draft', 'Submitted', 'Approved', 'Rejected']),
      created_at: isoTime(r.pastDate(5, 260)),
    }));
  },

  contract_claims: () => {
    const r = makeRng('contract_claims');
    const contracts = getDemoRows('client_contracts')!;
    return Array.from({ length: DEMO_COUNTS.contract_claims }, (_, i) => {
      const value = r.money(100_000, 25_000_000);
      return {
        id: demoId('contract_claims', i),
        reference_id: contracts[i % contracts.length].id,
        claim_number: `CLM/2026/${String(1001 + i)}`,
        claim_type: r.pick(['EOT', 'Extra Item', 'Price Escalation', 'Direct Loss']),
        value,
        justification: r.pick(['Delay due to client drawing approval', 'Additional scope executed on instruction', 'Steel price index escalation', 'Idle machinery due to site access']),
        status: r.pick(['Submitted', 'In negotiation', 'Settled', 'Rejected']),
        settled_value: Math.round(value * (0.4 + r.next() * 0.5)),
        created_at: isoTime(r.pastDate(5, 330)),
      };
    });
  },

  security_deposits: () => {
    const r = makeRng('security_deposits');
    const contracts = getDemoRows('client_contracts')!;
    return Array.from({ length: DEMO_COUNTS.security_deposits }, (_, i) => ({
      id: demoId('security_deposits', i),
      contract_id: contracts[i % contracts.length].id,
      deposit_type: r.pick(['EMD', 'Security Deposit', 'Retention Money', 'Performance Bond']),
      amount: r.money(100_000, 32_000_000),
      release_date: iso(r.pastDate(1, 120)),
      is_released: r.chance(0.35),
      remarks: r.pick(['Held with client', 'Released after defect liability', 'Bank guarantee submitted', 'Retention released on completion']),
      created_at: isoTime(r.pastDate(30, 900)),
    }));
  },

  company_targets: () => {
    const r = makeRng('company_targets');
    return Array.from({ length: DEMO_COUNTS.company_targets }, (_, i) => {
      const start = new Date(NOW.getFullYear(), NOW.getMonth() - (11 - i), 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      return {
        id: demoId('company_targets', i),
        period_start: iso(start),
        period_end: iso(end),
        revenue_target: r.money(80_000_000, 260_000_000),
        profit_target: r.money(8_000_000, 42_000_000),
        new_contracts_target: r.int(2, 9),
        status: r.pick(['Active', 'Achieved', 'Missed']),
        created_at: isoTime(start),
      };
    });
  },

  rate_analysis: () => {
    const r = makeRng('rate_analysis');
    return Array.from({ length: DEMO_COUNTS.rate_analysis }, (_, i) => {
      const material = r.money(50, 185_000);
      const labor = r.money(35, 42_000);
      const markup = r.pick([10, 12.5, 15, 18, 20]);
      return {
        id: demoId('rate_analysis', i),
        item_description: `${MATERIALS[i % MATERIALS.length]} - ${r.pick(['supply only', 'supply and install', 'with labour', 'including taxes'])}`,
        unit: r.pick(['Nos', 'Bags', 'MT', 'Cum', 'Sqm', 'Ltr', 'Meter']),
        material_cost: material,
        labor_cost: labor,
        markup_percentage: markup,
        total_rate: Math.round((material + labor) * (1 + markup / 100) * 100) / 100,
        last_updated: isoTime(r.pastDate(1, 180)),
      };
    });
  },

  boq_estimates: () => {
    const r = makeRng('boq_estimates');
    const tenders = getDemoRows('tenders')!;
    const rates = getDemoRows('rate_analysis')!;
    return Array.from({ length: DEMO_COUNTS.boq_estimates }, (_, i) => {
      const qty = r.int(10, 25_000);
      const rate = Number(rates[i % rates.length].total_rate);
      return {
        id: demoId('boq_estimates', i),
        tender_id: tenders[i % tenders.length].id,
        item_id: rates[i % rates.length].id,
        quantity: qty,
        item_rate: rate,
        total_amount: Math.round(qty * rate * 100) / 100,
        created_at: isoTime(r.pastDate(2, 200)),
      };
    });
  },

  competitor_analysis: () => {
    const r = makeRng('competitor_analysis');
    const tenders = getDemoRows('tenders')!;
    const competitors = ['Larsen & Toubro', 'Dilip Buildcon', 'PNC Infratech', 'NCC Limited', 'Megha Engineering', 'Afcons Infrastructure', 'APCO Infratech', 'Sadbhav Engineering', 'Ashoka Buildcon', 'IRB Infrastructure', 'G R Infraprojects', 'HG Infra Engineering'];
    return Array.from({ length: DEMO_COUNTS.competitor_analysis }, (_, i) => ({
      id: demoId('competitor_analysis', i),
      tender_id: tenders[i % tenders.length].id,
      competitor_name: competitors[i % competitors.length],
      quoted_amount: r.money(20_000_000, 2_600_000_000),
      technical_score: Math.round((65 + r.next() * 35) * 10) / 10,
      strengths: r.pick(['Strong past performance', 'Aggressive pricing', 'Local presence', 'Own equipment fleet', 'Experienced key personnel']),
      weaknesses: r.pick(['High bid price', 'Limited machinery', 'Thin local presence', 'Past delay history', 'Weak financial capacity']),
      created_at: isoTime(r.pastDate(2, 260)),
    }));
  },

  bid_approvals: () => {
    const r = makeRng('bid_approvals');
    const tenders = getDemoRows('tenders')!;
    const profs = getDemoRows('profiles')!;
    return Array.from({ length: DEMO_COUNTS.bid_approvals }, (_, i) => ({
      id: demoId('bid_approvals', i),
      tender_id: tenders[i % tenders.length].id,
      submitted_by: profs[i % profs.length].id,
      approver_id: profs[(i + 5) % profs.length].id,
      status: r.pick(['Pending', 'Reviewing', 'Approved', 'Rejected']),
      comments: r.pick(['Commercials verified', 'Pending clarification on EMD', 'Approved by management', 'BOQ mismatch resolved', 'Awaiting legal clearance']),
      approval_date: isoTime(r.pastDate(0, 120)),
      created_at: isoTime(r.pastDate(2, 260)),
    }));
  },

  tax_records: () => {
    const r = makeRng('tax_records');
    return Array.from({ length: DEMO_COUNTS.tax_records }, (_, i) => {
      const cgst = r.money(20_000, 4_500_000);
      const sgst = Math.round(cgst * (0.85 + r.next() * 0.3));
      return {
        id: demoId('tax_records', i),
        filing_month: `${NOW.getFullYear()}-${String(((i % 12) + 1)).padStart(2, '0')}`,
        type: r.pick(['GST', 'GST', 'TDS', 'PT']),
        cgst,
        sgst,
        total_tax: cgst + sgst,
        status: r.pick(['Filed', 'Filed', 'Pending']),
        created_at: isoTime(r.pastDate(0, 330)),
      };
    });
  },

  okrs: () => {
    const r = makeRng('okrs');
    const objectives = [
      'Reduce project handover time by 15%', 'Achieve zero safety incidents', 'Improve vendor delivery score',
      'Grow order book by 25%', 'Digitise site progress reporting', 'Reduce material wastage below 3%',
      'Improve employee retention to 92%', 'Achieve 98% billing realisation', 'Reduce equipment downtime',
      'Increase client satisfaction score', 'Complete ISO audit readiness', 'Reduce fuel consumption per km',
      'Expand presence in two new states', 'Automate payroll processing', 'Strengthen subcontractor compliance',
    ];
    return Array.from({ length: DEMO_COUNTS.okrs }, (_, i) => ({
      id: demoId('okrs', i),
      objective: `${objectives[i % objectives.length]} - ${r.pick(['Q1', 'Q2', 'Q3', 'Q4', 'Annual'])}`,
      owner_name: person(r),
      progress: r.int(5, 100),
      status: r.pick(['On Track', 'On Track', 'At Risk', 'Completed']),
      created_at: isoTime(r.pastDate(10, 300)),
    }));
  },

  workflows: () => {
    const r = makeRng('workflows');
    const modules = ['Purchase Order', 'Material Requisition', 'Expense Approval', 'Leave Request', 'Running Bill', 'Contract Approval', 'Payroll', 'Tender Bid'];
    return Array.from({ length: DEMO_COUNTS.workflows }, (_, i) => ({
      id: demoId('workflows', i),
      name: `${modules[i % modules.length]} Approval Flow ${i + 1}`,
      module: modules[i % modules.length],
      steps: r.int(2, 6),
      description: `Multi-level approval routing for ${modules[i % modules.length].toLowerCase()} with owner sign-off.`,
      config: [],
      status: r.pick(['Active', 'Active', 'Draft', 'Inactive']),
      created_at: isoTime(r.pastDate(10, 500)),
    }));
  },

  shifts: () => {
    const r = makeRng('shifts');
    const defs = [
      ['General Shift', '09:00:00', '18:00:00', 1.0],
      ['Morning Shift', '06:00:00', '14:00:00', 1.1],
      ['Evening Shift', '14:00:00', '22:00:00', 1.2],
      ['Night Shift', '22:00:00', '06:00:00', 1.5],
      ['Site Early Shift', '07:00:00', '16:00:00', 1.05],
      ['Site Late Shift', '16:00:00', '01:00:00', 1.25],
    ] as const;
    return defs.map((d, i) => ({
      id: demoId('shifts', i),
      name: d[0],
      start_time: d[1],
      end_time: d[2],
      allowance_multiplier: d[3],
    }));
  },

  shift_assignments: () => {
    const r = makeRng('shift_assignments');
    const employees = getDemoRows('employees')!;
    const shifts = getDemoRows('shifts')!;
    const today = iso(NOW);
    const rows: DemoRow[] = [];

    // A fully staffed deployment board for today, so the roster is never empty.
    for (let i = 0; i < 72; i++) {
      rows.push({
        id: demoId('shift_assignments', i),
        employee_id: employees[i % employees.length].id,
        shift_id: shifts[i % shifts.length].id,
        assignment_date: today,
        status: 'Active',
      });
    }

    // Rotation history for the previous three weeks.
    for (let i = 72; i < DEMO_COUNTS.shift_assignments; i++) {
      rows.push({
        id: demoId('shift_assignments', i),
        employee_id: employees[(i * 7) % employees.length].id,
        shift_id: shifts[(i * 3) % shifts.length].id,
        assignment_date: iso(daysAgo(r.int(1, 21))),
        status: r.chance(0.92) ? 'Active' : 'Swapped',
      });
    }

    return rows;
  },

  conference_rooms: () => {
    const r = makeRng('conference_rooms');
    const names = ['Board Room', 'Narmada Hall', 'Godavari Hall', 'Krishna Hall', 'Kavery Hall', 'Training Room A', 'Training Room B', 'Innovation Lab', 'Client Lounge', 'Executive Cabin'];
    return names.map((name, i) => ({
      id: demoId('conference_rooms', i),
      name,
      capacity: r.pick([6, 8, 10, 12, 16, 20, 30]),
      location: `${r.pick(['Hinjewadi HQ', 'Kharadi Office', 'Pune Site Office', 'Mumbai Office'])}, Floor ${r.int(1, 8)}`,
      equipment: ['Projector', 'Video Conference', 'Whiteboard'],
      status: 'Available',
    }));
  },

  meetings: () => {
    const r = makeRng('meetings');
    const rooms = getDemoRows('conference_rooms')!;
    return Array.from({ length: DEMO_COUNTS.meetings }, (_, i) => {
      const start = r.chance(0.5) ? r.futureDate(0, 30) : r.pastDate(0, 120);
      start.setHours(r.int(9, 17), r.pick([0, 15, 30, 45]), 0, 0);
      const end = new Date(start.getTime() + r.int(1, 3) * 60 * 60 * 1000);
      return {
        id: demoId('meetings', i),
        title: `${r.pick(['Weekly progress review', 'Client coordination', 'Safety committee', 'Procurement review', 'Design review', 'Cost review', 'Billing reconciliation', 'Subcontractor onboarding'])} - ${r.pick(SITE_AREAS)}`,
        description: `Review of ${r.pick(['project progress', 'pending approvals', 'material availability', 'commercial status', 'safety observations'])} with project stakeholders.`,
        room_id: rooms[i % rooms.length].id,
        organizer_id: getDemoRows('profiles')![i % 60].id,
        start_time: isoTime(start),
        end_time: isoTime(end),
        department: r.pick(DEPARTMENTS),
        agenda_url: '',
        status: r.pick(['Scheduled', 'Scheduled', 'Completed', 'Cancelled']),
      };
    });
  },

  employee_appraisals: () => {
    const r = makeRng('employee_appraisals');
    const employees = getDemoRows('employees')!;
    const profs = getDemoRows('profiles')!;
    return Array.from({ length: DEMO_COUNTS.employee_appraisals }, (_, i) => ({
      id: demoId('employee_appraisals', i),
      employee_id: employees[i % employees.length].id,
      appraiser_id: profs[i % profs.length].id,
      score: r.int(3, 10),
      feedback: r.pick([
        'Consistent performer with strong site ownership.',
        'Needs improvement in documentation and reporting.',
        'Excellent coordination with subcontractors.',
        'Met most quarterly targets; recommend advanced training.',
        'Strong technical skills, improve stakeholder communication.',
      ]),
      appraisal_date: iso(r.pastDate(10, 330)),
      created_at: isoTime(r.pastDate(10, 330)),
    }));
  },

  employee_promotions: () => {
    const r = makeRng('employee_promotions');
    const employees = getDemoRows('employees')!;
    return Array.from({ length: DEMO_COUNTS.employee_promotions }, (_, i) => {
      const oldSalary = Number(employees[i % employees.length].gross_salary);
      return {
        id: demoId('employee_promotions', i),
        employee_id: employees[i % employees.length].id,
        old_role: r.pick(ROLES),
        new_role: r.pick(ROLES),
        old_salary: oldSalary,
        new_salary: Math.round(oldSalary * (1.08 + r.next() * 0.25)),
        effective_date: iso(r.pastDate(10, 600)),
        created_at: isoTime(r.pastDate(10, 600)),
      };
    });
  },

  transfer_requests: () => {
    const r = makeRng('transfer_requests');
    const employees = getDemoRows('employees')!;
    const profs = getDemoRows('profiles')!;
    return Array.from({ length: DEMO_COUNTS.transfer_requests }, (_, i) => ({
      id: demoId('transfer_requests', i),
      employee_id: employees[i % employees.length].id,
      requested_by: profs[i % profs.length].id,
      current_location: `${r.pick(SITE_AREAS)}, ${city(r)}`,
      target_location: `${r.pick(SITE_AREAS)}, ${city(r)}`,
      reason: r.pick(['Project requirement', 'Staffing gap', 'Employee request', 'Performance improvement', 'Site demobilisation']),
      status: r.pick(['Pending', 'Approved', 'Rejected']),
      effective_date: iso(r.chance(0.6) ? r.futureDate(2, 60) : r.pastDate(1, 120)),
      created_at: isoTime(r.pastDate(1, 200)),
    }));
  },

  exit_clearances: () => {
    const r = makeRng('exit_clearances');
    const employees = getDemoRows('employees')!;
    const profs = getDemoRows('profiles')!;
    return Array.from({ length: DEMO_COUNTS.exit_clearances }, (_, i) => ({
      id: demoId('exit_clearances', i),
      employee_id: employees[i % employees.length].id,
      cleared_by: profs[i % profs.length].id,
      it_cleared: r.chance(0.7),
      hr_cleared: r.chance(0.7),
      finance_cleared: r.chance(0.6),
      comments: r.pick(['Laptop returned, access revoked.', 'Pending final settlement.', 'All dues cleared.', 'Awaiting asset handover.']),
      status: r.pick(['In Progress', 'Cleared', 'Retained']),
      exit_date: iso(r.pastDate(5, 400)),
      created_at: isoTime(r.pastDate(5, 400)),
    }));
  },

  grievances: () => {
    const r = makeRng('grievances');
    const profs = getDemoRows('profiles')!;
    return Array.from({ length: DEMO_COUNTS.grievances }, (_, i) => ({
      id: demoId('grievances', i),
      submitted_by: profs[i % profs.length].id,
      subject: r.pick(['Delayed salary credit', 'Site accommodation issue', 'Safety gear shortage', 'Shift allocation concern', 'Transport facility', 'Canteen hygiene', 'Medical reimbursement delay']),
      description: 'Raised through the employee grievance portal and forwarded to the HR committee for review.',
      category: r.pick(['Payroll', 'Facilities', 'Safety', 'HR Policy', 'Transport', 'Health']),
      status: r.pick(['Open', 'In Review', 'Resolved', 'Dismissed']),
      resolution: r.chance(0.5) ? 'Addressed with the site HR team; employee informed.' : null,
      created_at: isoTime(r.pastDate(1, 260)),
    }));
  },

  internal_memos: () => {
    const r = makeRng('internal_memos');
    const profs = getDemoRows('profiles')!;
    return Array.from({ length: DEMO_COUNTS.internal_memos }, (_, i) => ({
      id: demoId('internal_memos', i),
      sender_id: profs[i % profs.length].id,
      title: r.pick(['Revised safety protocol', 'Monsoon preparedness', 'Payroll cut-off reminder', 'Vehicle log compliance', 'Purchase approval limits', 'Site visitor policy', 'Quarterly review schedule']),
      content: 'Please ensure compliance across all sites and acknowledge receipt through the ERP portal.',
      target_audience: r.pick(['All', 'Site Teams', 'Finance', 'Procurement', 'Project Managers']),
      is_urgent: r.chance(0.25),
      created_at: isoTime(r.pastDate(0, 200)),
    }));
  },

  employee_documents: () => {
    const r = makeRng('employee_documents');
    const employees = getDemoRows('employees')!;
    return Array.from({ length: DEMO_COUNTS.employee_documents }, (_, i) => ({
      id: demoId('employee_documents', i),
      employee_id: employees[i % employees.length].id,
      document_name: r.pick(['Aadhaar Card', 'PAN Card', 'Offer Letter', 'Appointment Letter', 'PF Form 11', 'ESI Declaration', 'Cancelled Cheque', 'Police Verification', 'Educational Certificate', 'Experience Letter']),
      document_type: r.pick(['Identity', 'Employment', 'Statutory', 'Financial', 'Education']),
      file_url: '',
      uploaded_by: getDemoRows('profiles')![i % 60].id,
      created_at: isoTime(r.pastDate(10, 900)),
    }));
  },

  holidays: () => {
    const r = makeRng('holidays');
    const defs: Array<[string, string, string]> = [
      ['Republic Day', '01-26', 'National'], ['Holi', '03-04', 'National'], ['Gudi Padwa', '03-19', 'Regional'],
      ['Good Friday', '04-03', 'Regional'], ['Eid-ul-Fitr', '03-31', 'National'], ['Maharashtra Day', '05-01', 'Regional'],
      ['Buddha Purnima', '05-12', 'National'], ['Independence Day', '08-15', 'National'],
      ['Ganesh Chaturthi', '08-27', 'Regional'], ['Gandhi Jayanti', '10-02', 'National'],
      ['Dussehra', '10-20', 'National'], ['Diwali - Laxmi Puja', '11-08', 'National'],
      ['Diwali - Balipratipada', '11-10', 'Regional'], ['Guru Nanak Jayanti', '11-24', 'National'],
      ['Christmas Day', '12-25', 'National'], ['Dr. Ambedkar Jayanti', '04-14', 'National'],
      ['Mahavir Jayanti', '04-10', 'National'], ['Raksha Bandhan', '08-28', 'Regional'],
      ['Janmashtami', '09-04', 'National'], ['Muharram', '06-26', 'National'],
      ['Onam', '09-06', 'Regional'], ['Pongal', '01-15', 'Regional'],
      ['Ugadi', '03-20', 'Regional'], ['Chhath Puja', '11-15', 'Regional'], ['Foundation Day', '02-11', 'Regional'],
    ];
    const year = NOW.getFullYear();
    return defs.slice(0, DEMO_COUNTS.holidays).map((d, i) => ({
      id: demoId('holidays', i),
      name: d[0],
      holiday_date: `${year}-${d[1]}`,
      type: d[2],
      branch_id: 'All',
      is_recurring: true,
      created_at: isoTime(r.pastDate(30, 500)),
    }));
  },

  cashflow_forecasts: () => {
    const r = makeRng('cashflow_forecasts');
    return Array.from({ length: DEMO_COUNTS.cashflow_forecasts }, (_, i) => {
      const month = new Date(NOW.getFullYear(), NOW.getMonth() - (DEMO_COUNTS.cashflow_forecasts - 1 - i), 1);
      const inflow = r.money(40_000_000, 180_000_000);
      const outflow = r.money(30_000_000, 160_000_000);
      const actualIn = Math.round(inflow * (0.75 + r.next() * 0.35));
      const actualOut = Math.round(outflow * (0.8 + r.next() * 0.3));
      return {
        id: demoId('cashflow_forecasts', i),
        forecast_month: iso(month),
        projected_inflow: inflow,
        projected_outflow: outflow,
        actual_inflow: actualIn,
        actual_outflow: actualOut,
        variance: (inflow - outflow) - (actualIn - actualOut),
        remarks: r.pick(['On track', 'Slight slippage in collections', 'Ahead of projection', 'Rebate recognised']),
        created_at: isoTime(month),
      };
    });
  },

  enterprise_settings: () => {
    const r = makeRng('enterprise_settings');
    return [{
      id: demoId('enterprise_settings', 0),
      legal_name: 'QITPES International Pvt Ltd',
      gstin: '27AAACQ1234F1Z5',
      pan: 'AAACQ1234F',
      website: 'www.qitpes.erp',
      address: 'Site 4, Phase 2, Hinjewadi IT Park, Pune, Maharashtra 411057',
      primary_hub: 'Pune Headquarters',
      updated_at: isoTime(r.pastDate(0, 30)),
    }];
  },

  production_logs: () => {
    const r = makeRng('production_logs');
    const units = ['Batching Plant CP-01', 'Batching Plant CP-02', 'Crusher Unit 1', 'Precast Yard', 'Steel Fabrication Yard', 'Paver Block Unit', 'Asphalt Plant', 'Concrete Mixer S30', 'Transit Mixer Batch', 'Cement Silo A'];
    return Array.from({ length: DEMO_COUNTS.production_logs }, (_, i) => ({
      id: demoId('production_logs', i),
      unit_name: units[i % units.length],
      message: r.pick([
        'Batch completed and dispatched to site.',
        'Routine maintenance completed successfully.',
        'Aggregate moisture above threshold; mix adjusted.',
        'Daily production target achieved.',
        'Minor belt alignment issue resolved.',
        'Silo level low; replenishment requested.',
        'Quality sample collected for cube testing.',
      ]),
      status_type: r.pick(['Info', 'Success', 'Success', 'Warning', 'Error']),
      created_at: isoTime(r.pastDate(0, 180)),
    }));
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const cache = new Map<string, DemoRow[]>();

/** Returns the generated rows for a table, or null when no demo set exists. */
export function getDemoRows(table: string): DemoRow[] | null {
  if (cache.has(table)) return cache.get(table)!;
  const builder = builders[table];
  if (!builder) return null;
  const rows = builder();
  cache.set(table, rows);
  return rows;
}

export function hasDemoData(table: string): boolean {
  return Object.prototype.hasOwnProperty.call(builders, table);
}

export function demoTableNames(): string[] {
  return Object.keys(builders);
}

export const DEMO_VEHICLE_SAMPLE = () => {
  const fleet = getDemoRows('fleet');
  return fleet ? fleet.slice(0, 5).map((v) => v.vehicle_number) : [];
};
