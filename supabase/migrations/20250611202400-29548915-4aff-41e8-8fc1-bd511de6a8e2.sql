
-- First, let's populate missing user profiles for existing users
-- Insert profiles for users who don't have them yet
INSERT INTO public.user_profiles (id, email, full_name)
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data ->> 'full_name'
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Now let's assign roles to users who don't have them
-- First user becomes admin, others become regular users
INSERT INTO public.user_roles (user_id, role)
SELECT 
    au.id,
    CASE 
        WHEN au.created_at = (SELECT MIN(created_at) FROM auth.users) THEN 'admin'::app_role
        ELSE 'user'::app_role
    END as role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL;

-- Verify the data was inserted correctly
-- This will show us the current state after the fix
SELECT 
    up.email,
    ur.role,
    up.created_at
FROM public.user_profiles up
JOIN public.user_roles ur ON up.id = ur.user_id
ORDER BY up.created_at;
