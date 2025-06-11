
-- Drop the existing restrictive policy on user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

-- Create new policies that allow admins and team members to view all profiles
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
  ON public.user_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Team members can view all profiles" 
  ON public.user_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'team_member'));
