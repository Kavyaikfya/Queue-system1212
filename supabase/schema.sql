-- ============================================================
-- FAIRQUEUE SUPABASE DATABASE SCHEMA & MIGRATION
-- Project: FAIRQUEUE — AI • REAL-TIME QUEUE INTELLIGENCE
-- Compatible with PostgreSQL 15+ & Supabase Auth
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES TABLE (REFERENCES auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'staff', 'organization_admin', 'super_admin')),
    theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. ORGANIZATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    logo_url TEXT,
    location TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. ORGANIZATION MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'organization_admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- ============================================================
-- 4. SERVICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    average_service_minutes NUMERIC DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. QUEUES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
    max_capacity INTEGER DEFAULT 100,
    operating_start TIME,
    operating_end TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. COUNTERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'busy', 'offline', 'paused')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. QUEUE ENTRIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.queue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES public.queues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ticket_number TEXT NOT NULL,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'in_service', 'completed', 'cancelled', 'no_show')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    service_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    initial_position INTEGER,
    current_position INTEGER,
    priority_score NUMERIC DEFAULT 0,
    estimated_wait_minutes NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. QUEUE EVENTS TABLE (TRANSPARENT AUDIT)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.queue_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES public.queues(id) ON DELETE CASCADE,
    queue_entry_id UUID REFERENCES public.queue_entries(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    previous_position INTEGER,
    new_position INTEGER,
    previous_status TEXT,
    new_status TEXT,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. SERVICE SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_entry_id UUID REFERENCES public.queue_entries(id) ON DELETE CASCADE,
    counter_id UUID REFERENCES public.counters(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_minutes NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    queue_entry_id UUID REFERENCES public.queue_entries(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. QUEUE SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.queue_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID UNIQUE REFERENCES public.queues(id) ON DELETE CASCADE,
    waiting_time_weight NUMERIC DEFAULT 1,
    priority_weight NUMERIC DEFAULT 1,
    max_wait_threshold INTEGER DEFAULT 30,
    no_show_timeout INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. QUEUE AI INSIGHTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.queue_ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES public.queues(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. SAFE RETURN WINDOWS TABLE (NEW CORE FEATURE)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.safe_return_windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_entry_id UUID REFERENCES public.queue_entries(id) ON DELETE CASCADE,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    safe_to_leave BOOLEAN DEFAULT FALSE,
    recommended_leave_time TIMESTAMPTZ,
    recommended_return_time TIMESTAMPTZ,
    estimated_service_time TIMESTAMPTZ,
    confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_queues_org ON public.queues(organization_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_user_status ON public.queue_entries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_status ON public.queue_entries(queue_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_events_entry ON public.queue_events(queue_entry_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_safe_return_entry ON public.safe_return_windows(queue_entry_id, calculated_at DESC);

-- ============================================================
-- SECTION 7: DATABASE TRIGGER FOR AUTOMATIC PROFILE CREATION
-- Automatically provisions profiles on auth.users Google OAuth signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        display_name,
        avatar_url,
        role,
        theme_preference,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture',
            ''
        ),
        'user',
        'system',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_return_windows ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read and update their own profile (cannot change role)
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile (excluding role)" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Organizations & Queues: Publicly readable for queue joining
CREATE POLICY "Public read organizations" ON public.organizations
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public read services" ON public.services
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public read queues" ON public.queues
    FOR SELECT USING (TRUE);

CREATE POLICY "Public read counters" ON public.counters
    FOR SELECT USING (TRUE);

-- Queue Entries: Users can read and insert their own entries
CREATE POLICY "Users can read own queue entries" ON public.queue_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join queue (insert own entry)" ON public.queue_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Queue Events & Safe Return Windows: Users can read their own
CREATE POLICY "Users can read own queue events" ON public.queue_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.queue_entries qe
            WHERE qe.id = queue_entry_id AND qe.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can read own safe return windows" ON public.safe_return_windows
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.queue_entries qe
            WHERE qe.id = queue_entry_id AND qe.user_id = auth.uid()
        )
    );

-- Notifications: Users can read and update their own notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- QEVORA REAL-WORLD SERVICE COMPLETION PLATFORM TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS service_availability (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, DELAYED, UNAVAILABLE
    staff_status TEXT DEFAULT 'Staff on duty',
    reason TEXT,
    expected_recovery TEXT,
    expected_wait_minutes INTEGER DEFAULT 15,
    location TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_documents (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_passport (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    field_name TEXT NOT NULL,
    field_value TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_consents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    granted_fields TEXT NOT NULL, -- JSON array string e.g. ["name","address"]
    status TEXT DEFAULT 'GRANTED',
    consent_given_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_proxies (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    proxy_name TEXT NOT NULL,
    proxy_relationship TEXT NOT NULL,
    proxy_phone TEXT,
    service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
    allowed_actions TEXT NOT NULL, -- JSON array e.g. ["submit_document","receive_acknowledgement"]
    denied_actions TEXT NOT NULL, -- JSON array e.g. ["change_profile","approve_financial"]
    purpose TEXT NOT NULL,
    permission_type TEXT DEFAULT 'ONE_TIME', -- ONE_TIME, TIME_LIMITED
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, REVOKED, EXPIRED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_bookings (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    creator_user_id TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, CONFIRMED, AT_RISK, CANCELLED, COMPLETED
    scheduled_time TIMESTAMP WITH TIME ZONE,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_members (
    id TEXT PRIMARY KEY,
    group_booking_id TEXT NOT NULL REFERENCES group_bookings(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    phone TEXT,
    is_required BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'PENDING', -- CONFIRMED, PENDING, DECLINED
    confirmed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS opportunity_recovery (
    id TEXT PRIMARY KEY,
    original_service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    original_time TIMESTAMP WITH TIME ZONE,
    reason_cancelled TEXT NOT NULL,
    status TEXT DEFAULT 'OFFERED', -- OFFERED, RECOVERED, DISMISSED
    alternative_options TEXT NOT NULL, -- JSON array of alternatives
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    verification_type TEXT NOT NULL, -- IDENTITY, ADDRESS, DOCUMENT, ELIGIBILITY
    document_name TEXT NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    issuing_authority TEXT,
    status TEXT DEFAULT 'VALID' -- VALID, EXPIRED, REVOKED
);

CREATE TABLE IF NOT EXISTS process_reuse_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    verification_id TEXT NOT NULL REFERENCES verification_records(id) ON DELETE CASCADE,
    reused_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'APPROVED'
);

CREATE INDEX IF NOT EXISTS idx_service_availability_srv ON service_availability(service_id);
CREATE INDEX IF NOT EXISTS idx_service_passport_user ON service_passport(user_id);
CREATE INDEX IF NOT EXISTS idx_service_proxies_user ON service_proxies(user_id);
CREATE INDEX IF NOT EXISTS idx_group_bookings_user ON group_bookings(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_recovery_user ON opportunity_recovery(user_id, status);
CREATE INDEX IF NOT EXISTS idx_verification_records_user ON verification_records(user_id, status);
