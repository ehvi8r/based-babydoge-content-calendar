
-- Get all users from auth.users and their roles to see who's missing profiles
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created,
    up.id as profile_exists,
    ur.role
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
ORDER BY au.created_at;

-- Insert missing user profiles for users who exist in auth.users but not in user_profiles
INSERT INTO public.user_profiles (id, email, full_name)
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data ->> 'full_name'
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
