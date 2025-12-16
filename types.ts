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

export interface ResidenceConfig {
  id: ResidenceID;
  name: string;
  color: string;
}

export interface Tenant {
  id: string;
  name: string;
  residenceId: ResidenceID;
  originName: string;
  originType: EntityType;
  studyYear: string;
  duration?: string; // Nouveau champ optionnel pour la durée
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