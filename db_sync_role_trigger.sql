-- SYNC ROLES TRIGGER
-- Ensure role updates in Access Control (approved_users) propagate to user profiles (profiles)
-- This ensures the actual permissions update instantly without re-login or confusing mismatch.

CREATE OR REPLACE FUNCTION public.sync_role_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- If role changed, update the corresponding profile
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    UPDATE public.profiles
    SET role = NEW.role
    WHERE email = NEW.email; -- Using email as reliable link
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_approved_user_role_change ON public.approved_users;
CREATE TRIGGER on_approved_user_role_change
  AFTER UPDATE OF role ON public.approved_users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_to_profile();

-- Also ensure initial role sync if needed (one-time fix)
UPDATE public.profiles p
SET role = au.role
FROM public.approved_users au
WHERE p.email = au.email
  AND p.role IS DISTINCT FROM au.role;
