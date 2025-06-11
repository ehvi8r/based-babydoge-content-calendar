
-- First, let's see exactly what users exist and what's missing
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created,
    up.id as profile_exists,
    up.email as profile_email,
    ur.role
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
ORDER BY au.created_at;

-- Now let's force insert the missing profile for brendapenton@gmail.com
-- We'll get their user ID from the auth.users table first
WITH missing_profiles AS (
    SELECT 
        au.id,
        au.email,
        au.raw_user_meta_data ->> 'full_name' as full_name
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
)
INSERT INTO public.user_profiles (id, email, full_name)
SELECT id, email, full_name
FROM missing_profiles
ON CONFLICT (id) DO NOTHING;

-- Verify the insert worked
SELECT 
    up.id,
    up.email,
    up.full_name,
    ur.role
FROM public.user_profiles up
LEFT JOIN public.user_roles ur ON up.id = ur.user_id
ORDER BY up.created_at;
