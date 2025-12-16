export enum ResidenceID {
  NORTH = "RES_NORTH",
  SOUTH = "RES_SOUTH",
  CENTER = "RES_CENTER",
  EAST = "RES_EAST"
}

export enum EntityType {
  SCHOOL = "École / Université",
  INTERNSHIP = "Stage / Entreprise"
}

export enum PersonStatus {
  TENANT = "Locataire",
  PROSPECT = "Nouveau Contact"
}

export interface ResidenceConfig {
  id: ResidenceID;
  name: string;
  color: string;
}

export interface OriginOptions {
  schools: string[];
  internships: string[];
  studyFields: string[]; // Cursus / Filière (Ex: Droit, Marketing, Info...)
}

export interface Tenant {
  id: string;
  name: string;
  residenceId: ResidenceID;
  originName: string;
  originType: EntityType;
  cursus: string; // Nouveau champ Cursus
  studyYear: string;
  duration?: string;
  status: PersonStatus;
  email?: string;
}

export interface ChartData {
  name: string;
  value: number;
  fill?: string;
  fullName?: string;
}

export interface LinkData {
  source: string;
  target: string;
  value: number;
}

export interface NodeData {
  id: string;
  label?: string;
  group: number;
  value: number;
  color?: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}