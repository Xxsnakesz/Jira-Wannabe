-- ============================================
-- SUPABASE DATABASE SCHEMA FOR INCIDENT MANAGEMENT
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES TABLE (extends Supabase Auth)
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Profiles are viewable by authenticated users') THEN
        CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- Users can update their own profile
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON profiles
            FOR UPDATE TO authenticated USING (auth.uid() = id);
    END IF;
END $$;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger only if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Update profiles updated_at trigger
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create enum for status (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_status') THEN
        CREATE TYPE incident_status AS ENUM ('New', 'In Progress', 'Resolved', 'Closed');
    END IF;
END $$;

-- Create the incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Resolved', 'Closed')),
    description TEXT,
    incident_type TEXT,
    impact TEXT,
    pic TEXT,
    phone_number TEXT,
    waktu_kejadian TIMESTAMPTZ,
    waktu_chat TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_incidents_incident_id ON incidents(incident_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;
CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Create policies for incidents (with existence checks)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incidents' AND policyname = 'Enable all access for authenticated users') THEN
        CREATE POLICY "Enable all access for authenticated users" ON incidents
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incidents' AND policyname = 'Enable insert for anon users') THEN
        CREATE POLICY "Enable insert for anon users" ON incidents
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incidents' AND policyname = 'Enable read for anon users') THEN
        CREATE POLICY "Enable read for anon users" ON incidents
            FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incidents' AND policyname = 'Enable update for anon users') THEN
        CREATE POLICY "Enable update for anon users" ON incidents
            FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================
-- REALTIME SUBSCRIPTION SETUP
-- ============================================

-- Enable realtime for the incidents table (ignore error if already added)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Table already in publication, skip
END $$;

-- ============================================
-- OPTIONAL: Sample data for testing
-- ============================================
-- INSERT INTO incidents (incident_id, status, description, incident_type, impact, pic, phone_number, waktu_kejadian)
-- VALUES 
--   ('INC-20260119-0001', 'New', 'Server down in DC-1', 'Infrastructure', 'High', 'John Doe', '6281234567890', NOW() - INTERVAL '2 hours'),
--   ('INC-20260119-0002', 'In Progress', 'Network latency issues', 'Network', 'Medium', 'Jane Smith', '6281234567891', NOW() - INTERVAL '1 hour'),
--   ('INC-20260119-0003', 'Resolved', 'Login page not responding', 'Application', 'High', 'Bob Wilson', '6281234567892', NOW() - INTERVAL '30 minutes');
