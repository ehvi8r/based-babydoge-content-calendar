
-- Step 1: Drop the old unique constraint from the user_roles table.
-- This allows us to enforce a one-role-per-user policy.
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Step 2: Add a new unique constraint on just the user_id.
-- This ensures a user can only have one role at a time.
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- Step 3: Update the handle_new_user function to correctly handle invitations on signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  invited_role public.app_role;
  invitation_id_to_accept UUID;
BEGIN
  -- Insert user profile, as before
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );

  -- Check for a valid, unaccepted invitation for the new user's email
  SELECT id, role INTO invitation_id_to_accept, invited_role
  FROM public.team_invitations
  WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- Assign role based on invitation, or fall back to default logic
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(
      invited_role,
      CASE
        WHEN (SELECT count(*) FROM public.user_roles WHERE role = 'admin') = 0
        THEN 'admin'::app_role
        ELSE 'user'::app_role
      END
    )
  );

  -- If an invitation was found and used, mark it as accepted now.
  IF invitation_id_to_accept IS NOT NULL THEN
    UPDATE public.team_invitations
    SET accepted_at = NOW()
    WHERE id = invitation_id_to_accept;
  END IF;

  RETURN NEW;
END;
$$;
