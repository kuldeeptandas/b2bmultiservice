import { isSupabaseConfigured, supabaseRestFetch } from './supabaseClient';
import { B2BApplication, ServiceItem, getPortalServices, savePortalServices } from './b2bStore';
import { getApplications as getLocalApplications, updateApplicationStatus as updateLocalApplicationStatus } from './firebaseService';

// ─── APPLICATIONS API ──────────────────────────────────────────────

export async function fetchApplicationsFromSupabase(): Promise<B2BApplication[]> {
  if (!isSupabaseConfigured()) {
    return getLocalApplications();
  }

  try {
    // PostgREST: GET /applications?select=*&order=created_at.desc
    const { data, error } = await supabaseRestFetch<any[]>('/applications?select=*&order=created_at.desc');
    
    if (error || !Array.isArray(data)) {
      console.warn('Supabase fetchApplications fallback to local:', error);
      return getLocalApplications();
    }

    // Map database snake_case or json to B2BApplication
    const mapped: B2BApplication[] = data.map((row) => ({
      id: row.id,
      trackingNumber: row.tracking_number || row.trackingNumber,
      serviceId: row.service_id || row.serviceId,
      serviceCategory: row.service_category || row.serviceCategory,
      serviceTitle: row.service_title || row.serviceTitle,
      userId: row.user_id || row.userId,
      applicantName: row.applicant_name || row.applicantName,
      applicantPhone: row.applicant_phone || row.applicantPhone,
      applicantEmail: row.applicant_email || row.applicantEmail || '',
      businessName: row.business_name || row.businessName,
      userRole: row.user_role || row.userRole || 'customer',
      agentCode: row.agent_code || row.agentCode,
      status: row.status,
      statusColor: row.status_color || row.statusColor || 'blue',
      appliedDate: row.applied_date || row.appliedDate || (row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')),
      pointsPaid: row.points_paid || row.pointsPaid || 0,
      createdAt: row.created_at || row.createdAt,
      updatedAt: row.updated_at || row.updatedAt,
      remarks: row.remarks,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : (row.details || {}),
      documents: typeof row.documents === 'string' ? JSON.parse(row.documents) : (row.documents || []),
    }));

    return mapped.length > 0 ? mapped : getLocalApplications();
  } catch (err) {
    console.warn('Error reading from Supabase:', err);
    return getLocalApplications();
  }
}

export async function saveApplicationToSupabase(app: B2BApplication): Promise<B2BApplication> {
  if (!isSupabaseConfigured()) {
    return app;
  }

  try {
    const payload = {
      id: app.id,
      tracking_number: app.trackingNumber,
      service_id: app.serviceId,
      service_category: app.serviceCategory,
      service_title: app.serviceTitle,
      user_id: app.userId,
      applicant_name: app.applicantName,
      applicant_phone: app.applicantPhone,
      applicant_email: app.applicantEmail || null,
      business_name: app.businessName || null,
      user_role: app.userRole,
      agent_code: app.agentCode || null,
      status: app.status,
      points_paid: app.pointsPaid || 0,
      created_at: app.createdAt || new Date().toISOString(),
      updated_at: app.updatedAt || new Date().toISOString(),
      remarks: app.remarks || null,
      details: app.details || {},
      documents: app.documents || [],
    };

    const { error } = await supabaseRestFetch('/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (error) {
      console.warn('Supabase application insert warning:', error);
    }
  } catch (err) {
    console.warn('Failed to push application to Supabase:', err);
  }

  return app;
}

export async function updateApplicationStatusInSupabase(
  id: string,
  newStatus: B2BApplication['status'],
  remarks?: string
): Promise<void> {
  // Update local store
  updateLocalApplicationStatus(id, newStatus, remarks);

  if (!isSupabaseConfigured()) return;

  try {
    const payload: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (remarks) payload.remarks = remarks;

    // PATCH /applications?id=eq.<id>
    await supabaseRestFetch(`/applications?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Failed to update application in Supabase:', err);
  }
}

// ─── SERVICES CONFIGURATOR API ─────────────────────────────────────

export async function fetchServicesFromSupabase(): Promise<ServiceItem[]> {
  if (!isSupabaseConfigured()) {
    return getPortalServices();
  }

  try {
    const { data, error } = await supabaseRestFetch<any[]>('/portal_services?select=*&order=id.asc');
    if (error || !Array.isArray(data) || data.length === 0) {
      return getPortalServices();
    }

    const mapped: ServiceItem[] = data.map((row) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      tagline: row.tagline,
      basePointsCost: row.base_points_cost || row.basePointsCost || 0,
      baseAgentCommission: row.base_agent_commission || row.baseAgentCommission || 0,
      customFields: typeof row.custom_fields === 'string' ? JSON.parse(row.custom_fields) : (row.custom_fields || []),
      icon: row.icon || 'Document',
      color: row.color || 'blue',
      badge: row.badge,
      govtFee: row.govt_fee || row.govtFee,
      consultationFee: row.consultation_fee || row.consultationFee,
      processingTime: row.processing_time || row.processingTime,
      requiredDocs: typeof row.required_docs === 'string' ? JSON.parse(row.required_docs) : (row.required_docs || []),
      description: row.description,
    }));

    return mapped;
  } catch (err) {
    return getPortalServices();
  }
}

export async function syncServicesToSupabase(services: ServiceItem[]): Promise<void> {
  savePortalServices(services);

  if (!isSupabaseConfigured()) return;

  try {
    const payload = services.map((s) => ({
      id: s.id,
      category: s.category,
      title: s.title,
      tagline: s.tagline,
      base_points_cost: s.basePointsCost,
      base_agent_commission: s.baseAgentCommission,
      custom_fields: s.customFields || [],
    }));

    // Upsert into portal_services
    await supabaseRestFetch('/portal_services', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Failed to sync services to Supabase:', err);
  }
}
