// API Client for Real-Time Fair Queue System

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data?: any;
  alreadyInQueue?: boolean;
  entryId?: string;
  ticketNumber?: string;
  position?: number;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
    this.data = data;
    if (data && typeof data === 'object') {
      Object.assign(this, data);
    }
  }
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('fq_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const savedUser = localStorage.getItem('fq_user');
  if (savedUser) {
    try {
      const u = JSON.parse(savedUser);
      if (u.id) headers['x-user-id'] = u.id;
      if (u.email) headers['x-user-email'] = u.email;
      if (u.displayName || u.fullName) headers['x-user-name'] = u.displayName || u.fullName;
    } catch {
      // Ignored
    }
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'An unexpected server error occurred.';
    let errorData: any = {};
    try {
      const json = await res.json();
      errorData = json;
      errorMsg = json.error || json.message || errorMsg;
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    const err = new ApiError(errorMsg, res.status, errorData);
    throw err;
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (data: any) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<{ token: string; user: any; message: string }>),

  register: (data: any) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<{ token: string; user: any; message: string }>),

  getProfile: () =>
    fetch(`${API_BASE}/auth/profile`, { headers: getAuthHeaders() }).then(
      handleResponse<{ user: any }>
    ),

  updateProfile: (data: any) =>
    fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ message: string }>),

  changePassword: (data: any) =>
    fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ message: string }>),

  forgotPassword: (email: string) =>
    fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then(handleResponse<{ message: string; demoResetToken?: string }>),

  resetPassword: (data: any) =>
    fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<{ message: string }>),

  // Organizations
  getOrganizations: () =>
    fetch(`${API_BASE}/organizations`, { headers: getAuthHeaders() }).then(
      handleResponse<{ organizations: any[] }>
    ),

  getOrganization: (id: string) =>
    fetch(`${API_BASE}/organizations/${id}`, { headers: getAuthHeaders() }).then(
      handleResponse<{
        organization: any;
        services: any[];
        queues: any[];
        counters: any[];
      }>
    ),

  createOrganization: (data: any) =>
    fetch(`${API_BASE}/organizations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<any>),

  updateOrganization: (id: string, data: any) =>
    fetch(`${API_BASE}/organizations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<any>),

  // Queues
  getQueues: (orgId?: string) => {
    const queryStr = orgId ? `?organizationId=${orgId}` : '';
    return fetch(`${API_BASE}/queues${queryStr}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ queues: any[] }>);
  },

  getQueue: (id: string) =>
    fetch(`${API_BASE}/queues/${id}`, { headers: getAuthHeaders() }).then(
      handleResponse<{
        queue: any;
        waitingEntries: any[];
        inServiceEntries: any[];
        counters: any[];
        fairness: any;
      }>
    ),

  joinQueue: (queueId: string, data: any) =>
    fetch(`${API_BASE}/queues/${queueId}/join`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(
      handleResponse<{
        message: string;
        entryId: string;
        ticketNumber: string;
        position: number;
        priorityScore: number;
      }>
    ),

  pauseQueue: (queueId: string) =>
    fetch(`${API_BASE}/queues/${queueId}/pause`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse<{ message: string; status: string }>),

  reorderQueue: (queueId: string) =>
    fetch(`${API_BASE}/queues/${queueId}/reorder`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse<{ message: string }>),

  saveQueueConfig: (queueId: string, data: any) =>
    fetch(`${API_BASE}/queues/${queueId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ message: string }>),

  // Queue Entries & Tickets
  getActiveTickets: () =>
    fetch(`${API_BASE}/queue-entries/active`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ activeTickets: any[] }>),

  getTicketHistory: () =>
    fetch(`${API_BASE}/queue-entries/history`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ history: any[] }>),

  getTicketDetail: (id: string) =>
    fetch(`${API_BASE}/queue-entries/${id}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ entry: any; timeline: any[] }>),

  callNext: (entryId: string, data: { counterId: string; queueId?: string }) =>
    fetch(`${API_BASE}/queue-entries/${entryId}/call`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<any>),

  startService: (entryId: string) =>
    fetch(`${API_BASE}/queue-entries/${entryId}/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse<any>),

  completeService: (entryId: string, data?: { outcome?: string; notes?: string }) =>
    fetch(`${API_BASE}/queue-entries/${entryId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {}),
    }).then(handleResponse<any>),

  markNoShow: (entryId: string, reason?: string) =>
    fetch(`${API_BASE}/queue-entries/${entryId}/no-show`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    }).then(handleResponse<any>),

  respondTurn: (entryId: string, action: 'READY' | 'NEED_TIME') =>
    fetch(`${API_BASE}/queue-entries/${entryId}/respond`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action }),
    }).then(handleResponse<any>),

  leaveQueue: (entryId: string) =>
    fetch(`${API_BASE}/queue-entries/${entryId}/leave`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse<any>),

  toggleUrgent: (entryId: string) =>
    fetch(`${API_BASE}/queue-entries/${entryId}/urgent`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse<{ message: string; isUrgent: boolean }>),

  // Counters
  getCounters: (orgId?: string, queueId?: string) => {
    const params = new URLSearchParams();
    if (orgId) params.append('organizationId', orgId);
    if (queueId) params.append('queueId', queueId);
    return fetch(`${API_BASE}/counters?${params.toString()}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ counters: any[] }>);
  },

  updateCounter: (counterId: string, data: any) =>
    fetch(`${API_BASE}/counters/${counterId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<any>),

  // Analytics
  getAnalyticsOverview: (orgId?: string) => {
    const queryStr = orgId ? `?organizationId=${orgId}` : '';
    return fetch(`${API_BASE}/analytics/overview${queryStr}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<any>);
  },

  getAnalyticsCharts: (orgId?: string) => {
    const queryStr = orgId ? `?organizationId=${orgId}` : '';
    return fetch(`${API_BASE}/analytics/charts${queryStr}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<any>);
  },

  // Fairness & Replay
  getFairnessStatus: (queueId?: string) => {
    const queryStr = queueId ? `?queueId=${queueId}` : '';
    return fetch(`${API_BASE}/fairness/status${queryStr}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ report: any; recentEvents: any[] }>);
  },

  getFairnessReplay: (queueId?: string) => {
    const queryStr = queueId ? `?queueId=${queueId}` : '';
    return fetch(`${API_BASE}/fairness/replay${queryStr}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ totalFrames: number; frames: any[] }>);
  },

  // What-If Simulator
  runSimulation: (data: any) =>
    fetch(`${API_BASE}/simulator/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<any>),

  // Audit Logs
  getAuditLogs: (action?: string) => {
    const queryStr = action ? `?action=${action}` : '';
    return fetch(`${API_BASE}/audit${queryStr}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ logs: any[] }>);
  },

  // Notifications
  getNotifications: () =>
    fetch(`${API_BASE}/notifications`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ notifications: any[]; unreadCount: number }>),

  markNotificationRead: (id: string) =>
    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    }).then(handleResponse<any>),

  markAllNotificationsRead: () =>
    fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    }).then(handleResponse<any>),

  // Demo Mode
  demoAddUsers: (data: { count?: number; queueId?: string }) =>
    fetch(`${API_BASE}/demo/add-users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<any>),

  demoSimulateUrgent: (queueId?: string) =>
    fetch(`${API_BASE}/demo/simulate-urgent`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ queueId }),
    }).then(handleResponse<any>),

  demoSimulateService: (queueId?: string) =>
    fetch(`${API_BASE}/demo/simulate-service`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ queueId }),
    }).then(handleResponse<any>),

  demoSimulateNoShow: (queueId?: string) =>
    fetch(`${API_BASE}/demo/simulate-noshow`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ queueId }),
    }).then(handleResponse<any>),

  demoSimulateCounterFail: (queueId?: string) =>
    fetch(`${API_BASE}/demo/simulate-counter-fail`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ queueId }),
    }).then(handleResponse<any>),

  demoReset: (queueId?: string) =>
    fetch(`${API_BASE}/demo/reset`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ queueId }),
    }).then(handleResponse<any>),

  // AI Queue Vision
  analyzeVision: (data: { image?: string; filename?: string }) =>
    fetch(`${API_BASE}/vision/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(
      handleResponse<{
        disclaimer: string;
        peopleDetected: number;
        visibleCounters: number;
        estimatedQueueLength: number;
        queueDensity: 'LOW' | 'MEDIUM' | 'HIGH';
        crowdingStatus: 'CLEAR' | 'MODERATE' | 'CONGESTED';
        activeBottlenecks: string[];
        recommendation: string;
        confidenceScore: number;
      }>
    ),

  // Visit Intelligence
  getServiceRequirements: (serviceId: string) =>
    fetch(`${API_BASE}/visits/requirements/${serviceId}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ requirements: any[] }>),

  getVisitReadiness: (serviceId: string) =>
    fetch(`${API_BASE}/visits/readiness/${serviceId}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ score: number; checklist: any[]; total: number; completed: number }>),

  toggleReadinessItem: (serviceId: string, requirementId: string, status?: string) =>
    fetch(`${API_BASE}/visits/readiness/${serviceId}/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ requirementId, status }),
    }).then(handleResponse<{ message: string; readiness: any }>),

  canAvoidVisit: (serviceId: string) =>
    fetch(`${API_BASE}/visits/can-avoid/${serviceId}`, {
      headers: getAuthHeaders(),
    }).then(
      handleResponse<{
        serviceName: string;
        status: 'ONLINE OPTION AVAILABLE' | 'PHYSICAL VISIT REQUIRED' | 'CONTACT FACILITY';
        title: string;
        description: string;
        actionUrl?: string;
        actionText?: string;
        requirementsNeeded: string[];
      }>
    ),

  preCheckDocument: (data: { serviceId?: string; fileType?: string; fileName?: string }) =>
    fetch(`${API_BASE}/visits/documents/pre-check`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(
      handleResponse<{
        documentDetected: boolean;
        readable: boolean;
        potentiallyIncomplete: boolean;
        missingFields: string[];
        confidenceScore: number;
        disclaimer: string;
        status: string;
      }>
    ),

  getDocuments: () =>
    fetch(`${API_BASE}/visits/documents`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ documents: any[] }>),

  getFacilitiesIntelligence: () =>
    fetch(`${API_BASE}/visits/facilities`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ facilities: any[] }>),

  getFavorites: () =>
    fetch(`${API_BASE}/visits/favorites`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ favorites: any[] }>),

  toggleFavorite: (data: { organizationId?: string; serviceId?: string }) =>
    fetch(`${API_BASE}/visits/favorites/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ isFavorite: boolean }>),

  submitVisitFeedback: (data: { entryId?: string; organizationId?: string; serviceId?: string; rating: number; feedback?: string }) =>
    fetch(`${API_BASE}/visits/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ message: string; feedbackId: string }>),

  getQueueTrends: (period: 'today' | '7d' | '30d' = 'today') =>
    fetch(`${API_BASE}/visits/trends?period=${period}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ period: string; queueLengthTrend: any[]; waitTimeTrend: any[]; serviceRate: any; counterActivity: any[] }>),

  globalSearch: (query: string) =>
    fetch(`${API_BASE}/visits/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ facilities: any[]; services: any[]; queues: any[] }>),
  // ========================================================
  // QEVORA PLATFORM APIS
  // ========================================================
  getQevoraServices: (params?: { category?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.search) q.append('search', params.search);
    return fetch(`${API_BASE}/qevora/services?${q.toString()}`, {
      headers: getAuthHeaders(),
    })
      .then(handleResponse<{ services: any[] }>)
      .catch(() => ({
        services: [
          {
            id: 'srv_kyc',
            name: 'Bank KYC Verification & Re-KYC',
            description: 'Biometric and document verification for savings & current accounts',
            category: 'BANKING',
            organizationName: 'Unity Bank',
            location: '500 Wall Street Financial Plaza',
            availability: 'AVAILABLE',
            staffStatus: 'Staff on duty',
            expectedWait: 15,
            currentQueueCount: 3,
            requirements: ['Aadhaar / National ID', 'PAN Card', 'Address Proof'],
          },
          {
            id: 'srv_opd',
            name: 'General Medicine & Diagnostic OPD',
            description: 'Doctor outpatient consultation and diagnostic screening',
            category: 'HEALTHCARE',
            organizationName: 'City Care Clinic',
            location: '742 Evergreen Terrace, Medical District',
            availability: 'AVAILABLE',
            staffStatus: 'Dr. Sarah Jenkins available',
            expectedWait: 20,
            currentQueueCount: 4,
            requirements: ['Doctor Referral / Old Prescription', 'Government Health ID'],
          },
          {
            id: 'srv_gov',
            name: 'Property Registration & Deeds Attestation',
            description: 'Sub-registrar biometrics, witness signoff, and title verification',
            category: 'GOVERNMENT',
            organizationName: 'Citizen Service Center',
            location: '100 Federal Plaza, Suite 400',
            availability: 'DELAYED',
            staffStatus: 'Counter 2 temporarily delayed',
            delayReason: 'Server network sync in progress',
            expectedRecovery: '4:30 PM',
            expectedWait: 35,
            currentQueueCount: 6,
            requirements: ['Draft Deed Paper', 'Buyer & Seller IDs', 'Two Identified Witnesses'],
          },
          {
            id: 'srv_edu',
            name: 'College Admissions Certificate Verification',
            description: 'Original academic transcript verification and student ID issuance',
            category: 'EDUCATION',
            organizationName: 'Campus Administration',
            location: 'Academic Block A, Ground Floor',
            availability: 'AVAILABLE',
            staffStatus: 'Registrar on duty',
            expectedWait: 10,
            currentQueueCount: 2,
            requirements: ['10th/12th Marksheets', 'Transfer Certificate', 'Study Certificate'],
          },
          {
            id: 'srv_emp',
            name: 'Employment Verification & Background Attestation',
            description: 'Official background checks, civil status, and police clearance attestation',
            category: 'EMPLOYMENT',
            organizationName: 'Citizen Service Center',
            location: 'Central Registry Office',
            availability: 'AVAILABLE',
            staffStatus: 'Officer on duty',
            expectedWait: 15,
            currentQueueCount: 1,
            requirements: ['Offer Letter', 'Identity Proof', 'Address Verification'],
          },
        ],
      }));
  },

  updateServiceAvailability: (id: string, data: any) =>
    fetch(`${API_BASE}/qevora/services/${id}/availability`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ message: string; status: string }>),

  snapUnderstandDocument: (data: { documentText?: string; documentName?: string; sampleType?: string }) =>
    fetch(`${API_BASE}/qevora/snap-understand`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ success: boolean; analysis: any }>),

  getServicePassport: () =>
    fetch(`${API_BASE}/qevora/passport`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ passport: any[]; consents: any[] }>),

  saveServiceConsent: (data: { serviceId: string; grantedFields: string[]; status: string }) =>
    fetch(`${API_BASE}/qevora/passport/consent`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ message: string; consentId: string }>),

  getServiceProxies: () =>
    fetch(`${API_BASE}/qevora/proxies`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ proxies: any[] }>),

  createServiceProxy: (data: any) =>
    fetch(`${API_BASE}/qevora/proxies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ message: string; proxyId: string }>),

  revokeServiceProxy: (id: string) =>
    fetch(`${API_BASE}/qevora/proxies/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse<{ message: string }>),

  getGroupBookings: () =>
    fetch(`${API_BASE}/qevora/group-bookings`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ bookings: any[] }>),

  createGroupBooking: (data: any) =>
    fetch(`${API_BASE}/qevora/group-bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ message: string; bookingId: string }>),

  confirmGroupBookingMember: (bookingId: string, data: { memberId: string; status: string }) =>
    fetch(`${API_BASE}/qevora/group-bookings/${bookingId}/confirm`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ message: string; overallStatus: string }>),

  getOpportunityRescue: () =>
    fetch(`${API_BASE}/qevora/opportunity-rescue`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ rescues: any[] }>),

  recoverOpportunity: (data: { rescueId: string; selectedOptionId: string }) =>
    fetch(`${API_BASE}/qevora/opportunity-rescue/recover`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ message: string }>),

  getReusableVerifications: () =>
    fetch(`${API_BASE}/qevora/verifications/reusable`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ verifications: any[] }>),

  reuseVerification: (data: { serviceId?: string; verificationId: string }) =>
    fetch(`${API_BASE}/qevora/verifications/reuse`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<{ message: string; reuseId: string }>),

  getQevoraActiveServices: () =>
    fetch(`${API_BASE}/qevora/active-services`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ activeTickets: any[]; groupBookings: any[] }>),

  getQevoraAlerts: () =>
    fetch(`${API_BASE}/qevora/alerts`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ alerts: any[] }>),
};

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  organizationName?: string;
  location: string;
  status: 'AVAILABLE' | 'DELAYED' | 'UNAVAILABLE';
  staff_status?: string;
  delay_reason?: string;
  expected_recovery?: string;
  expected_wait_min?: number;
  current_wait?: number;
  requirements?: string[];
}

export interface ActiveServiceItem {
  id: string;
  type: 'QUEUE' | 'APPOINTMENT' | 'GROUP_BOOKING';
  title: string;
  orgName: string;
  status: string;
  ticketNumber?: string;
  position?: number;
  wait?: number;
  scheduled?: string;
  isCalled?: boolean;
}

export interface ActionableAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  action?: string;
  severity?: string;
}

export interface OpportunityRescueItem {
  id: string;
  service_name: string;
  original_time: string;
  status: string;
  risk_reason: string;
  recovery_options: Array<{
    id: string;
    slot_type: string;
    time: string;
    location: string;
    availability_status: string;
  }>;
}

export const qevoraApi = {
  getServices: (params?: { category?: string; search?: string }) =>
    api.getQevoraServices(params).then((r: any) => ({
      success: true,
      services: (r.services || []).map((s: any) => ({
        ...s,
        status: s.status || s.availability || 'AVAILABLE',
        staff_status: s.staff_status || s.staffStatus,
        delay_reason: s.delay_reason || s.delayReason,
        expected_recovery: s.expected_recovery || s.expectedRecovery,
        expected_wait_min: s.expected_wait_min || s.expectedWait || 15,
      })),
    })),

  updateAvailability: (id: string, data: any) =>
    api.updateServiceAvailability(id, data).then(() => ({ success: true })),

  snapAndUnderstand: (data: { document_text?: string; language?: string }) =>
    api.snapUnderstandDocument({ documentText: data.document_text }).then((r: any) => ({
      success: true,
      analysis: r.analysis,
    })),

  getServicePassport: () =>
    api.getServicePassport().then((r: any) => ({
      success: true,
      passport: r.passport || [],
      consents: r.consents || [],
    })),

  saveServiceConsent: (data: { service_id: string; granted_fields: string[]; status: string }) =>
    api.saveServiceConsent({
      serviceId: data.service_id,
      grantedFields: data.granted_fields,
      status: data.status,
    }).then(() => ({ success: true })),

  getProxies: () =>
    api.getServiceProxies().then((r: any) => ({
      success: true,
      proxies: r.proxies || [],
    })),

  createProxy: (data: any) =>
    api.createServiceProxy({
      proxyName: data.proxy_name,
      relationship: data.relationship,
      phone: data.phone,
      purpose: data.purpose,
      permissionType: data.permission_type,
      hoursValid: data.hours_valid,
      allowedActions: data.allowed_actions,
      deniedActions: data.denied_actions,
      serviceId: data.service_id,
    }).then(() => ({ success: true })),

  revokeProxy: (id: string) =>
    api.revokeServiceProxy(id).then(() => ({ success: true })),

  getGroupBookings: () =>
    api.getGroupBookings().then((r: any) => ({
      success: true,
      bookings: r.bookings || [],
    })),

  confirmGroupMember: (bookingId: string, data: { member_id: string; status: string }) =>
    api.confirmGroupBookingMember(bookingId, {
      memberId: data.member_id,
      status: data.status,
    }).then(() => ({ success: true })),

  getOpportunityRecovery: () =>
    api.getOpportunityRescue().then((r: any) => ({
      success: true,
      opportunities: (r.rescues || []).map((rc: any) => ({
        id: rc.id,
        service_name: rc.service_name || 'Hospital OPD Consultation',
        original_time: rc.original_time || '10:00 AM Today',
        status: rc.status || 'AT_RISK',
        risk_reason: rc.reason_cancelled || rc.risk_reason || 'Doctor emergency delay',
        recovery_options: rc.recovery_options || rc.alternative_options || [],
      })),
    })),

  recoverOpportunity: (opportunityId: string, slotId: string) =>
    api.recoverOpportunity({ rescueId: opportunityId, selectedOptionId: slotId }).then(() => ({
      success: true,
    })),

  getReusableVerifications: () =>
    api.getReusableVerifications().then((r: any) => ({
      success: true,
      verifications: r.verifications || [],
    })),

  reuseVerification: (data: { verification_id: string; service_id?: string }) =>
    api.reuseVerification({
      verificationId: data.verification_id,
      serviceId: data.service_id,
    }).then(() => ({ success: true })),

  getActiveServices: () =>
    api.getQevoraActiveServices().then((r: any) => {
      const activeTickets = r.activeTickets || [];
      const servicesList: ActiveServiceItem[] = activeTickets.map((t: any) => ({
        id: t.id,
        type: 'QUEUE',
        title: t.service_name || 'Service Queue',
        orgName: t.organization_name || 'Facility',
        status: t.status === 'CALLED' ? 'Called to Counter' : `Waiting — Position #${t.position || 1}`,
        ticketNumber: `#${t.prefix || 'T'}-${t.ticket_number}`,
        position: t.position || 1,
        wait: t.wait_time_minutes || 10,
        isCalled: t.status === 'CALLED',
      }));

      return {
        success: true,
        activeServices: servicesList,
      };
    }),

  getActionableAlerts: () =>
    api.getQevoraAlerts().then((r: any) => ({
      success: true,
      alerts: (r.alerts || []).map((a: any) => ({
        id: a.id,
        type: a.type || 'SYSTEM_NOTICE',
        title: a.title,
        message: a.message,
        time: a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        action: a.action_link || a.action,
        severity: a.severity || 'INFO',
      })),
    })),
};
