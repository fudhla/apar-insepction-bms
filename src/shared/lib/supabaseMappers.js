/**
 * Mapper Konversi antara Skema Database Supabase (snake_case)
 * dan Skema Frontend Modul User (camelCase).
 *
 * Sesuai PERSIS dengan 6 tabel:
 * 1. rigs (id, code, name, status)
 * 2. apar_types (id, media, capacity_label, has_pressure_gauge, hydrotest_years)
 * 3. hfo_users (id, rig_id, name, position, role, password)
 * 4. apars (id, asset_code, rig_id, apar_type_id, brand_model, serial_no, placement, charge_owner, manufacture_date, last_hydrotest_date, next_hydrotest_date, status, created_at)
 * 5. inspections (id, apar_id, rig_id, inspector_name, inspection_date, category, third_party_vendor, checklist, overall_status, notes, created_at)
 * 6. maintenances (id, apar_id, rig_id, inspection_id, reported_by, issue_description, action_type, status, vendor_name, evidence_photo, evidence_uploaded_by, repair_notes, admin_notes, created_at, resolved_at)
 */

// 1. CHECKLIST MAPPER (Kunci JSONB Wajib: handle, hose, nozzle, cylinderGuard, pinHandle, pressureGauge, cylinder)
export function mapChecklistToSupabase(chk = {}) {
  return {
    handle: chk.handle || 'bagus',
    hose: chk.hose || 'bagus',
    nozzle: chk.nozzle || chk.nozle || 'bagus',
    cylinderGuard: chk.cylinderGuard || chk.pengamanTabung || 'bagus',
    pinHandle: chk.pinHandle || chk.pinSegel || 'bagus',
    pressureGauge: chk.pressureGauge || 'bagus',
    cylinder: chk.cylinder || chk.tabung || 'bagus'
  };
}

export function mapChecklistFromSupabase(chk = {}) {
  if (!chk) return {};
  const nozzleVal = chk.nozzle || chk.nozle || 'bagus';
  const guardVal = chk.cylinderGuard || chk.pengamanTabung || 'bagus';
  const cylVal = chk.cylinder || chk.tabung || 'bagus';

  return {
    handle: chk.handle || 'bagus',
    hose: chk.hose || 'bagus',
    nozzle: nozzleVal,
    nozle: nozzleVal, // backward-compat untuk UI lama
    cylinderGuard: guardVal,
    pengamanTabung: guardVal, // backward-compat untuk UI lama
    pinHandle: chk.pinHandle || chk.pinSegel || 'bagus',
    pressureGauge: chk.pressureGauge || 'bagus',
    cylinder: cylVal,
    tabung: cylVal // backward-compat untuk UI lama
  };
}

// 2. RIGS MAPPER
export function fromSupabaseRig(row) {
  if (!row) return null;
  return {
    id: row.id || row.code,
    code: row.code || row.id,
    name: row.name || `Rig ${row.code || row.id}`,
    location: row.name || row.code,
    status: row.status || 'aktif'
  };
}

export function toSupabaseRig(rig) {
  return {
    id: rig.id || rig.code,
    code: rig.code || rig.id,
    name: rig.name || `Rig ${rig.code || rig.id}`,
    status: rig.status || 'aktif'
  };
}

// 3. APAR TYPES MAPPER
export function fromSupabaseAparType(row) {
  if (!row) return null;
  const media = row.media || 'Powder';
  const cap = row.capacity_label || '';
  return {
    id: row.id,
    media: row.media,
    capacityLabel: cap,
    capacity: cap,
    name: cap ? `${media} ${cap}` : media,
    agent: media,
    hasPressureGauge: Boolean(row.has_pressure_gauge),
    hydrotestYears: Number(row.hydrotest_years) || 5,
    description: `${media} ${cap}`
  };
}

export function toSupabaseAparType(type) {
  return {
    id: type.id,
    media: type.media || type.agent || (type.name ? type.name.split(' ')[0] : 'Powder'),
    capacity_label: type.capacity_label || type.capacity || '',
    has_pressure_gauge: type.hasPressureGauge !== false && type.has_pressure_gauge !== false,
    hydrotest_years: type.hydrotest_years || type.hydrotestYears || 5
  };
}

// 4. HFO USERS MAPPER
export function fromSupabaseHfoUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    rigId: row.rig_id,
    name: row.name,
    position: row.position || 'HFO',
    role: row.role || 'user',
    password: row.password || '123456'
  };
}

export function toSupabaseHfoUser(user) {
  return {
    id: user.id,
    rig_id: user.rigId || user.rig_id,
    name: user.name,
    position: user.position || 'HFO',
    role: user.role || 'user',
    password: user.password || '123456'
  };
}

// 5. APARS MAPPER
export function fromSupabaseApar(row, aparTypes = []) {
  if (!row) return null;
  const matchedType = aparTypes.find((t) => t.id === row.apar_type_id);
  const hasPressureGauge = matchedType
    ? matchedType.hasPressureGauge
    : !/co2/i.test(row.apar_type_id || '');

  return {
    id: row.id,
    assetCode: row.asset_code,
    rigId: row.rig_id,
    typeId: row.apar_type_id,
    brand: row.brand_model || '-',
    brandModel: row.brand_model || '-',
    serialNo: row.serial_no || '-',
    placement: row.placement || '-',
    location: row.placement || '-', // alias UI
    chargeOwner: row.charge_owner || 'BMS',
    manufactureDate: row.manufacture_date || null,
    lastHydrotestDate: row.last_hydrotest_date || null,
    nextHydrotestDate: row.next_hydrotest_date || null,
    status: row.status || 'layak', // 'layak' | 'perlu_perbaikan' | 'afkir'
    hasPressureGauge,
    createdAt: row.created_at,
    lastInspectionDate: null,
    lastInspectionStatus: row.status === 'perlu_perbaikan' ? 'tidak_layak' : 'layak',
    lastInspectedBy: null
  };
}

