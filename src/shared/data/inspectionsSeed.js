export const inspectionsSeed = [
  {
    id: 'insp-bms07-001',
    aparId: 'apar-bms07-001',
    assetCode: 'APAR-BMS07-001',
    rigId: 'BMS-07',
    inspectorName: 'Kru Rig BMS-07',
    inspectionDate: '2025-06-19',
    category: 'tahunan',
    thirdPartyVendor: 'Sepakat',
    checklist: {
      handle: 'bagus',
      hose: 'bagus',
      nozle: 'bagus',
      pengamanTabung: 'bagus',
      pinHandle: 'bagus',
      pressureGauge: 'bagus',
      tabung: 'bagus'
    },
    overallStatus: 'layak',
    issueDescription: '',
    findingPhoto: null
  },
  {
    id: 'insp-bms07-008',
    aparId: 'apar-bms07-008',
    assetCode: 'APAR-BMS07-008',
    rigId: 'BMS-07',
    inspectorName: 'Kru Rig BMS-07',
    inspectionDate: '2025-06-19',
    category: 'tahunan',
    thirdPartyVendor: 'Sepakat',
    checklist: {
      handle: 'bagus',
      hose: 'bagus',
      nozle: 'bagus',
      pengamanTabung: 'bagus',
      pinHandle: 'bagus',
      pressureGauge: 'na', // CO2 otomatis N/A
      tabung: 'bagus'
    },
    overallStatus: 'layak',
    issueDescription: '',
    findingPhoto: null
  },
  {
    id: 'insp-bms18-002',
    aparId: 'apar-bms18-002',
    assetCode: 'APAR-BMS18-002',
    rigId: 'BMS-18',
    inspectorName: 'Fudhla',
    inspectionDate: '2025-06-19',
    category: 'tahunan',
    thirdPartyVendor: 'Sepakat',
    checklist: {
      handle: 'bagus',
      hose: 'bagus',
      nozle: 'bagus',
      pengamanTabung: 'bagus',
      pinHandle: 'bagus',
      pressureGauge: 'bagus',
      tabung: 'rusak'
    },
    overallStatus: 'tidak_layak',
    issueDescription: 'Bodi tabung korosi parah dan penyok di dekat dasar tabung.',
    findingPhoto: null
  }
];
