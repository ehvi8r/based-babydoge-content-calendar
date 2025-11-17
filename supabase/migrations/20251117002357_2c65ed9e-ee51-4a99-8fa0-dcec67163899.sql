-- Fix global_banners RLS policies
-- Add policies for admins to manage banners

CREATE POLICY "Admins can create banners" ON public.global_banners
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update banners" ON public.global_banners
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete banners" ON public.global_banners
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all banners" ON public.global_banners
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Fix team_invitations RLS policies
-- Add policies for admins to manage invitations

CREATE POLICY "Admins can view all invitations" ON public.team_invitations
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create invitations" ON public.team_invitations
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update invitations" ON public.team_invitations
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invitations" ON public.team_invitations
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view invitations by token" ON public.team_invitations
FOR SELECT 
USING (true);