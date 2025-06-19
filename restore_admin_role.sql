
-- Restore admin role for the current user
-- This script will make the first user (you) an admin again

DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Get the first user from the user_profiles table (that's you)
    SELECT id INTO first_user_id 
    FROM public.user_profiles 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- If we found a user, make them admin
    IF first_user_id IS NOT NULL THEN
        -- Delete any existing role for this user to avoid conflicts
        DELETE FROM public.user_roles WHERE user_id = first_user_id;
        
        -- Insert admin role
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (first_user_id, 'admin');
        
        RAISE NOTICE 'Admin role restored for user ID: %', first_user_id;
    ELSE
        RAISE NOTICE 'No users found in user_profiles table';
    END IF;
END $$;
