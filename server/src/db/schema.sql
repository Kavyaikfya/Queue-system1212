-- Schema for REAL-TIME FAIR QUEUE SYSTEM
-- Compatible with PostgreSQL 15+ and PGlite

CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- HOSPITAL, BANK, GOVERNMENT, COLLEGE, SERVICE_CENTER, TAXI, CUSTOM
    logo TEXT,
    address TEXT,
    contact TEXT,
    working_hours TEXT DEFAULT '09:00 - 18:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER', -- SUPER_ADMIN, ORG_ADMIN, STAFF, USER
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_members (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- ORG_ADMIN, STAFF
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    avg_duration_minutes INTEGER DEFAULT 15,
    base_priority INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS queues (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    prefix TEXT NOT NULL DEFAULT 'A',
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, CLOSED
    max_capacity INTEGER DEFAULT 100,
    operating_hours TEXT DEFAULT '09:00 - 17:00',
    priority_rules_json TEXT DEFAULT '{}',
    no_show_timeout_sec INTEGER DEFAULT 120,
    current_token_number INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS counters (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    queue_id TEXT REFERENCES queues(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    counter_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, BUSY, IDLE, OFFLINE
    current_staff_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_assignments (
    id TEXT PRIMARY KEY,
    staff_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    counter_id TEXT NOT NULL REFERENCES counters(id) ON DELETE CASCADE,
    queue_id TEXT REFERENCES queues(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unassigned_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS queue_entries (
    id TEXT PRIMARY KEY,
    ticket_number TEXT NOT NULL,
    queue_id TEXT NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    guest_name TEXT,
    guest_phone TEXT,
    status TEXT NOT NULL DEFAULT 'WAITING', -- WAITING, CALLED, IN_SERVICE, COMPLETED, NO_SHOW, CANCELLED, EXPIRED
    priority_score NUMERIC(10, 2) DEFAULT 0.00,
    priority_reason TEXT,
    position INTEGER DEFAULT 1,
    estimated_wait_minutes INTEGER DEFAULT 0,
    join_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    called_time TIMESTAMP WITH TIME ZONE,
    service_start_time TIMESTAMP WITH TIME ZONE,
    service_end_time TIMESTAMP WITH TIME ZONE,
    counter_id TEXT REFERENCES counters(id) ON DELETE SET NULL,
    staff_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    no_show_deadline TIMESTAMP WITH TIME ZONE,
    is_urgent BOOLEAN DEFAULT FALSE,
    has_appointment BOOLEAN DEFAULT FALSE,
    service_category TEXT,
    notes TEXT,
    metadata TEXT DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS queue_events (
    id TEXT PRIMARY KEY,
    queue_entry_id TEXT NOT NULL REFERENCES queue_entries(id) ON DELETE CASCADE,
    queue_id TEXT NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- JOINED, POSITION_CHANGED, CALLED, SERVICE_STARTED, SERVICE_COMPLETED, NO_SHOW, CANCELLED, REORDERED, PAUSED, RESUMED
    previous_position INTEGER,
    new_position INTEGER,
    reason TEXT,
    actor_id TEXT,
    metadata TEXT DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_sessions (
    id TEXT PRIMARY KEY,
    queue_entry_id TEXT NOT NULL REFERENCES queue_entries(id) ON DELETE CASCADE,
    counter_id TEXT NOT NULL REFERENCES counters(id) ON DELETE CASCADE,
    staff_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    notes TEXT,
    outcome TEXT DEFAULT 'SUCCESS'
);

CREATE TABLE IF NOT EXISTS priority_rules (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    queue_id TEXT REFERENCES queues(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- WAIT_TIME_AGING, SERVICE_CATEGORY, APPOINTMENT_STATUS, URGENCY_TIER
    weight NUMERIC(5, 2) DEFAULT 1.00,
    condition_json TEXT DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fairness_events (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    queue_id TEXT REFERENCES queues(id) ON DELETE SET NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'WARNING', -- INFO, WARNING, CRITICAL
    explanation TEXT NOT NULL,
    metric_snapshot TEXT DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, RESOLVED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS queue_snapshots (
    id TEXT PRIMARY KEY,
    queue_id TEXT NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
    snapshot_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    queue_length INTEGER DEFAULT 0,
    waiting_count INTEGER DEFAULT 0,
    avg_wait_minutes NUMERIC(6, 2) DEFAULT 0.00,
    fairness_score NUMERIC(5, 2) DEFAULT 95.00,
    active_counters INTEGER DEFAULT 1,
    snapshot_data TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    queue_entry_id TEXT REFERENCES queue_entries(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INFO', -- INFO, POSITION_UPDATE, TURN_APPROACHING, TURN_ARRIVED, ALERT
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_settings (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, key)
);

CREATE TABLE IF NOT EXISTS queue_settings (
    id TEXT PRIMARY KEY,
    queue_id TEXT UNIQUE NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
    waiting_time_weight NUMERIC DEFAULT 1.0,
    priority_weight NUMERIC DEFAULT 1.0,
    max_wait_threshold INTEGER DEFAULT 30,
    no_show_timeout INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS queue_ai_insights (
    id TEXT PRIMARY KEY,
    queue_id TEXT NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    metadata TEXT DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS safe_return_windows (
    id TEXT PRIMARY KEY,
    queue_entry_id TEXT NOT NULL REFERENCES queue_entries(id) ON DELETE CASCADE,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    safe_to_leave BOOLEAN DEFAULT FALSE,
    recommended_leave_time TIMESTAMP WITH TIME ZONE,
    recommended_return_time TIMESTAMP WITH TIME ZONE,
    estimated_service_time TIMESTAMP WITH TIME ZONE,
    confidence TEXT DEFAULT 'medium',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- VISIT INTELLIGENCE TABLES (Requirements 17, 18, 19, 20, 29, 39, 43)
-- ========================================================

CREATE TABLE IF NOT EXISTS service_requirements (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- SERVICE_REQUIREMENT, WHAT_TO_BRING, DOCUMENT, PREPARATION, IMPORTANT_NOTE
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    can_avoid_visit BOOLEAN DEFAULT FALSE,
    online_option_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visit_readiness (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    readiness_score INTEGER DEFAULT 0,
    checklist_json TEXT DEFAULT '[]', -- [{ id, title, category, completed, status }]
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, service_id)
);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    mime_type TEXT,
    status TEXT DEFAULT 'PRECHECK_PASSED', -- PENDING, PRECHECK_PASSED, PRECHECK_FLAGGED
    precheck_results_json TEXT DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facility_favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS visit_feedback (
    id TEXT PRIMARY KEY,
    queue_entry_id TEXT REFERENCES queue_entries(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
    service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    waiting_duration_minutes INTEGER,
    service_duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rapid real-time lookup
CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_status ON queue_entries(queue_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_user ON queue_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_priority ON queue_entries(queue_id, priority_score DESC, join_time ASC);
CREATE INDEX IF NOT EXISTS idx_queue_events_entry ON queue_events(queue_entry_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_counters_org ON counters(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safe_return_entry ON safe_return_windows(queue_entry_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_req_service ON service_requirements(service_id);
CREATE INDEX IF NOT EXISTS idx_visit_readiness_user ON visit_readiness(user_id, service_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_facility_favorites_user ON facility_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_visit_feedback_user ON visit_feedback(user_id);



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
