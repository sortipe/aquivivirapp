
// FIX: Created a comprehensive types file to resolve module errors across the application.
// FIX: Replaced transpiled JavaScript enum syntax with proper TypeScript 'enum' declarations to resolve type errors.
export enum UserRole {
    ADMIN = "admin",
    WORKER = "worker",
}
export enum PropertyType {
    CASA = "Casa",
    APARTAMENTO = "Apartamento",
    TERRENO = "Terreno",
    LOCAL_COMERCIAL = "Local Comercial",
    OFICINA = "Oficina",
}
export enum PropertySaleStatus {
    AVAILABLE = "Disponible",
    SOLD = "Vendido",
}
export enum PropertyTrafficLight {
    GREEN = "Verde",
    YELLOW = "Amarillo",
    RED = "Rojo"
}
export enum Currency {
    USD = "USD",
    PEN = "PEN",
}
export enum IncomeType {
    INDEPENDIENTE = "Independiente",
    DEPENDIENTE = "Dependiente",
    PENSIONADO = "Pensionado",
    RENTISTA = "Rentista",
}
export enum PropertyCondition {
    EXCELENTE = "Excelente",
    BUENO = "Bueno",
    REGULAR = "Regular",
    NECESITA_MEJORAS = "Necesita mejoras",
}
export enum ClientImpression {
    MUY_INTERESADO = "Muy interesado",
    INTERESADO = "Interesado",
    POCO_INTERESADO = "Poco interesado",
    NO_INTERESADO = "No interesado",
}
export enum VisitInterestStatus {
    DID_NOT_LIKE = "No le gusto",
    LOOKING_FOR_OFFERS = "Busca nuevas ofertas",
    WILL_VISIT_AGAIN = "Visitara de nuevo",
    WILL_QUOTE_OFFER = "Va a cotizar oferta",
    MADE_DEPOSIT = "Hizo separación",
    DID_NOT_ARRIVE = "No llego",
}
export enum TaskStatus {
    PENDING = "Pendiente",
    COMPLETED = "Completado",
}
export enum ResourceType {
    VIDEO = "Video",
    DOCUMENT = "Documento",
    LINK = "Enlace",
}
export enum EventType {
    MEETING = "Reunión",
    REMINDER = "Recordatorio",
    DEADLINE = "Fecha Límite",
    OTHER = "Otro",
}
export enum PaymentMethod {
    CONTADO = "Contado",
    CREDITO = "Crédito",
}
// --- Captacion Types ---
export enum CaptacionStatus {
    DRAFT = "Borrador",
    COMPLETED = "Completado",
}
export enum YesNo {
    SI = "Si",
    NO = "No",
}
export enum ContractType {
    EXCLUSIVO = "Exclusivo",
    NO_EXCLUSIVO = "No exclusivo",
}
export enum ListingType {
    VENTA = "Venta",
    ALQUILER = "Alquiler",
    TRASPASO = "Traspaso",
}
export enum PropertyCategory {
    CASA = "Casa",
    DEPARTAMENTO = "Departamento",
    TERRENO = "Terreno",
    DUPLEX = "Duplex",
    TRIPLEX = "Triplex",
    EDIFICIO = "Edificio",
    OTRO = "Otro",
}
export enum PropertyState {
    EXCELENTE = "Excelente",
    BUENO = "Bueno",
    REGULAR = "Regular",
    NECESITA_MEJORAS = "Necesita mejoras",
}
export enum ServiceType {
    AGUA_INDEPENDIENTE = "Agua independiente",
    AGUA_COMPARTIDO = "Agua compartido",
    LUZ_INDEPENDIENTE = "Luz independiente",
    LUZ_COMPARTIDO = "Luz compartido",
    GAS_INDEPENDIENTE = "Gas independiente",
    GAS_COMPARTIDO = "Gas compartido",
    INTERNET_INDEPENDIENTE = "Internet independiente",
    INTERNET_COMPARTIDO = "Internet compartido",
}
export enum CommonArea {
    PISCINA = "Piscina",
    GIMNASIO = "Gimnasio",
    AREA_PARRILLA = "Área de parrilla",
    AREA_TERRAZA = "Área de terraza",
    SALA_ESPERA = "Sala de espera",
    COWORKING = "Coworking",
}
export enum DayOfWeek {
    LUNES = "Lunes",
    MARTES = "Martes",
    MIERCOLES = "Miércoles",
    JUEVES = "Jueves",
    VIERNES = "Viernes",
    SABADO = "Sábado",
    DOMINGO = "Domingo",
}

