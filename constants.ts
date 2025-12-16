import { Tenant, ResidenceID, EntityType, ResidenceConfig } from './types';

export const DEFAULT_RESIDENCE_CONFIG: ResidenceConfig[] = [
  { id: ResidenceID.NORTH, name: "Résidence du Parc (Nord)", color: '#3b82f6' },
  { id: ResidenceID.SOUTH, name: "Campus Sud (Sud)", color: '#ef4444' },
  { id: ResidenceID.CENTER, name: "Le Loft (Centre)", color: '#10b981' },
  { id: ResidenceID.EAST, name: "Rive Droite (Est)", color: '#f59e0b' },
];

export const MOCK_TENANTS: Tenant[] = [
  { id: '1', name: 'Alice D.', residenceId: ResidenceID.NORTH, originName: 'Université des Sciences', originType: EntityType.SCHOOL, studyYear: 'Master 1', duration: '2 ans' },
  { id: '2', name: 'Bob M.', residenceId: ResidenceID.NORTH, originName: 'Université des Sciences', originType: EntityType.SCHOOL, studyYear: 'Licence 3', duration: '10 mois' },
  { id: '3', name: 'Charlie P.', residenceId: ResidenceID.NORTH, originName: 'IUT Informatique', originType: EntityType.SCHOOL, studyYear: 'BUT 2', duration: '1 an' },
  { id: '4', name: 'Diane L.', residenceId: ResidenceID.SOUTH, originName: 'Business School A', originType: EntityType.SCHOOL, studyYear: 'Master 2', duration: '6 mois' },
  { id: '5', name: 'Evan R.', residenceId: ResidenceID.SOUTH, originName: 'Business School A', originType: EntityType.SCHOOL, studyYear: 'Master 1', duration: '2 ans' },
  { id: '6', name: 'Fanny G.', residenceId: ResidenceID.SOUTH, originName: 'Design Institute', originType: EntityType.SCHOOL, studyYear: 'Licence 1' },
  { id: '7', name: 'Gael H.', residenceId: ResidenceID.CENTER, originName: 'École d\'Art', originType: EntityType.SCHOOL, studyYear: 'Master 1', duration: '12 mois' },
  { id: '8', name: 'Hugo J.', residenceId: ResidenceID.CENTER, originName: 'Tech Startup Hub', originType: EntityType.INTERNSHIP, studyYear: 'Stage', duration: '6 mois' },
  { id: '9', name: 'Ines K.', residenceId: ResidenceID.CENTER, originName: 'Faculté de Droit', originType: EntityType.SCHOOL, studyYear: 'Licence 2', duration: '9 mois' },
  { id: '10', name: 'Jean L.', residenceId: ResidenceID.EAST, originName: 'Faculté de Médecine', originType: EntityType.SCHOOL, studyYear: 'Interne', duration: '3 ans' },
  { id: '11', name: 'Kevin M.', residenceId: ResidenceID.EAST, originName: 'Hôpital CHU', originType: EntityType.INTERNSHIP, studyYear: 'Stage', duration: '4 mois' },
  { id: '12', name: 'Lea N.', residenceId: ResidenceID.EAST, originName: 'Faculté de Médecine', originType: EntityType.SCHOOL, studyYear: '5ème année' },
  { id: '13', name: 'Marc O.', residenceId: ResidenceID.NORTH, originName: 'École d\'Ingénieurs Z', originType: EntityType.SCHOOL, studyYear: '3ème année', duration: '3 ans' },
  { id: '14', name: 'Nina P.', residenceId: ResidenceID.NORTH, originName: 'École d\'Ingénieurs Z', originType: EntityType.SCHOOL, studyYear: '4ème année' },
  { id: '15', name: 'Oscar Q.', residenceId: ResidenceID.SOUTH, originName: 'Banque Populaire Siege', originType: EntityType.INTERNSHIP, studyYear: 'Alternance', duration: '1 an' },
];

export const SCHOOL_COLOR = '#6b7280';