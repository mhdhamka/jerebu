/**
 * Comprehensive Sarawak Geolocation Database & Geocoding Service
 * Covers all 12 Administrative Divisions, Cities, Municipalities, Districts,
 * Sub-districts, and prominent Neighborhoods across the entire state of Sarawak, Malaysia.
 */

// 12 Official Administrative Divisions of Sarawak
export const SARAWAK_DIVISIONS = [
  { id: 'miri', name: 'Miri Division', flagName: 'Miri', lat: 4.3995, lng: 113.9914, zoom: 12, description: 'Northern coastal division, oil & gas hub, peatland fire zone' },
  { id: 'kuching', name: 'Kuching Division', flagName: 'Kuching', lat: 1.5533, lng: 110.3592, zoom: 12, description: 'State capital administrative & commercial center' },
  { id: 'sibu', name: 'Sibu Division', flagName: 'Sibu', lat: 2.2875, lng: 111.8305, zoom: 12, description: 'Central gateway on Rajang River basin' },
  { id: 'bintulu', name: 'Bintulu Division', flagName: 'Bintulu', lat: 3.1725, lng: 113.0433, zoom: 12, description: 'Heavy industrial corridor, port, and energy zone' },
  { id: 'sri_aman', name: 'Sri Aman Division', flagName: 'Sri Aman', lat: 1.2333, lng: 111.4667, zoom: 12, description: 'Southern division with extensive peatland, historic haze hotspot' },
  { id: 'samarahan', name: 'Samarahan Division', flagName: 'Samarahan', lat: 1.4500, lng: 110.4833, zoom: 12, description: 'Higher education hub (UNIMAS, UiTM) and agricultural belt' },
  { id: 'sarikei', name: 'Sarikei Division', flagName: 'Sarikei', lat: 2.1167, lng: 111.5167, zoom: 12, description: 'Agricultural food basket of Sarawak' },
  { id: 'mukah', name: 'Mukah Division', flagName: 'Mukah', lat: 2.9000, lng: 112.0833, zoom: 12, description: 'Central coastal division, Melanau heartland & sago belt' },
  { id: 'kapit', name: 'Kapit Division', flagName: 'Kapit', lat: 2.0167, lng: 112.9333, zoom: 11, description: 'Upper Rajang interior highland division & hydroelectric basin' },
  { id: 'limbang', name: 'Limbang Division', flagName: 'Limbang', lat: 4.7500, lng: 115.0000, zoom: 12, description: 'Northernmost enclave bordered by Brunei' },
  { id: 'betong', name: 'Betong Division', flagName: 'Betong', lat: 1.4167, lng: 111.5333, zoom: 12, description: 'Saribas basin and rural agricultural settlements' },
  { id: 'serian', name: 'Serian Division', flagName: 'Serian', lat: 1.1667, lng: 110.5667, zoom: 12, description: 'Southern inland border division with West Kalimantan' }
];