export interface CaptacionFile {
  name: string;
  url: string;
}

export interface Captacion {
  id: string;
  created_by: string;
  status: CaptacionStatus;
  title: string;
  description: string;
  ownerData: {
    name: string;
    phone: string;
    email: string;
    relationship: string;
    authorizedPerson: string;
    propertyTitleNumber: string;
    hasMortgage: YesNo;
    mortgageTime: string;
    condoName: string;
    contractType: ContractType;
    listingType: ListingType;
  };
  propertyData: {
    address: string;
    reference: string;
    nearbyPlaces: string;
    propertyCategory: PropertyCategory;
    independent: string;
    constructionYears: string;
    landArea: string;
    builtArea: string;
    bedrooms: string;
    closets: string;
    bathrooms: string;
    laundry: YesNo;
    hasElevator: YesNo;
    floors: string;
    parking: string;
    hasAdditionalAreas: YesNo;
    latitude: number;
    longitude: number;
  };
  visitObservations: string;
  propertyStatus: {
    isOccupied: YesNo;
    wasRemodeled: YesNo;
    remodelYear: string;
    availableServices: ServiceType[];
    commonAreas: CommonArea[];
    acceptsBankFinancing: YesNo;
    propertyState: PropertyState;
    saleConditions: string;
    hasAlcabala: YesNo;
    maintenanceCost: string;
    hasFreeSchedule: YesNo;
    visitDays: DayOfWeek[];
    visitTimeStart: string;
    visitTimeEnd: string;
    reasonForSelling: string;
    specialFeature: string;
  };
  files: {
    featuredImage: CaptacionFile | null;
    gallery: CaptacionFile[];
    propertyTitleDeed: CaptacionFile | null;
    proofOfNoDebt: CaptacionFile | null;
    dni: CaptacionFile | null;
    authorization: CaptacionFile | null;
  };
}

// FIX: Added missing type definitions for User, Property, and Notification to resolve import errors in App.tsx.
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string; // Added phone field
  password?: string;
}

export interface Property {
  id: string;
  created_by: string;
  name: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareMeters: number;
  description: string;
  imageUrl: string;
  gallery: { url: string; name?: string; }[];
  latitude: number;
  longitude: number;
  propertyIdNumber: string;
  builtSquareMeters: number;
  propertyType: PropertyType;
  status: PropertySaleStatus;
  trafficLight?: PropertyTrafficLight;
  trafficLightReason?: string;
  listingType: ListingType;
  currency: Currency;
  propertyDocuments: { url: string; name: string; }[];
  sold_by_worker_id?: string | null;
}

export interface Notification {
  id: string;
  recipientId: string;
  message: string;
  timestamp: Date;
  readBy: string[];
}

export interface Task {
  id: string;
  created_by: string;
  propertyId?: string | null; 
  customAddress?: string | null; 
  latitude?: number | null; 
  longitude?: number | null; 
  workerId?: string; // Made optional for backward compatibility
  workerIds?: string[]; // New field for multiple workers
  description: string;
  dueDate: string; // YYYY-MM-DD
  time?: string; // HH:MM, optional for backward compatibility
  status: TaskStatus;
  visit_id?: string;
}

export interface ReportSections {
  description: boolean;
  details: boolean;
  gallery: boolean;
  location: boolean;
  documents: boolean;
}

export interface DailyLog {
  id: string;
  created_at: string;
  user_id: string;
  log_date: string; // YYYY-MM-DD
  log_time: string; // HH:MM:SS
  description: string;
  image_url?: string;
  images?: string[];
}
