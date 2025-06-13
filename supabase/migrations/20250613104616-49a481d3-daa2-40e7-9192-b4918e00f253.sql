
-- Update brendapenton@gmail.com role from 'user' to 'team_member'
UPDATE public.user_roles 
SET role = 'team_member'::app_role 
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'brendapenton@gmail.com'
);

-- Verify both admin and team_member can modify calendar events by checking the function
-- This should return true for both users now
SELECT 
  u.email,
  ur.role,
  public.can_modify_calendar_events(u.id) as can_modify_events
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN ('brendapenton@gmail.com', 'teamwsm20@gmail.com')
ORDER BY u.email;
