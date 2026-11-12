-- FIX SCRIPT: Add missing password column to existing table

-- 1. Add the column safely
ALTER TABLE approved_users 
ADD COLUMN IF NOT EXISTS initial_password TEXT;

-- 2. Update the owner's record with the hardcoded password
UPDATE approved_users 
SET initial_password = '123456789' 
WHERE email = 'arunima';

-- 3. Verify the column exists
SELECT id, email, initial_password FROM approved_users WHERE email = 'arunima';
