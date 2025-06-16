
-- Update brendapenton@gmail.com role from 'team_member' to 'admin'
UPDATE public.user_roles 
SET role = 'admin'::app_role 
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'brendapenton@gmail.com'
);