// Rich catalog of 70+ Cities, Municipalities, Towns, Districts, and Neighborhoods
export const SARAWAK_LOCATIONS = [
  // --- MIRI DIVISION ---
  {
    name: 'Miri City Center',
    division: 'Miri Division',
    type: 'city',
    lat: 4.3995,
    lng: 113.9914,
    zoom: 13,
    keywords: ['miri', 'city', 'waterfront', 'marina', 'times square']
  },
  {
    name: 'Senadin',
    division: 'Miri Division',
    type: 'neighborhood',
    lat: 4.5061,
    lng: 114.0156,
    zoom: 14,
    keywords: ['senadin', 'curtin', 'phase 1', 'phase 2', 'phase 3', 'desa senadin']
  },
  {
    name: 'Bandar Baru Permyjaya',
    division: 'Miri Division',
    type: 'neighborhood',
    lat: 4.4842,
    lng: 114.0321,
    zoom: 14,
    keywords: ['permy', 'permyjaya', 'mall', 'taman permy', 'tudan']
  },
  {
    name: 'Taman Tunku',
    division: 'Miri Division',
    type: 'neighborhood',
    lat: 4.3312,
    lng: 113.9854,
    zoom: 14,
    keywords: ['taman tunku', 'taman lambir', 'miri airport road', 'sri dagang']
  },
  {
    name: 'Lutong',
    division: 'Miri Division',
    type: 'town',
    lat: 4.4682,
    lng: 114.0041,
    zoom: 14,
    keywords: ['lutong', 'shell', 'petronas', 'old refinery', 'pasar lutong']
  },
  {
    name: 'Pujut',
    division: 'Miri Division',
    type: 'neighborhood',
    lat: 4.4231,
    lng: 114.0118,
    zoom: 14,
    keywords: ['pujut', 'pujut 7', 'pujut 4', 'pujut corner', 'bulatan']
  },
  {
    name: 'Piasau',
    division: 'Miri Division',
    type: 'neighborhood',
    lat: 4.4215,
    lng: 113.9982,
    zoom: 14,
    keywords: ['piasau', 'piasau jaya', 'piasau camp', 'nature reserve']
  },
  {
    name: 'Riam & Luak Bay',
    division: 'Miri Division',
    type: 'neighborhood',
    lat: 4.3541,
    lng: 113.9682,
    zoom: 14,
    keywords: ['riam', 'luak bay', 'esplanade', 'tanjung lobang']
  },
  {
    name: 'Kuala Baram Industrial & Peat Zone',
    division: 'Miri Division',
    type: 'industrial',
    lat: 4.5821,
    lng: 113.9851,
    zoom: 13,
    keywords: ['kuala baram', 'baram', 'peat fire', 'asean bridge', 'shipyard']
  },
  {
    name: 'Marudi',
    division: 'Miri Division',
    type: 'town',
    lat: 4.1822,
    lng: 114.3241,
    zoom: 13,
    keywords: ['marudi', 'baram river', 'fort hose']
  },
  {
    name: 'Niah & Batu Niah',
    division: 'Miri Division',
    type: 'district',
    lat: 3.8611,
    lng: 113.7121,
    zoom: 13,
    keywords: ['niah', 'batu niah', 'caves', 'national park', 'oil palm']
  },
  {
    name: 'Bekenu (Sibuti)',
    division: 'Miri Division',
    type: 'town',
    lat: 4.0543,
    lng: 113.8471,
    zoom: 13,
    keywords: ['bekenu', 'sibuti', 'bungai beach']
  },
  {
    name: 'Long Lama',
    division: 'Miri Division',
    type: 'town',
    lat: 3.7592,
    lng: 114.4072,
    zoom: 13,
    keywords: ['long lama', 'telang usan', 'middle baram']
  },
  {
    name: 'Bakam',
    division: 'Miri Division',
    type: 'neighborhood',
    lat: 4.2562,
    lng: 113.9571,
    zoom: 13,
    keywords: ['bakam', 'kampung bakam', 'coastal road']
  },

  // --- KUCHING DIVISION ---
  {
    name: 'Kuching City Waterfront',
    division: 'Kuching Division',
    type: 'city',
    lat: 1.5583,
    lng: 110.3444,
    zoom: 13,
    keywords: ['kuching', 'waterfront', 'main bazaar', 'padungan', 'carpenter street']
  },
  {
    name: 'Petra Jaya',
    division: 'Kuching Division',
    type: 'neighborhood',
    lat: 1.5833,
    lng: 110.3333,
    zoom: 13,
    keywords: ['petra jaya', 'wisma bapa malaysia', 'state mosque', 'stadium perpaduan']
  },
  {
    name: 'Tabuan Jaya & BDC',
    division: 'Kuching Division',
    type: 'neighborhood',
    lat: 1.5211,
    lng: 110.3681,
    zoom: 14,
    keywords: ['tabuan jaya', 'bdc', 'vivacity', 'tabuan tranquil', 'saradise']
  },
  {
    name: 'Batu Kawa',
    division: 'Kuching Division',
    type: 'neighborhood',
    lat: 1.5022,
    lng: 110.3121,
    zoom: 14,
    keywords: ['batu kawa', 'mjc', 'new township', 'pine square']
  },
  {
    name: 'Matang',
    division: 'Kuching Division',
    type: 'neighborhood',
    lat: 1.5781,
    lng: 110.2891,
    zoom: 13,
    keywords: ['matang', 'matang jaya', 'kubah', 'metrocity']
  },
  {
    name: 'Stampin & Green Heights',
    division: 'Kuching Division',
    type: 'neighborhood',
    lat: 1.5081,
    lng: 110.3471,
    zoom: 14,
    keywords: ['stampin', 'green heights', 'rh plaza', 'jalan song', 'airport']
  },
  {
    name: 'Santubong & Damai Beach',
    division: 'Kuching Division',
    type: 'landmark',
    lat: 1.7167,
    lng: 110.3167,
    zoom: 13,
    keywords: ['santubong', 'damai beach', 'mount santubong', 'sarawak cultural village']
  },
  {
    name: 'Bau (Tasik Biru)',
    division: 'Kuching Division',
    type: 'district',
    lat: 1.4167,
    lng: 110.1500,
    zoom: 13,
    keywords: ['bau', 'tasik biru', 'fairy cave', 'wind cave', 'gold town']
  },
  {
    name: 'Lundu',
    division: 'Kuching Division',
    type: 'district',
    lat: 1.6667,
    lng: 109.8500,
    zoom: 13,
    keywords: ['lundu', 'gunung gading', 'rafflesia']
  },
  {
    name: 'Sematan',
    division: 'Kuching Division',
    type: 'town',
    lat: 1.8000,
    lng: 109.7667,
    zoom: 13,
    keywords: ['sematan', 'telok melano', 'pan borneo km0']
  },
  {
    name: 'Padawan & Siburan',
    division: 'Kuching Division',
    type: 'district',
    lat: 1.3667,
    lng: 110.3667,
    zoom: 12,
    keywords: ['padawan', 'siburan', 'annah rais', 'puncak borneo']
  },
  {
    name: 'Bintawa & Pending',
    division: 'Kuching Division',
    type: 'industrial',
    lat: 1.5581,
    lng: 110.3842,
    zoom: 14,
    keywords: ['bintawa', 'pending', 'industrial estate', 'port']
  },

  // --- SIBU DIVISION ---
  {
    name: 'Sibu Town Center',
    division: 'Sibu Division',
    type: 'city',
    lat: 2.2875,
    lng: 111.8305,
    zoom: 13,
    keywords: ['sibu', 'central market', 'rajang esplanade', 'tua pek kong', 'town']
  },
  {
    name: 'Sibu Jaya',
    division: 'Sibu Division',
    type: 'neighborhood',
    lat: 2.2152,
    lng: 111.9681,
    zoom: 14,
    keywords: ['sibu jaya', 'township', 'sibu airport']
  },
  {
    name: 'Sungai Merah',
    division: 'Sibu Division',
    type: 'neighborhood',
    lat: 2.3162,
    lng: 111.8481,
    zoom: 14,
    keywords: ['sungai merah', 'wong nai siong', 'memorial park']
  },
  {
    name: 'Lanang',
    division: 'Sibu Division',
    type: 'neighborhood',
    lat: 2.2741,
    lng: 111.8211,
    zoom: 14,
    keywords: ['lanang', 'lanang bridge', 'upper lanang']
  },
  {
    name: 'Kanowit',
    division: 'Sibu Division',
    type: 'district',
    lat: 2.1000,
    lng: 112.1500,
    zoom: 13,
    keywords: ['kanowit', 'rajang river', 'fort emma']
  },
  {
    name: 'Selangau',
    division: 'Sibu Division',
    type: 'district',
    lat: 2.5333,
    lng: 112.3167,
    zoom: 13,
    keywords: ['selangau', 'pan borneo', 'mukah junction']
  },

  // --- BINTULU DIVISION ---
  {
    name: 'Bintulu Town Center',
    division: 'Bintulu Division',
    type: 'city',
    lat: 3.1725,
    lng: 113.0433,
    zoom: 13,
    keywords: ['bintulu', 'pasar tamu', 'tanjung batu', 'the spring bintulu']
  },
  {
    name: 'Tanjung Kidurong & Deepwater Port',
    division: 'Bintulu Division',
    type: 'industrial',
    lat: 3.2667,
    lng: 113.0833,
    zoom: 13,
    keywords: ['kidurong', 'tanjung kidurong', 'mlng', 'petronas lng', 'port']
  },
  {
    name: 'Samalaju Industrial Park',
    division: 'Bintulu Division',
    type: 'industrial',
    lat: 3.5833,
    lng: 113.3500,
    zoom: 12,
    keywords: ['samalaju', 'score', 'aluminium smelter', 'heavy industry']
  },
  {
    name: 'Medan Jaya & Parkcity',
    division: 'Bintulu Division',
    type: 'neighborhood',
    lat: 3.1850,
    lng: 113.0550,
    zoom: 14,
    keywords: ['medan jaya', 'parkcity', 'commerce square']
  },
  {
    name: 'Tatau',
    division: 'Bintulu Division',
    type: 'district',
    lat: 2.8833,
    lng: 112.8500,
    zoom: 13,
    keywords: ['tatau', 'tatau river', 'timber']
  },
  {
    name: 'Sebauh',
    division: 'Bintulu Division',
    type: 'district',
    lat: 3.1167,
    lng: 113.2667,
    zoom: 13,
    keywords: ['sebauh', 'kemena river']
  },

  // --- SAMARAHAN DIVISION ---
  {
    name: 'Kota Samarahan',
    division: 'Samarahan Division',
    type: 'city',
    lat: 1.4500,
    lng: 110.4833,
    zoom: 13,
    keywords: ['samarahan', 'kota samarahan', 'kota ilmu', 'aishah complex']
  },
  {
    name: 'UNIMAS Campus Area',
    division: 'Samarahan Division',
    type: 'landmark',
    lat: 1.4652,
    lng: 110.4281,
    zoom: 14,
    keywords: ['unimas', 'university', 'uitm samarahan', 'kampung baru']
  },
  {
    name: 'Asajaya',
    division: 'Samarahan Division',
    type: 'district',
    lat: 1.5333,
    lng: 110.6000,
    zoom: 13,
    keywords: ['asajaya', 'tambirat', 'coconut']
  },
  {
    name: 'Sadong Jaya',
    division: 'Samarahan Division',
    type: 'district',
    lat: 1.5500,
    lng: 110.7167,
    zoom: 13,
    keywords: ['sadong jaya', 'batang sadong bridge', 'sebuyau']
  },
  {
    name: 'Muara Tuang',
    division: 'Samarahan Division',
    type: 'neighborhood',
    lat: 1.4421,
    lng: 110.4561,
    zoom: 14,
    keywords: ['muara tuang', 'kem muara tuang', 'army camp']
  },

  // --- SRI AMAN DIVISION ---
  {
    name: 'Sri Aman Town (Simanggang)',
    division: 'Sri Aman Division',
    type: 'city',
    lat: 1.2333,
    lng: 111.4667,
    zoom: 13,
    keywords: ['sri aman', 'simanggang', 'fort alice', 'batang lupar', 'benak', 'tidal bore']
  },
  {
    name: 'Lubok Antu',
    division: 'Sri Aman Division',
    type: 'district',
    lat: 1.1333,
    lng: 111.8333,
    zoom: 13,
    keywords: ['lubok antu', 'border', 'kalimantan', 'badau']
  },
  {
    name: 'Batang Ai & Hydroelectric Dam',
    division: 'Sri Aman Division',
    type: 'landmark',
    lat: 1.1667,
    lng: 111.9000,
    zoom: 12,
    keywords: ['batang ai', 'dam', 'national park', 'hilton', 'lake']
  },
  {
    name: 'Engkilili',
    division: 'Sri Aman Division',
    type: 'town',
    lat: 1.1500,
    lng: 111.6667,
    zoom: 13,
    keywords: ['engkilili', 'batang lupar']
  },

  // --- SARIKEI DIVISION ---
  {
    name: 'Sarikei Town',
    division: 'Sarikei Division',
    type: 'city',
    lat: 2.1167,
    lng: 111.5167,
    zoom: 13,
    keywords: ['sarikei', 'pineapple town', 'nanas', 'esplanade']
  },
  {
    name: 'Bintangor',
    division: 'Sarikei Division',
    type: 'town',
    lat: 2.1667,
    lng: 111.6333,
    zoom: 13,
    keywords: ['bintangor', 'limau', 'orange', 'binatang']
  },
  {
    name: 'Julau',
    division: 'Sarikei Division',
    type: 'district',
    lat: 2.0167,
    lng: 111.9167,
    zoom: 13,
    keywords: ['julau', 'pepper']
  },
  {
    name: 'Pakan',
    division: 'Sarikei Division',
    type: 'district',
    lat: 1.8833,
    lng: 111.6833,
    zoom: 13,
    keywords: ['pakan', 'longhouses']
  },

  // --- MUKAH DIVISION ---
  {
    name: 'Mukah Town Center',
    division: 'Mukah Division',
    type: 'city',
    lat: 2.9000,
    lng: 112.0833,
    zoom: 13,
    keywords: ['mukah', 'kaul festival', 'sago', 'polytechnic', 'kala dana']
  },
  {
    name: 'Dalat',
    division: 'Mukah Division',
    type: 'district',
    lat: 2.7333,
    lng: 111.9333,
    zoom: 13,
    keywords: ['dalat', 'oya river', 'batang oya']
  },
  {
    name: 'Balingian',
    division: 'Mukah Division',
    type: 'district',
    lat: 3.0000,
    lng: 112.5500,
    zoom: 13,
    keywords: ['balingian', 'coal', 'power plant']
  },
  {
    name: 'Daro & Matu',
    division: 'Mukah Division',
    type: 'district',
    lat: 2.5167,
    lng: 111.4333,
    zoom: 13,
    keywords: ['daro', 'matu', 'delta']
  },
  {
    name: 'Tanjung Manis Halal Hub',
    division: 'Mukah Division',
    type: 'industrial',
    lat: 2.1500,
    lng: 111.3500,
    zoom: 13,
    keywords: ['tanjung manis', 'halal hub', 'port', 'rajang delta']
  },

  // --- KAPIT DIVISION ---
  {
    name: 'Kapit Town',
    division: 'Kapit Division',
    type: 'city',
    lat: 2.0167,
    lng: 112.9333,
    zoom: 13,
    keywords: ['kapit', 'fort sylvia', 'upper rajang', 'riverboat']
  },
  {
    name: 'Song',
    division: 'Kapit Division',
    type: 'district',
    lat: 2.0000,
    lng: 112.5500,
    zoom: 13,
    keywords: ['song', 'katibas river']
  },
  {
    name: 'Belaga',
    division: 'Kapit Division',
    type: 'district',
    lat: 2.7000,
    lng: 113.7833,
    zoom: 13,
    keywords: ['belaga', 'orang ulu', 'kenyah', 'kayan']
  },
  {
    name: 'Bakun Hydroelectric Reservoir',
    division: 'Kapit Division',
    type: 'landmark',
    lat: 2.7500,
    lng: 114.0500,
    zoom: 12,
    keywords: ['bakun', 'dam', 'lake', 'hydro']
  },

  // --- LIMBANG DIVISION ---
  {
    name: 'Limbang Town',
    division: 'Limbang Division',
    type: 'city',
    lat: 4.7500,
    lng: 115.0000,
    zoom: 13,
    keywords: ['limbang', 'limbang river', 'pascagoula', 'tedungan']
  },
  {
    name: 'Lawas Town',
    division: 'Limbang Division',
    type: 'town',
    lat: 4.8500,
    lng: 115.4000,
    zoom: 13,
    keywords: ['lawas', 'trusan', 'merapok', 'ikan tahai']
  },
  {
    name: 'Ba\'kelalan & Bario Highlands',
    division: 'Limbang Division',
    type: 'landmark',
    lat: 3.9833,
    lng: 115.6167,
    zoom: 12,
    keywords: ['bakelalan', 'bario', 'kelabit highlands', 'salt spring', 'apple']
  },
  {
    name: 'Sundar & Trusan',
    division: 'Limbang Division',
    type: 'district',
    lat: 4.8833,
    lng: 115.2000,
    zoom: 13,
    keywords: ['sundar', 'trusan']
  },

  // --- BETONG DIVISION ---
  {
    name: 'Betong Town',
    division: 'Betong Division',
    type: 'city',
    lat: 1.4167,
    lng: 111.5333,
    zoom: 13,
    keywords: ['betong', 'fort lilly', 'saribas', 'layar']
  },
  {
    name: 'Saratok',
    division: 'Betong Division',
    type: 'district',
    lat: 1.7333,
    lng: 111.3333,
    zoom: 13,
    keywords: ['saratok', 'krian river']
  },
  {
    name: 'Spaoh & Debak',
    division: 'Betong Division',
    type: 'town',
    lat: 1.4667,
    lng: 111.4833,
    zoom: 13,
    keywords: ['spaoh', 'debak', 'saribas']
  },
  {
    name: 'Pusa & Kabong',
    division: 'Betong Division',
    type: 'district',
    lat: 1.6167,
    lng: 111.2833,
    zoom: 13,
    keywords: ['pusa', 'kabong', 'ikan terubok', 'tanjung kembang']
  },

  // --- SERIAN DIVISION ---
  {
    name: 'Serian Town',
    division: 'Serian Division',
    type: 'city',
    lat: 1.1667,
    lng: 110.5667,
    zoom: 13,
    keywords: ['serian', 'durian town', 'tasik danu', 'ranchan pool']
  },
  {
    name: 'Tebedu Border Post (CIQ)',
    division: 'Serian Division',
    type: 'landmark',
    lat: 1.0000,
    lng: 110.3667,
    zoom: 13,
    keywords: ['tebedu', 'border', 'entikong', 'west kalimantan', 'ciq']
  }
];

