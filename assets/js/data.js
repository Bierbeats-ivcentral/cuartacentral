// ============================================
//  IV CENTRAL — data.js
//
//  CONTRATO DE TIPOS:
//  ► id          : number (entero, único, empieza en 0)
//  ► name        : string
//  ► city        : string
//  ► region      : string
//  ► genres      : string[]
//  ► photo       : string (URL directa de Imgur, ej: "https://i.imgur.com/ABC1234.png")
//                  Dejar "" si no hay foto — el sistema usa emoji como fallback
//  ► emoji       : string (un solo emoji)
//  ► color       : string (CSS gradient válido)
//  ► instagram   : string (con @, ej: "@bierbeats") o ""
//  ► beatstars   : string (handle sin URL, ej: "bierbeats") o ""
//  ► spotify     : string (URL completa) o ""
//  ► whatsapp    : string (número CON código de país, sin + ni espacios, ej: "56912345678")
//  ► bio         : string (max ~300 chars recomendado)
//  ► price       : string (display, ej: "$35.000/hr")
//  ► priceVal    : number (valor numérico en CLP, ej: 35000)
//  ► services    : string[]
//  ► equip       : string[]
//  ► available   : boolean
//  ► studioPhotos: string[] (URLs directas, vacío "" para slots sin foto)
//                  Agrega o quita — el carrusel se adapta solo
// ============================================

