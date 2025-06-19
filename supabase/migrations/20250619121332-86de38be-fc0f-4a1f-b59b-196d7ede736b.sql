
-- Phase 1: Clean up existing pending invitations for the 3 target emails
DELETE FROM public.team_invitations 
WHERE email IN ('geminikandrew@gmail.com', 'popcatsr@gmail.com', 'robearncash@gmail.com')
AND accepted_at IS NULL;
