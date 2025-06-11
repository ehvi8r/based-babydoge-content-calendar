
-- Insert missing user profiles for users who exist in auth.users but not in user_profiles
INSERT INTO public.user_profiles (id, email, full_name)
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data ->> 'full_name'
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Verify all users now have profiles
SELECT 
    up.id,
    up.email,
    up.full_name,
    ur.role
FROM public.user_profiles up
LEFT JOIN public.user_roles ur ON up.id = ur.user_id
ORDER BY up.created_at;