const PRODUCERS = [
  {
    id: 0,
    name: "BIERBEATS",
    city: "Coquimbo",
    region: "Coquimbo",
    genres: ["Trap", "Reggaeton"],
    photo: "https://i.imgur.com/a3rndZB.png",
    emoji: "🎧",
    color: "linear-gradient(135deg,#1a1000,#3a2a00)",
    instagram: "@bierbeats",
    beatstars: "bierbeats",
    spotify: "",
    whatsapp: "56927042286",
    bio: "Productor de trap, reggaeton, y estilos varios, con más de 10 años en la escena del norte. Especializado en beats urbanos con influencias latinas.",
    price: "$35.000/hr",
    priceVal: 35000,
    services: ["Grabación vocal", "Producción de beats", "Mezcla y master", "Dirección artística", "Videoclip"],
    // serviceIds: IDs del catálogo SERVICES que este productor ofrece
    serviceIds: ["grabacion", "beat", "mezcla", "mastering", "produccion", "videoclip_single", "videoclip_completo", "videoclip_b", "videoclip_p"],
    equip: ["samson GTRACK", "FL Studio"],
    available: true,
    studioPhotos: [
      "", // Foto 1 — ej: "https://i.imgur.com/ABC1234.jpg"
      "", // Foto 2
      "", // Foto 3
      "", // Foto 4
      "", // Foto 5
      "", // Foto 6
    ],
  },
  {
    id: 1,
    name: "LUCKY",
    city: "Coquimbo",
    region: "Coquimbo",
    genres: ["Reggaeton", "Trap", "hip-hop"],
    photo: "https://i.imgur.com/s3J0rTU.png",
    emoji: "🎛️",
    color: "linear-gradient(135deg,#0a0a1a,#1a1a3a)",
    instagram: "@la_nueva_estrella_official_27_",
    spotify: "",
    whatsapp: "",
    bio: "Productor de Reggaeton y trap. Beats con identidad propia.",
    price: "$30.000/hr",
    priceVal: 30000,
    services: ["Grabación vocal", "Producción de beats", "Mezcla y master"],
    serviceIds: ["grabacion", "beat", "mezcla", "mastering", "ensayo"],
    equip: ["SSL 9000", "Logic Pro X", "AKG C414", "Adam Audio A77X", "Universal Audio Apollo"],
    available: true,
    studioPhotos: ["","","","","",""],
  },
  {
    id: 2,
    name: "Young Varas",
    city: "La Serena",
    region: "Coquimbo",
    genres: ["Urbano", "Trap", "Reggaeton"],
    photo: "https://i.imgur.com/ollJP9x.png",
    emoji: "🎼",
    color: "linear-gradient(135deg,#001a0a,#003a1a)",
    instagram: "@labovedadelos_hits",
    spotify: "",
    whatsapp: "56921794011",
    bio: "productor y compositor, versátil con sonidos urbanos y influencias Norteamericanas. .",
    price: "$50.000/ hr",
    priceVal: 50000,
    services: ["Grabación vocal", "Arreglos", "Mezcla y master", "Remakes Beats", "Dirección artística"],
    serviceIds: ["grabacion", "beat", "mezcla", "mastering", "produccion", "ensayo"],
    equip: ["API 1608", "Ableton Live", "Rode NT2A", "KRK Rokit 8", "Avalon 737"],
    available: true,
    studioPhotos: ["","","","","",""],
  },
  {
    id: 3,
    name: "ROOTSMIND",
    city: "Santiago",
    region: "Metropolitana",
    genres: ["Experimental", "Poetic"],
    photo: "",
    emoji: "🌿",
    color: "linear-gradient(135deg,#0a0a00,#1a1a0a)",
    instagram: "@rootsmind",
    beatstars: "rootsmind",
    spotify: "",
    whatsapp: "56922222222",
    bio: "Productor experimental con raíces en el hip-hop poético. Fusiona sonidos orgánicos con electrónica para crear atmósferas únicas.",
    price: "$38.000/hr",
    priceVal: 38000,
    services: ["Producción completa", "Mezcla experimental", "Dirección artística", "Post-producción"],
    serviceIds: ["produccion", "mezcla", "mastering", "grabacion", "diseno_epk", "branding"],
    equip: ["Moog Subsequent 37", "Ableton Live 11", "Focusrite Red 8Pre", "Genelec 8050", "Hardware modular"],
    available: true,
    studioPhotos: ["","","","","",""],
  },
  {
    id: 4,
    name: "VANTEK",
    city: "Antofagasta",
    region: "Antofagasta",
    genres: ["Synthwave", "EDM"],
    photo: "",
    emoji: "⚡",
    color: "linear-gradient(135deg,#1a001a,#3a003a)",
    instagram: "@vantek_edm",
    beatstars: "vantek",
    spotify: "",
    whatsapp: "56933333333",
    bio: "Productor de synthwave y EDM con influencias de los 80s y la cultura ciberpunk. Sintetizadores analógicos y electrónica dura.",
    price: "$40.000/hr",
    priceVal: 40000,
    services: ["Producción EDM", "Síntesis modular", "Mezcla", "Mastering digital"],
    serviceIds: ["beat", "mezcla", "mastering", "produccion", "grabacion"],
    equip: ["Moog One", "Elektron Analog Rytm", "Ableton Live 11", "Genelec 8050", "Antelope Orion 32"],
    available: true,
    studioPhotos: ["","","","","",""],
  },
  {
    id: 5,
    name: "LUX",
    city: "Iquique",
    region: "Tarapacá",
    genres: ["Afro", "Club"],
    photo: "",
    emoji: "🌊",
    color: "linear-gradient(135deg,#001a1a,#003a3a)",
    instagram: "@lux_iqi",
    beatstars: "lux",
    spotify: "",
    whatsapp: "56944444444",
    bio: "Productor de música afro y club desde Iquique. Ritmos africanos fusionados con electrónica latinoamericana para la pista de baile.",
    price: "$32.000/hr",
    priceVal: 32000,
    services: ["Beats afro", "Producción club", "Mezcla", "Videoclip"],
    serviceIds: ["beat", "grabacion", "mezcla", "videoclip_single", "videoclip_completo", "videoclip_b", "videoclip_p"],
    equip: ["Pioneer DDJ-1000", "FL Studio", "Shure SM7B", "Yamaha HS8", "Focusrite Scarlett"],
    available: true,
    studioPhotos: ["","","","","",""],
  },
];

