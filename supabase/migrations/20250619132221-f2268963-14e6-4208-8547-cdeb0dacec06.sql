
-- Add the missing role field back to team_invitations table
ALTER TABLE public.team_invitations 
ADD COLUMN role app_role NOT NULL DEFAULT 'team_member';

-- Update the team_invitations table comment for clarity
COMMENT ON COLUMN public.team_invitations.role IS 'Role to be assigned to the user when they accept the invitation';
