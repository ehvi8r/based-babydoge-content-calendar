
-- Create the app_role enum type (without IF NOT EXISTS as it's not supported)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'team_member', 'user');
    END IF;
END $$;

-- Ensure user_roles table has the correct structure
DO $$
BEGIN
    -- Check if user_roles table needs to be created or modified
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
        CREATE TABLE public.user_roles (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            role app_role NOT NULL,
            assigned_by uuid REFERENCES auth.users(id),
            created_at timestamptz DEFAULT NOW(),
            UNIQUE (user_id)
        );
    END IF;
END $$;

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create or replace the security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create RLS policies for user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
