# REAL-TIME FAIR QUEUE SYSTEM

> **Tagline:** “Smarter Queues. Real-Time Decisions. Less Waiting.”  
> **Core Promise:** “Join once. See your position. Understand every change. Know what to expect.”

A real-time, configurable queue orchestration platform that dynamically manages waiting requests, estimates service time, provides transparent queue decisions, and continuously adapts to changing queue conditions.

---

## 🌟 Key Differentiators

Unlike traditional static token dispensers, FairQueue combines:
1. **Real-Time Queue Management**: Instant bi-directional state synchronization via WebSockets (Socket.IO).
2. **Dynamic Priority Engine**: Legitimate operational factors (wait time aging, triage urgency, scheduled appointment bonus) with mathematically guaranteed starvation prevention.
3. **Wait-Time Prediction**: Non-linear multi-server estimation based on active counters, rolling service velocities, and line positions with explicit confidence scoring.
4. **Explainable Queue Decisions**: "Why Did My Position Change?" causal audit explanations with delta history.
5. **Fairness Monitoring & Replay**: Continuous evaluation of wait dispersion, backward displacement detection, and step-by-step queue replay player.
6. **What-If Queue Simulator**: Discrete event prediction for arrival surges, counter outages, and service spikes.
7. **No-Show Management**: 120-second presence response timer with "I'm Ready" and "Need More Time" options.
8. **Interactive Demo Mode**: Dedicated simulation bar to inject users, trigger urgent requests, complete services, and test counter failures.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (Tested on v24.16.0)
- **Database**: Automatic zero-setup! Persistent PostgreSQL is embedded via `@electric-sql/pglite` in `./server/data/postgres_db`. (Optionally, point `DATABASE_URL` to external PostgreSQL in `.env`).

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Seed Database
Seeds 5 diverse industry organizations (Clinic, Bank, Government, University, Tech Support), staff, counters, and initial live queue tickets:
```bash
npm run seed
```

### 4. Run the Full-Stack Application
Runs both Express backend (`http://localhost:5000`) and React frontend (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

### 5. Run Automated Tests
```bash
npm test
```

---

## 🔐 Sample Demo Accounts

All sample accounts are pre-seeded and ready to use:

| Role | Email | Password | Organization | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@fairqueue.io` | `Admin123!` | Global Platform | Full administrative oversight |
| **Org Admin** | `dr.sarah@citycare.org` | `Admin123!` | City Care Clinic (Hospital) | Triage rules, staff, analytics |
| **Staff Member** | `nurse.elena@citycare.org` | `User123!` | City Care Clinic | Counter console, call next |
| **Org Admin** | `branchmgr@unitybank.com` | `Admin123!` | Unity Bank | Banking queues, loan tellers |
| **User** | `john.doe@example.com` | `User123!` | Consumer | Active ticket tracking |
| **User** | `alice.smith@example.com` | `User123!` | Consumer | Urgent triage ticket |

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons, QRCode.react, Socket.IO Client.
- **Backend**: Node.js, Express, TypeScript (ESM), Socket.IO, JWT, bcryptjs, Zod.
- **Database**: PostgreSQL (Dual-mode: `@electric-sql/pglite` embedded persistent storage or native `pg` pool).
- **Engines**:
  - `PriorityEngine`: Calculates dynamic scores: $P = W_{wait} \cdot (\Delta t) + W_{urgency} \cdot U + W_{appt} \cdot A + S_{base}$.
  - `WaitTimeEngine`: Multi-server parallel queue throughput model with confidence rating.
  - `FairnessEngine`: Gini wait-time dispersion, SLA violation alerting, and starvation monitoring.
  - `QueueEngine`: Real-time lifecycle state machine, position recalculation, causal diff logger.
  - `SimulatorEngine`: Discrete event predictive simulator for hypothetical operational scenarios.

---

## 📡 REST API & Socket.IO Endpoints

### Authentication
- `POST /api/auth/register`: Create user account
- `POST /api/auth/login`: Authenticate and receive JWT
- `GET /api/auth/profile`: Get current profile
- `PUT /api/auth/profile`: Update profile
- `POST /api/auth/change-password`: Change password

### Queues & Tickets
- `GET /api/queues`: List all queues
- `GET /api/queues/:id`: Live queue state, waiting line, counters, fairness report
- `POST /api/queues/:id/join`: Issue digital ticket
- `POST /api/queues/:id/pause`: Toggle queue pause/resume
- `POST /api/queues/:id/reorder`: Force dynamic recalculation
- `PUT /api/queues/:id`: Update configuration (rules, weights, capacity)
- `GET /api/queue-entries/active`: Active tickets for user
- `GET /api/queue-entries/:id`: Ticket detail & transparent lifecycle timeline
- `POST /api/queue-entries/:id/call`: Staff calls next ticket
- `POST /api/queue-entries/:id/start`: Staff initiates service
- `POST /api/queue-entries/:id/complete`: Staff fulfills service
- `POST /api/queue-entries/:id/no-show`: Mark ticket as no-show
- `POST /api/queue-entries/:id/respond`: User clicks "I'm Ready" or "Need More Time"

### Analytics & Simulation
- `GET /api/analytics/overview`: High-level KPI summary
- `GET /api/analytics/charts`: Hourly throughput and fairness trends
- `GET /api/analytics/export-csv`: Downloadable CSV report
- `GET /api/fairness/status`: Algorithmic fairness report & alerts
- `GET /api/fairness/replay`: Step-by-step queue evolution frames
- `POST /api/simulator/run`: What-If capacity simulation
- `GET /api/audit`: Immutable compliance audit trail

### Real-Time Socket.IO Events
- `queue:updated`: Broadcasted to room `queue:${queueId}` when state shifts
- `queue:called`: Broadcasted when staff calls next user
- `queue:reordered`: Dispatched when positions dynamically re-align
- `queue:service_started` & `queue:service_completed`
- `user:turn_called`: Direct notification sent to user private room