const ACTIVITY = [
  { type: "session", icon: "🎙️", text: "BIERBEATS grabó sesión con artista local", time: "hace 2 días" },
  { type: "join",    icon: "✅", text: "LUX se unió a IV CENTRAL", time: "hace 3 días" },
  { type: "release", icon: "🎵", text: "AKIRA lanzó nuevo beat pack", time: "hace 5 días" },
  { type: "join",    icon: "✅", text: "VANTEK se unió a IV CENTRAL", time: "hace 1 semana" },
  { type: "collab",  icon: "🤝", text: "NEXO + ROOTSMIND — colaboración en proceso", time: "hace 1 semana" },
  { type: "session", icon: "🎙️", text: "ROOTSMIND completó EP completo", time: "hace 2 semanas" },
];

// ============================================
//  CATÁLOGO DE SERVICIOS — fuente única de verdad
//  type: "hourly" = precio × horas del productor seleccionado
//        "fixed"  = precio fijo independiente del productor
// ============================================
window.SERVICES = [
  { id: "grabacion",       label: "Grabación vocal / instrumental", unit: "hr",        type: "hourly", fixedPrice: null,       desc: "Se cobra según tarifa del productor por hora" },
  { id: "beat",            label: "Producción de beat",             unit: "hr",        type: "hourly", fixedPrice: 48990,       desc: "Se cobra según tarifa del productor por hora" },
  { id: "ensayo",          label: "Ensayo en sala",                 unit: "hr",        type: "hourly", fixedPrice: null,       desc: "Se cobra según tarifa del productor por hora" },
  { id: "videoclip_single",   label: "Videoclip — SINGLE (básico)", unit: "proyecto",  type: "fixed",  fixedPrice: 250000,     desc: "1 día de rodaje · 1 locación · Edición + color básico · 2 revisiones" },
  { id: "videoclip_completo", label: "Videoclip — COMPLETO (PRO)",  unit: "proyecto",  type: "fixed",  fixedPrice: 550000,     desc: "2 días · 3 locaciones · Dirección artística · Color cine · Motion graphics · Drone" },
  { id: "mezcla",      label: "Mezcla profesional",             unit: "canción",  type: "fixed",  fixedPrice: 80000,   desc: "Precio fijo por canción, independiente del productor" },
  { id: "mastering",   label: "Mastering",                      unit: "canción",  type: "fixed",  fixedPrice: 50000,   desc: "Precio fijo por canción, independiente del productor" },
  { id: "produccion",  label: "Producción completa",            unit: "proyecto", type: "fixed",  fixedPrice: 350000,  desc: "Beat + grabación + mezcla + master incluidos" },
  { id: "videoclip_b", label: "Videoclip — Pack Single",        unit: "proyecto", type: "fixed",  fixedPrice: 250000,  desc: "1 día rodaje, 1 locación, edición y color básico" },
  { id: "videoclip_p", label: "Videoclip — Pack Pro",           unit: "proyecto", type: "fixed",  fixedPrice: 550000,  desc: "2 días, 3 locaciones, drone, motion graphics" },
  { id: "diseno_cv",   label: "Arte de portada",                unit: "entrega",  type: "fixed",  fixedPrice: 45000,   desc: "Diseño tapa para single, EP o álbum" },
  { id: "diseno_pack", label: "Pack redes sociales",            unit: "entrega",  type: "fixed",  fixedPrice: 80000,   desc: "Portada, perfil y templates para stories" },
  { id: "diseno_epk",  label: "EPK Digital",                    unit: "entrega",  type: "fixed",  fixedPrice: 120000,  desc: "Electronic Press Kit profesional completo" },
  { id: "branding",    label: "Branding completo",              unit: "proyecto", type: "fixed",  fixedPrice: 250000,  desc: "Logo, manual de marca e identidad visual total" },
];
