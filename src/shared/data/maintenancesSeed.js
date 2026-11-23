export const maintenancesSeed = [
  {
    id: 'mnt-bms18-001',
    aparId: 'apar-bms18-002',
    assetCode: 'APAR-BMS18-002',
    rigId: 'BMS-18',
    inspectorName: 'Fudhla',
    reportedDate: '2025-06-19',
    issueDescription: 'Bodi tabung korosi parah dan penyok di dekat dasar tabung.',
    findingPhoto: null,
    status: 'in_progress', // 'open' | 'in_progress' | 'pending_review' | 'closed'
    repairNotes: '',
    evidencePhoto: null,
    updatedAt: '2025-06-20'
  },
  {
    id: 'mnt-bms10-001',
    aparId: 'apar-bms10-001',
    assetCode: 'APAR-BMS10-001',
    rigId: 'BMS-10',
    inspectorName: 'Kru Lapangan BMS-10',
    reportedDate: '2025-04-10',
    issueDescription: 'Hose retak getas dan nozzle tersumbat.',
    findingPhoto: null,
    status: 'open',
    repairNotes: '',
    evidencePhoto: null,
    updatedAt: '2025-04-10'
  },
  {
    id: 'mnt-bms10-002',
    aparId: 'apar-bms10-002',
    assetCode: 'APAR-BMS10-002',
    rigId: 'BMS-10',
    inspectorName: 'Kru Lapangan BMS-10',
    reportedDate: '2025-04-10',
    issueDescription: 'Jarum pressure gauge di zona merah (tekanan drop / low pressure).',
    findingPhoto: null,
    status: 'open',
    repairNotes: '',
    evidencePhoto: null,
    updatedAt: '2025-04-10'
  },
  {
    id: 'mnt-bms16-001',
    aparId: 'apar-bms16-002',
    assetCode: 'APAR-BMS16-002',
    rigId: 'BMS-16',
    inspectorName: 'Kru Rig BMS-16',
    reportedDate: '2025-04-07',
    issueDescription: 'Hose bocor saat inspeksi fisik.',
    findingPhoto: null,
    status: 'open',
    repairNotes: '',
    evidencePhoto: null,
    updatedAt: '2025-04-07'
  }
];
