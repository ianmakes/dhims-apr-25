
-- Create app settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY,
  organization_name TEXT NOT NULL DEFAULT 'David''s Hope International',
  primary_color TEXT NOT NULL DEFAULT '#9b87f5',
  secondary_color TEXT NOT NULL DEFAULT '#7E69AB',
  theme_mode TEXT NOT NULL DEFAULT 'light',
  footer_text TEXT,
  app_version TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add RLS to app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read app settings
CREATE POLICY "Anyone can read app settings" 
  ON public.app_settings
  FOR SELECT 
  USING (true);

-- Only authenticated users with admin role can modify app settings
CREATE POLICY "Only admins can modify app settings" 
  ON public.app_settings
  FOR ALL 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superuser')
    )
  );

-- Create email settings table
CREATE TABLE IF NOT EXISTS public.email_settings (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'smtp',
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  smtp_host TEXT,
  smtp_port TEXT,
  smtp_username TEXT,
  smtp_password TEXT,
  resend_api_key TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  notify_new_student BOOLEAN DEFAULT true,
  notify_new_sponsor BOOLEAN DEFAULT true,
  notify_sponsorship_change BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add RLS to email_settings
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Only authenticated users with admin role can read email settings
CREATE POLICY "Only admins can read email settings" 
  ON public.email_settings
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superuser')
    )
  );

-- Only authenticated users with admin role can modify email settings
CREATE POLICY "Only admins can modify email settings" 
  ON public.email_settings
  FOR ALL 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superuser')
    )
  );

-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user TEXT,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS to audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable IP address capture on insert
CREATE OR REPLACE FUNCTION public.set_audit_log_ip()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ip_address = inet_client_addr()::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_audit_log_ip_trigger
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_audit_log_ip();

-- Anyone can insert audit logs
CREATE POLICY "Anyone can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users with admin role can read audit logs
CREATE POLICY "Only admins can read audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superuser')
    )
  );

-- Create storage buckets for app assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'Application Assets', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'User Avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the app-assets bucket
CREATE POLICY "Public can read app assets"
  ON storage.objects 
  FOR SELECT
  USING (bucket_id = 'app-assets');

CREATE POLICY "Authenticated users can upload app assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'app-assets' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superuser')
    )
  );

CREATE POLICY "Only admins can update app assets"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'app-assets' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superuser')
    )
  );

CREATE POLICY "Only admins can delete app assets"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'app-assets' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superuser')
    )
  );

-- Set up RLS policies for the avatars bucket
CREATE POLICY "Public can read avatars"
  ON storage.objects 
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatars"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