/**
 * Fast search across local Sarawak catalog with scoring
 */
export function searchSarawakLocations(query, maxResults = 8) {
  if (!query || typeof query !== 'string') return [];
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  const results = [];

  // 1. Search Divisions
  for (const div of SARAWAK_DIVISIONS) {
    if (div.name.toLowerCase().includes(q) || div.flagName.toLowerCase().includes(q)) {
      results.push({
        ...div,
        type: 'division',
        score: div.flagName.toLowerCase() === q ? 100 : 80
      });
    }
  }

  // 2. Search specific cities, neighborhoods, landmarks
  for (const loc of SARAWAK_LOCATIONS) {
    const nameMatch = loc.name.toLowerCase().includes(q);
    const divMatch = loc.division.toLowerCase().includes(q);
    const keywordMatch = loc.keywords.some(k => k.includes(q) || q.includes(k));

    if (nameMatch || divMatch || keywordMatch) {
      let score = 50;
      if (loc.name.toLowerCase() === q) score = 95;
      else if (loc.name.toLowerCase().startsWith(q)) score = 85;
      else if (nameMatch) score = 70;
      else if (keywordMatch) score = 60;

      results.push({
        ...loc,
        score
      });
    }
  }

  // Sort by score descending and return top matches
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
}

/**
 * Online Geocoding with OpenStreetMap Nominatim specifically bounded to Sarawak, Malaysia
 * Bounds: approx 109.5°E to 115.8°E, 0.8°N to 5.0°N
 */
export async function geocodeSarawakNominatim(query) {
  if (!query || query.trim().length < 2) return [];
  const cleanQ = query.trim();

  try {
    const encoded = encodeURIComponent(`${cleanQ}, Sarawak, Malaysia`);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&countrycodes=my&viewbox=109.5,5.0,115.8,0.8&limit=5`;
    
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en,ms',
        'User-Agent': 'JerebuWatch-Sarawak/1.0'
      }
    });

    if (!response.ok) return [];
    const data = await response.json();

    return data.map(item => {
      // Determine friendly name and division
      const displayName = item.display_name.split(',')[0];
      const stateDistrict = item.address?.state_district || item.address?.county || item.address?.state || 'Sarawak';
      
      return {
        name: displayName || cleanQ,
        division: stateDistrict.includes('Division') ? stateDistrict : `${stateDistrict} Division`,
        type: 'online_geocode',
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        zoom: 14,
        source: 'OpenStreetMap'
      };
    });
  } catch (err) {
    console.warn('Nominatim geocode fallback error:', err);
    return [];
  }
}

/**
 * Calculate Great Circle Distance in KM between two geographic coordinates
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}
