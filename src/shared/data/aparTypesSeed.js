// 7 Master Tipe APAR Terstandarisasi
export const aparTypesSeed = [
  {
    id: 'type_powder_9kg',
    name: 'Powder 9 Kg ABC',
    agent: 'Dry Chemical Powder',
    capacity: '9 Kg',
    hasPressureGauge: true,
    description: 'APAR serbaguna kelas A, B, C untuk area kerja umum rig'
  },
  {
    id: 'type_powder_3kg',
    name: 'Powder 3 Kg ABC',
    agent: 'Dry Chemical Powder',
    capacity: '3 Kg',
    hasPressureGauge: true,
    description: 'APAR kompak untuk kendaraan operasional, Bus Crew, dan LV'
  },
  {
    id: 'type_powder_6kg',
    name: 'Powder 6 Kg ABC',
    agent: 'Dry Chemical Powder',
    capacity: '6 Kg',
    hasPressureGauge: true,
    description: 'APAR sedang untuk ruang generator dan workshop'
  },
  {
    id: 'type_powder_75kg',
    name: 'Powder 75 Kg / 150 Lbs',
    agent: 'Dry Chemical Powder',
    capacity: '75 Kg (150 Lbs)',
    hasPressureGauge: true,
    description: 'APAR beroda (Wheeled Unit) untuk proteksi area Fire Box rig'
  },
  {
    id: 'type_foam_100l',
    name: 'Foam 100 Liter',
    agent: 'AFFF (Aqueous Film Forming Foam)',
    capacity: '100 Liter',
    hasPressureGauge: true,
    description: 'APAR beroda khusus kebakaran cairan mudah terbakar (Kelas B) di Fire Box & Tangki'
  },
  {
    id: 'type_co2',
    name: 'CO2 (Carbon Dioxide)',
    agent: 'Carbon Dioxide Gas (High Pressure)',
    capacity: '5 Kg - 150 Lbs',
    hasPressureGauge: false, // ATURAN KUNCI: CO2 tidak memiliki pressure gauge! Diukur via timbangan/bobot.
    description: 'APAR gas bersih untuk panel listrik, Genset, dan Accumulator'
  },
  {
    id: 'type_clean_agent',
    name: 'Clean Agent / AF11',
    agent: 'Halon Replacement / Clean Agent Gas',
    capacity: '5 Kg',
    hasPressureGauge: true,
    description: 'APAR media gas bersih tidak meninggalkan residu untuk Rig Office & Server'
  }
];
