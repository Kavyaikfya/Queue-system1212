import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, query } from './index.js';
export async function seedDatabase() {
    console.log('[SEED] Starting database seeding...');
    await initDatabase();
    // Check if organizations already exist
    const existingOrgs = await query('SELECT count(*) as count FROM organizations');
    if (parseInt(existingOrgs.rows[0].count, 10) > 0) {
        console.log('[SEED] Database already contains data. Skipping re-seed.');
        return;
    }
    const hashedPasswordAdmin = await bcrypt.hash('Admin123!', 10);
    const hashedPasswordUser = await bcrypt.hash('User123!', 10);
    // 1. Create Super Admin
    const superAdminId = uuidv4();
    await query(`INSERT INTO users (id, email, password_hash, full_name, role, phone)
     VALUES ($1, $2, $3, $4, $5, $6)`, [superAdminId, 'superadmin@fairqueue.io', hashedPasswordAdmin, 'System Administrator', 'SUPER_ADMIN', '+1-800-555-0100']);
    // 2. Define Sample Organizations
    const orgConfigs = [
        {
            name: 'City Care Clinic',
            slug: 'city-care-clinic',
            type: 'HOSPITAL',
            address: '742 Evergreen Terrace, Medical District',
            contact: 'info@citycare.org | (555) 234-5678',
            working_hours: '08:00 - 20:00',
            admin: { name: 'Dr. Sarah Jenkins', email: 'dr.sarah@citycare.org' },
            staff: { name: 'Nurse Elena Rostova', email: 'nurse.elena@citycare.org' },
            services: [
                { name: 'Emergency Triage', category: 'EMERGENCY', duration: 10, priority: 50 },
                { name: 'General Medicine OPD', category: 'STANDARD', duration: 15, priority: 10 },
                { name: 'Pediatrics Fast-Track', category: 'PRIORITY', duration: 12, priority: 25 },
                { name: 'Cardiology Consultation', category: 'SPECIALIST', duration: 20, priority: 20 }
            ],
            counters: [
                { name: 'Triage Desk A1', number: 1, status: 'ACTIVE' },
                { name: 'Consultation Room B2', number: 2, status: 'ACTIVE' },
                { name: 'Pediatrics Desk C1', number: 3, status: 'BUSY' },
                { name: 'Diagnostics Station', number: 4, status: 'IDLE' }
            ]
        },
        {
            name: 'Citizen Service Center',
            slug: 'citizen-service-center',
            type: 'GOVERNMENT',
            address: '100 Federal Plaza, Suite 400',
            contact: 'support@citizencenter.gov | (555) 345-6789',
            working_hours: '09:00 - 17:00',
            admin: { name: 'Marcus Vance', email: 'admin@citizencenter.gov' },
            staff: { name: 'Officer Chloe Bennett', email: 'officer.chloe@citizencenter.gov' },
            services: [
                { name: 'Passport Verification', category: 'IDENTITY', duration: 15, priority: 15 },
                { name: 'National ID & Civil Registry', category: 'REGISTRATION', duration: 20, priority: 10 },
                { name: 'Property Tax & Deeds', category: 'TAX', duration: 25, priority: 10 }
            ],
            counters: [
                { name: 'Counter 1 - Express Docs', number: 1, status: 'ACTIVE' },
                { name: 'Counter 2 - Biometrics', number: 2, status: 'ACTIVE' },
                { name: 'Counter 3 - Verification', number: 3, status: 'IDLE' }
            ]
        },
        {
            name: 'Unity Bank',
            slug: 'unity-bank',
            type: 'BANK',
            address: '500 Wall Street Financial Plaza',
            contact: 'concierge@unitybank.com | (555) 456-7890',
            working_hours: '09:00 - 16:30',
            admin: { name: 'Alexander Wright', email: 'branchmgr@unitybank.com' },
            staff: { name: 'Teller Maya Patel', email: 'teller.maya@unitybank.com' },
            services: [
                { name: 'Cash Transactions & Deposits', category: 'TELLER', duration: 8, priority: 10 },
                { name: 'Commercial & Business Accounts', category: 'COMMERCIAL', duration: 25, priority: 25 },
                { name: 'Mortgage & Personal Loans', category: 'LOANS', duration: 30, priority: 20 }
            ],
            counters: [
                { name: 'Teller Window 1', number: 1, status: 'ACTIVE' },
                { name: 'Teller Window 2', number: 2, status: 'ACTIVE' },
                { name: 'Private Client Desk', number: 3, status: 'IDLE' }
            ]
        },
        {
            name: 'Campus Administration',
            slug: 'campus-admin',
            type: 'COLLEGE',
            address: 'Building A, University Center',
            contact: 'admin@university.edu | (555) 567-8901',
            working_hours: '09:00 - 17:00',
            admin: { name: 'Dean Thomas Miller', email: 'dean@university.edu' },
            staff: { name: 'Advisor Rachel Green', email: 'advisor.rachel@university.edu' },
            services: [
                { name: 'Course Enrollment & Changes', category: 'ACADEMIC', duration: 10, priority: 15 },
                { name: 'Financial Aid Counseling', category: 'FINANCIAL', duration: 20, priority: 20 },
                { name: 'Official Transcripts & Degrees', category: 'RECORDS', duration: 8, priority: 10 }
            ],
            counters: [
                { name: 'Admissions & Enrollment', number: 1, status: 'ACTIVE' },
                { name: 'Student Accounts & Aid', number: 2, status: 'ACTIVE' }
            ]
        },
        {
            name: 'Service Hub',
            slug: 'service-hub',
            type: 'SERVICE_CENTER',
            address: '88 Tech Boulevard, Innovation Park',
            contact: 'help@servicehub.com | (555) 678-9012',
            working_hours: '10:00 - 19:00',
            admin: { name: 'Jordan Rivera', email: 'lead@servicehub.com' },
            staff: { name: 'Technician Sam Wilson', email: 'rep.sam@servicehub.com' },
            services: [
                { name: 'Hardware Diagnostics & Repair', category: 'HARDWARE', duration: 20, priority: 15 },
                { name: 'Rapid Warranty Exchange', category: 'EXCHANGE', duration: 10, priority: 20 },
                { name: 'Account & Software Setup', category: 'SOFTWARE', duration: 15, priority: 10 }
            ],
            counters: [
                { name: 'Genius Bench 1', number: 1, status: 'ACTIVE' },
                { name: 'Returns Counter 2', number: 2, status: 'ACTIVE' }
            ]
        }
    ];
    // 3. Create Sample Regular Users
    const sampleUsers = [
        { name: 'John Doe', email: 'john.doe@example.com', phone: '+1-555-0111' },
        { name: 'Alice Smith', email: 'alice.smith@example.com', phone: '+1-555-0112' },
        { name: 'Robert Chen', email: 'robert.chen@example.com', phone: '+1-555-0113' },
        { name: 'Maria Garcia', email: 'maria.garcia@example.com', phone: '+1-555-0114' },
        { name: 'David Kim', email: 'david.kim@example.com', phone: '+1-555-0115' },
        { name: 'Sophia Taylor', email: 'sophia.taylor@example.com', phone: '+1-555-0116' },
    ];
    const userMap = {};
    for (const u of sampleUsers) {
        const uId = uuidv4();
        userMap[u.email] = uId;
        await query(`INSERT INTO users (id, email, password_hash, full_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)`, [uId, u.email, hashedPasswordUser, u.name, 'USER', u.phone]);
    }
    // Iterate and create organizations, services, queues, counters, staff, and initial tickets
    for (const orgData of orgConfigs) {
        const orgId = uuidv4();
        await query(`INSERT INTO organizations (id, name, slug, type, address, contact, working_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [orgId, orgData.name, orgData.slug, orgData.type, orgData.address, orgData.contact, orgData.working_hours]);
        // Create Org Admin
        const adminId = uuidv4();
        await query(`INSERT INTO users (id, email, password_hash, full_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)`, [adminId, orgData.admin.email, hashedPasswordAdmin, orgData.admin.name, 'ORG_ADMIN', '+1-555-9000']);
        await query(`INSERT INTO organization_members (id, organization_id, user_id, role, title)
       VALUES ($1, $2, $3, $4, $5)`, [uuidv4(), orgId, adminId, 'ORG_ADMIN', 'Managing Director']);
        // Create Staff Member
        const staffId = uuidv4();
        await query(`INSERT INTO users (id, email, password_hash, full_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)`, [staffId, orgData.staff.email, hashedPasswordUser, orgData.staff.name, 'STAFF', '+1-555-9001']);
        await query(`INSERT INTO organization_members (id, organization_id, user_id, role, title)
       VALUES ($1, $2, $3, $4, $5)`, [uuidv4(), orgId, staffId, 'STAFF', 'Senior Service Representative']);
        // Create Services
        const serviceIds = [];
        for (const s of orgData.services) {
            const sId = uuidv4();
            serviceIds.push(sId);
            await query(`INSERT INTO services (id, organization_id, name, category, avg_duration_minutes, base_priority)
         VALUES ($1, $2, $3, $4, $5, $6)`, [sId, orgId, s.name, s.category, s.duration, s.priority]);
        }
        // Create Main Queue
        const queueId = uuidv4();
        const prefix = orgData.type.charAt(0);
        await query(`INSERT INTO queues (id, organization_id, service_id, name, prefix, status, max_capacity, operating_hours, priority_rules_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            queueId,
            orgId,
            serviceIds[0],
            `${orgData.name} - General Queue`,
            prefix,
            'ACTIVE',
            150,
            orgData.working_hours,
            JSON.stringify({
                wait_time_aging_weight: 1.5,
                urgency_boost_weight: 40.0,
                appointment_boost_weight: 15.0,
                service_category_weight: 1.0,
            }),
        ]);
        // Create Counters
        let firstCounterId = null;
        for (const c of orgData.counters) {
            const cId = uuidv4();
            if (!firstCounterId)
                firstCounterId = cId;
            await query(`INSERT INTO counters (id, organization_id, queue_id, name, counter_number, status, current_staff_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [cId, orgId, queueId, c.name, c.number, c.status, c.number === 1 ? staffId : null]);
            if (c.number === 1) {
                await query(`INSERT INTO staff_assignments (id, staff_id, counter_id, queue_id, is_active)
           VALUES ($1, $2, $3, $4, TRUE)`, [uuidv4(), staffId, cId, queueId]);
            }
        }
        // Priority Rules
        await query(`INSERT INTO priority_rules (id, organization_id, queue_id, rule_name, rule_type, weight, condition_json)
       VALUES 
       ($1, $2, $3, 'Wait-Time Aging (Starvation Prevention)', 'WAIT_TIME_AGING', 1.50, '{"rate_per_min": 0.5}'),
       ($4, $2, $3, 'Urgent Triage Condition', 'URGENCY_TIER', 40.00, '{"flag": "is_urgent"}'),
       ($5, $2, $3, 'Confirmed Appointment Bonus', 'APPOINTMENT_STATUS', 15.00, '{"flag": "has_appointment"}')`, [uuidv4(), orgId, queueId, uuidv4(), uuidv4()]);
        // Initial Live Queue Entries for the first organization (City Care Clinic)
        if (orgData.slug === 'city-care-clinic') {
            const entriesToCreate = [
                {
                    userEmail: 'john.doe@example.com',
                    name: 'John Doe',
                    isUrgent: false,
                    appointment: true,
                    status: 'IN_SERVICE',
                    pos: 0,
                    waitMins: 0,
                    ticketNum: `${prefix}-101`,
                },
                {
                    userEmail: 'alice.smith@example.com',
                    name: 'Alice Smith',
                    isUrgent: true,
                    appointment: false,
                    status: 'WAITING',
                    pos: 1,
                    waitMins: 6,
                    ticketNum: `${prefix}-102`,
                },
                {
                    userEmail: 'robert.chen@example.com',
                    name: 'Robert Chen',
                    isUrgent: false,
                    appointment: true,
                    status: 'WAITING',
                    pos: 2,
                    waitMins: 14,
                    ticketNum: `${prefix}-103`,
                },
                {
                    userEmail: 'maria.garcia@example.com',
                    name: 'Maria Garcia',
                    isUrgent: false,
                    appointment: false,
                    status: 'WAITING',
                    pos: 3,
                    waitMins: 22,
                    ticketNum: `${prefix}-104`,
                },
                {
                    userEmail: 'david.kim@example.com',
                    name: 'David Kim',
                    isUrgent: false,
                    appointment: false,
                    status: 'WAITING',
                    pos: 4,
                    waitMins: 30,
                    ticketNum: `${prefix}-105`,
                },
            ];
            for (const ent of entriesToCreate) {
                const entId = uuidv4();
                const uId = userMap[ent.userEmail];
                const priorityScore = ent.isUrgent ? 65.0 : (ent.appointment ? 30.0 : 15.0) + (5 - ent.pos) * 2;
                const priorityReason = ent.isUrgent
                    ? 'Urgent triage flag + Scheduled window'
                    : (ent.appointment ? 'Confirmed booked appointment' : 'Standard FIFO + Wait-time aging');
                await query(`INSERT INTO queue_entries (
            id, ticket_number, queue_id, user_id, guest_name, status,
            priority_score, priority_reason, position, estimated_wait_minutes,
            is_urgent, has_appointment, counter_id, staff_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`, [
                    entId,
                    ent.ticketNum,
                    queueId,
                    uId,
                    ent.name,
                    ent.status,
                    priorityScore,
                    priorityReason,
                    ent.pos,
                    ent.waitMins,
                    ent.isUrgent,
                    ent.appointment,
                    ent.status === 'IN_SERVICE' ? firstCounterId : null,
                    ent.status === 'IN_SERVICE' ? staffId : null,
                ]);
                // Queue timeline event
                await query(`INSERT INTO queue_events (id, queue_entry_id, queue_id, event_type, previous_position, new_position, reason)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                    uuidv4(),
                    entId,
                    queueId,
                    ent.status === 'IN_SERVICE' ? 'SERVICE_STARTED' : 'JOINED',
                    ent.pos + 2,
                    ent.pos,
                    ent.status === 'IN_SERVICE' ? 'Called to Counter 1' : 'Joined queue successfully',
                ]);
            }
            // Add a Fairness Event
            await query(`INSERT INTO fairness_events (id, organization_id, queue_id, alert_type, severity, explanation, metric_snapshot)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                uuidv4(),
                orgId,
                queueId,
                'WAIT_TIME_IMBALANCE',
                'INFO',
                'Queue operating within target SLA. Wait-time distribution is balanced across active counters.',
                JSON.stringify({ fairness_score: 96.4, avg_wait: 14.5, longest_wait: 30 }),
            ]);
        }
    }
    // 4. Seed Service Requirements if table is empty
    try {
        const reqCheck = await query('SELECT count(*) as count FROM service_requirements');
        if (parseInt(reqCheck.rows[0].count, 10) === 0) {
            const allServices = await query('SELECT id, name, category FROM services');
            for (const s of allServices.rows) {
                const cat = (s.category || '').toUpperCase();
                const reqs = [
                    {
                        title: 'Official Identity Verification',
                        category: 'WHAT_TO_BRING',
                        desc: 'Valid government-issued photo ID (Passport, National ID card, or Driver License).',
                        mandatory: true,
                        online: false,
                    },
                    {
                        title: 'Digital Token or Appointment QR',
                        category: 'SERVICE_REQUIREMENT',
                        desc: 'Active FAIRQUEUE digital pass confirmation ready on your mobile screen.',
                        mandatory: true,
                        online: false,
                    },
                    {
                        title: 'Supporting Documentation & Records',
                        category: 'DOCUMENT',
                        desc: cat.includes('TAX')
                            ? 'Property tax records and previous fiscal clearance certificates.'
                            : cat.includes('MED')
                                ? 'Past consultation reports, prescription history, and insurance credentials.'
                                : 'Relevant transaction slips, account numbers, or application paperwork.',
                        mandatory: true,
                        online: cat.includes('REGISTRATION') || cat.includes('TAX'),
                    },
                    {
                        title: 'Arrival 10 Minutes Prior to Turn',
                        category: 'PREPARATION',
                        desc: 'Monitor your Safe Return Window indicator to be present when called to counter.',
                        mandatory: false,
                        online: false,
                    },
                    {
                        title: 'Triage & Accessibility Support',
                        category: 'IMPORTANT_NOTE',
                        desc: 'Special assistance and priority accommodations available upon counter arrival.',
                        mandatory: false,
                        online: false,
                    },
                ];
                for (const r of reqs) {
                    await query(`INSERT INTO service_requirements (id, service_id, title, category, description, is_mandatory, can_avoid_visit)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`, [uuidv4(), s.id, r.title, r.category, r.desc, r.mandatory, r.online]);
                }
            }
            console.log('[SEED] Service requirements seeded for all services.');
        }
    }
    catch (err) {
        console.warn('[SEED] Could not seed service requirements:', err);
    }
    console.log('[SEED] Database seeded successfully with 5 sample organizations, users, and queues!');
}
// Run directly if invoked via CLI
if (process.argv[1]?.endsWith('seed.ts')) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch((err) => {
        console.error('[SEED] Error seeding database:', err);
        process.exit(1);
    });
}
