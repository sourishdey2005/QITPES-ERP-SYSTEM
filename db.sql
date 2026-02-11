
-- QITPES ERP SYSTEM - SUPABASE SCHEMA

-- 1. Roles & Permissions
CREATE TYPE user_role AS ENUM ('owner', 'director', 'accounting');

-- 2. Profiles (Extending auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'accounting',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Projects
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'Planning',
  budget NUMERIC(15, 2),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Inventory
CREATE TABLE inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  unit_price NUMERIC(15, 2),
  reorder_level INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Finance Transactions
CREATE TABLE finance_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('income', 'expense')),
  amount NUMERIC(15, 2) NOT NULL,
  category TEXT,
  description TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  project_id UUID REFERENCES projects(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all profiles (for management), but only update their own.
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: All roles can view. Owners and Directors can create/update.
CREATE POLICY "Projects viewable by authenticated" ON projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Projects manageable by Owner/Director" ON projects FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'director')));

-- Inventory: All viewable.
CREATE POLICY "Inventory viewable by authenticated" ON inventory_items FOR SELECT USING (auth.role() = 'authenticated');

-- Finance: Owner and Accounting only
CREATE POLICY "Finance accessible by Owner/Accounting" ON finance_transactions FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'accounting')));

-- FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'accounting');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