export function toSupabaseApar(apar) {
  return {
    id: apar.id,
    asset_code: apar.assetCode || apar.asset_code,
    rig_id: apar.rigId || apar.rig_id,
    apar_type_id: apar.typeId || apar.apar_type_id,
    brand_model: apar.brandModel || apar.brand || 'BMS Standard',
    serial_no: apar.serialNo || apar.serial_no || '-',
    placement: apar.placement || apar.location || 'Area Kerja Rig',
    charge_owner: apar.chargeOwner || apar.charge_owner || 'BMS',
    manufacture_date: apar.manufactureDate || apar.manufacture_date || null,
    last_hydrotest_date: apar.lastHydrotestDate || apar.last_hydrotest_date || null,
    next_hydrotest_date: apar.nextHydrotestDate || apar.next_hydrotest_date || null,
    status: apar.status || 'layak',
    created_at: apar.createdAt || new Date().toISOString()
  };
}

// 6. INSPECTIONS MAPPER
export function fromSupabaseInspection(row, apars = []) {
  if (!row) return null;
  const targetApar = apars.find((a) => a.id === row.apar_id);
  const checklist = mapChecklistFromSupabase(row.checklist);

  return {
    id: row.id,
    aparId: row.apar_id,
    assetCode: targetApar?.assetCode || row.apar_id,
    rigId: row.rig_id,
    inspectorName: row.inspector_name || 'HFO Lapangan',
    inspectionDate: row.inspection_date,
    category: row.category || 'bulanan',
    thirdPartyVendor: row.third_party_vendor || '',
    checklist,
    overallStatus: row.overall_status || 'layak',
    notes: row.notes || '',
    issueDescription: row.notes || '',
    findingPhoto: row.inspection_photo || null,
    inspectionPhoto: row.inspection_photo || null,
    createdAt: row.created_at
  };
}

export function toSupabaseInspection(insp) {
  const payload = {
    id: insp.id,
    apar_id: insp.aparId || insp.apar_id,
    rig_id: insp.rigId || insp.rig_id,
    inspector_name: insp.inspectorName || insp.inspector_name || 'HFO Lapangan',
    inspection_date: insp.inspectionDate || insp.inspection_date,
    category: insp.category || 'bulanan',
    third_party_vendor: insp.category === 'tahunan' ? (insp.thirdPartyVendor || insp.third_party_vendor || '') : null,
    checklist: mapChecklistToSupabase(insp.checklist),
    overall_status: insp.overallStatus || insp.overall_status || 'layak',
    notes: insp.notes || insp.issueDescription || null,
    created_at: insp.createdAt || new Date().toISOString()
  };

  const photo = insp.findingPhoto || insp.inspectionPhoto || insp.inspection_photo;
  if (photo) {
    payload.inspection_photo = photo;
  }

  return payload;
}

// 7. MAINTENANCES MAPPER
export function fromSupabaseMaintenance(row, apars = []) {
  if (!row) return null;
  const targetApar = apars.find((a) => a.id === row.apar_id);
  const dateStr = row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0];

  return {
    id: row.id,
    aparId: row.apar_id,
    assetCode: targetApar?.assetCode || row.apar_id,
    rigId: row.rig_id,
    inspectionId: row.inspection_id || null,
    reportedBy: row.reported_by || 'HFO Lapangan',
    inspectorName: row.reported_by || 'HFO Lapangan',
    reportedDate: dateStr,
    issueDescription: row.issue_description || '',
    actionType: row.action_type || 'perbaikan',
    status: row.status || 'open', // 'open' | 'in_progress' | 'pending_review' | 'closed'
    vendorName: row.vendor_name || '',
    findingPhoto: row.finding_photo || null,
    evidencePhoto: row.evidence_photo || null,
    evidenceUploadedBy: row.evidence_uploaded_by || null,
    repairNotes: row.repair_notes || '',
    adminNotes: row.admin_notes || '',
    createdAt: row.created_at,
    resolvedAt: row.resolved_at || null,
    updatedAt: row.resolved_at ? row.resolved_at.split('T')[0] : dateStr
  };
}

export function toSupabaseMaintenance(m) {
  const payload = {
    id: m.id,
    apar_id: m.aparId || m.apar_id,
    rig_id: m.rigId || m.rig_id,
    inspection_id: m.inspectionId || m.inspection_id || null,
    reported_by: m.reportedBy || m.reported_by || m.inspectorName || 'HFO Lapangan',
    issue_description: m.issueDescription || m.issue_description || '',
    action_type: m.actionType || m.action_type || 'perbaikan',
    status: m.status || 'open',
    vendor_name: m.vendorName || m.vendor_name || null,
    evidence_photo: m.evidencePhoto || m.evidence_photo || null,
    evidence_uploaded_by: m.evidenceUploadedBy || m.evidence_uploaded_by || null,
    repair_notes: m.repairNotes || m.repair_notes || null,
    admin_notes: m.adminNotes || m.admin_notes || null,
    created_at: m.createdAt || (m.reportedDate ? `${m.reportedDate}T00:00:00Z` : new Date().toISOString()),
    resolved_at: m.resolvedAt || m.resolved_at || null
  };

  const photo = m.findingPhoto || m.finding_photo;
  if (photo) {
    payload.finding_photo = photo;
  }

  return payload;
}
