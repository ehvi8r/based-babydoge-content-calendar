
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'team_member', 'user');

-- Create user profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create global banners table (only admin can manage)
CREATE TABLE public.global_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL DEFAULT 'https://babydoge20.com',
  title TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team invitations table
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  role app_role NOT NULL DEFAULT 'team_member',
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get admin user ID (assumes first user with admin role)
CREATE OR REPLACE FUNCTION public.get_admin_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT user_id
  FROM public.user_roles
  WHERE role = 'admin'
  LIMIT 1
$$;

-- Function to check if user is team member of admin
CREATE OR REPLACE FUNCTION public.is_team_member_of_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'team_member'
  )
$$;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for global_banners
CREATE POLICY "Everyone can view active banners"
  ON public.global_banners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can manage banners"
  ON public.global_banners FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for team_invitations
CREATE POLICY "Admins can manage invitations"
  ON public.team_invitations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update existing scheduled_posts policies for team access
DROP POLICY IF EXISTS "Users can view their own posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.scheduled_posts;

-- New policies for scheduled_posts with team access
CREATE POLICY "Users can view own posts or team members can view admin posts"
  ON public.scheduled_posts FOR SELECT
  USING (
    auth.uid() = user_id OR 
    (public.is_team_member_of_admin(auth.uid()) AND user_id = public.get_admin_user_id())
  );

CREATE POLICY "Users can create their own posts or admins can create"
  ON public.scheduled_posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Only owners and admins can update posts"
  ON public.scheduled_posts FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Only owners and admins can delete posts"
  ON public.scheduled_posts FOR DELETE
  USING (
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Update existing published_posts policies for team access
DROP POLICY IF EXISTS "Users can view their own published posts" ON public.published_posts;
DROP POLICY IF EXISTS "Users can create their own published posts" ON public.published_posts;
DROP POLICY IF EXISTS "Users can update their own published posts" ON public.published_posts;
DROP POLICY IF EXISTS "Users can delete their own published posts" ON public.published_posts;

-- New policies for published_posts with team access
CREATE POLICY "Users can view own posts or team members can view admin posts"
  ON public.published_posts FOR SELECT
  USING (
    auth.uid() = user_id OR 
    (public.is_team_member_of_admin(auth.uid()) AND user_id = public.get_admin_user_id())
  );

CREATE POLICY "Users can create their own published posts or admins can create"
  ON public.published_posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Only owners and admins can update published posts"
  ON public.published_posts FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Only owners and admins can delete published posts"
  ON public.published_posts FOR DELETE
  USING (
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Trigger to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert user profile
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  
  -- Assign default role (first user becomes admin, others become regular users)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') 
      THEN 'admin'::app_role
      ELSE 'user'::app_role
    END
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to accept team invitation
CREATE OR REPLACE FUNCTION public.accept_team_invitation(_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Get invitation details
  SELECT * INTO invitation_record
  FROM public.team_invitations
  WHERE token = _token
    AND expires_at > NOW()
    AND accepted_at IS NULL;
    
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update user role
  UPDATE public.user_roles
  SET role = invitation_record.role
  WHERE user_id = auth.uid();
  
  -- Mark invitation as accepted
  UPDATE public.team_invitations
  SET accepted_at = NOW()
  WHERE id = invitation_record.id;
  
  RETURN TRUE;
END;
$$;
