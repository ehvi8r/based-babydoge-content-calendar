
-- First, let's check if you have a user profile and create one if needed
-- This will insert your user data into user_profiles and assign admin role

DO $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
BEGIN
    -- Get the current authenticated user's ID and email
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found. Please make sure you are logged in.';
    END IF;
    
    -- Get user email from auth.users (this requires service role access)
    -- Since we can't directly access auth.users, we'll use a different approach
    
    -- First, try to insert/update user_profiles (we'll use a dummy email for now)
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (current_user_id, 'admin@example.com', 'Admin User')
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
    
    -- Delete any existing role for this user to avoid conflicts
    DELETE FROM public.user_roles WHERE user_id = current_user_id;
    
    -- Insert admin role for the current user
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (current_user_id, 'admin');
    
    RAISE NOTICE 'Admin role assigned to current user: %', current_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;
