import { Tenant, ResidenceID, EntityType, ResidenceConfig, PersonStatus, OriginOptions, Gender } from './types';

export const DEFAULT_RESIDENCE_CONFIG: ResidenceConfig[] = [
  { id: ResidenceID.NORTH, name: "Résidence du Parc (Nord)", color: '#3b82f6', capacity: 50 },
  { id: ResidenceID.SOUTH, name: "Campus Sud (Sud)", color: '#ef4444', capacity: 50 },
  { id: ResidenceID.CENTER, name: "Le Loft (Centre)", color: '#10b981', capacity: 40 },
  { id: ResidenceID.EAST, name: "Rive Droite (Est)", color: '#f59e0b', capacity: 60 },
];

export const DEFAULT_ORIGIN_OPTIONS: OriginOptions = {
  schools: [
    "Université des Sciences",
    "IUT Informatique",
    "Business School A",
    "Design Institute",
    "École d'Art",
    "Faculté de Droit",
    "Faculté de Médecine",
    "École d'Ingénieurs Z",
    "Lycée International"
  ],
  internships: [
    "Tech Startup Hub",
    "Hôpital CHU",
    "Banque Populaire Siege"
  ],
  studyFields: [
    "Informatique / Numérique",
    "Commerce / Marketing",
    "Droit / Sciences Po",
    "Médecine / Santé",
    "Ingénierie",
    "Arts / Design",
    "Lettres / Langues",
    "Sciences (Bio, Physique...)"
  ]
};

// Dates calculées pour avoir des données cohérentes en "temps réel"
const now = new Date();
const dateMinusMonths = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
};

export const MOCK_TENANTS: Tenant[] = [
  { id: '1', name: 'Alice D.', gender: Gender.FEMALE, residenceId: ResidenceID.NORTH, originName: 'Université des Sciences', originType: EntityType.SCHOOL, cursus: 'Sciences (Bio, Physique...)', studyYear: 'Master 1', startDate: dateMinusMonths(24), endDate: dateMinusMonths(1), duration: '2 ans', status: PersonStatus.TENANT },
  { id: '2', name: 'Bob M.', gender: Gender.MALE, residenceId: ResidenceID.NORTH, originName: 'Université des Sciences', originType: EntityType.SCHOOL, cursus: 'Informatique / Numérique', studyYear: 'Licence 3', startDate: dateMinusMonths(10), duration: '10 mois', status: PersonStatus.TENANT },
  { id: '3', name: 'Charlie P.', residenceId: ResidenceID.NORTH, originName: 'IUT Informatique', originType: EntityType.SCHOOL, cursus: 'Informatique / Numérique', studyYear: 'BUT 2', startDate: dateMinusMonths(12), duration: '1 an', status: PersonStatus.TENANT },
  { id: '4', name: 'Diane L.', gender: Gender.FEMALE, residenceId: ResidenceID.SOUTH, originName: 'Business School A', originType: EntityType.SCHOOL, cursus: 'Commerce / Marketing', studyYear: 'Master 2', startDate: dateMinusMonths(6), duration: '6 mois', status: PersonStatus.TENANT },
  { id: '5', name: 'Evan R.', residenceId: ResidenceID.SOUTH, originName: 'Business School A', originType: EntityType.SCHOOL, cursus: 'Commerce / Marketing', studyYear: 'Master 1', startDate: dateMinusMonths(24), duration: '2 ans', status: PersonStatus.TENANT },
  { id: '6', name: 'Fanny G.', residenceId: ResidenceID.SOUTH, originName: 'Design Institute', originType: EntityType.SCHOOL, cursus: 'Arts / Design', studyYear: 'Licence 1', startDate: dateMinusMonths(2), status: PersonStatus.TENANT },
  { id: '7', name: 'Gael H.', residenceId: ResidenceID.CENTER, originName: 'École d\'Art', originType: EntityType.SCHOOL, cursus: 'Arts / Design', studyYear: 'Master 1', startDate: dateMinusMonths(12), duration: '12 mois', status: PersonStatus.TENANT },
  { id: '8', name: 'Hugo J.', residenceId: ResidenceID.CENTER, originName: 'Tech Startup Hub', originType: EntityType.INTERNSHIP, cursus: 'Informatique / Numérique', studyYear: 'Stage', startDate: dateMinusMonths(6), duration: '6 mois', status: PersonStatus.TENANT },
  { id: '9', name: 'Ines K.', residenceId: ResidenceID.CENTER, originName: 'Faculté de Droit', originType: EntityType.SCHOOL, cursus: 'Droit / Sciences Po', studyYear: 'Licence 2', startDate: dateMinusMonths(9), duration: '9 mois', status: PersonStatus.TENANT },
  { id: '10', name: 'Jean L.', gender: Gender.MALE, residenceId: ResidenceID.EAST, originName: 'Faculté de Médecine', originType: EntityType.SCHOOL, cursus: 'Médecine / Santé', studyYear: 'Interne', startDate: dateMinusMonths(36), duration: '3 ans', status: PersonStatus.TENANT },
  { id: '11', name: 'Kevin M.', residenceId: ResidenceID.EAST, originName: 'Hôpital CHU', originType: EntityType.INTERNSHIP, cursus: 'Médecine / Santé', studyYear: 'Stage', startDate: dateMinusMonths(4), duration: '4 mois', status: PersonStatus.TENANT },
  { id: '12', name: 'Lea N.', residenceId: ResidenceID.EAST, originName: 'Faculté de Médecine', originType: EntityType.SCHOOL, cursus: 'Médecine / Santé', studyYear: '5ème année', startDate: dateMinusMonths(60), status: PersonStatus.TENANT },
  { id: '13', name: 'Marc O.', residenceId: ResidenceID.NORTH, originName: 'École d\'Ingénieurs Z', originType: EntityType.SCHOOL, cursus: 'Ingénierie', studyYear: '3ème année', startDate: dateMinusMonths(36), duration: '3 ans', status: PersonStatus.TENANT },
  { id: '14', name: 'Nina P.', residenceId: ResidenceID.NORTH, originName: 'École d\'Ingénieurs Z', originType: EntityType.SCHOOL, cursus: 'Ingénierie', studyYear: '4ème année', startDate: dateMinusMonths(48), status: PersonStatus.TENANT },
  { id: '15', name: 'Oscar Q.', residenceId: ResidenceID.SOUTH, originName: 'Banque Populaire Siege', originType: EntityType.INTERNSHIP, cursus: 'Commerce / Marketing', studyYear: 'Alternance', startDate: dateMinusMonths(12), duration: '1 an', status: PersonStatus.TENANT },
  // Nouveaux contacts exemples
  { id: '101', name: 'Thomas V.', gender: Gender.MALE, residenceId: ResidenceID.CENTER, originName: 'École d\'Art', originType: EntityType.SCHOOL, cursus: 'Arts / Design', studyYear: 'Terminale', status: PersonStatus.PROSPECT },
  { id: '102', name: 'Sarah B.', gender: Gender.FEMALE, residenceId: ResidenceID.NORTH, originName: 'Lycée International', originType: EntityType.SCHOOL, cursus: 'Lettres / Langues', studyYear: 'Terminale', status: PersonStatus.PROSPECT },
];

export const SCHOOL_COLOR = '#6b7280';

// Configuration Firebase intégrée pour le mode "Site Partagé"
export const EMBEDDED_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBjfqf-viJEaFoMJNx63hQBNSI3OL8vbIY",
  authDomain: "resimap63000.firebaseapp.com",
  databaseURL: "https://resimap63000-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "resimap63000",
  storageBucket: "resimap63000.firebasestorage.app",
  messagingSenderId: "660641960588",
  appId: "1:660641960588:web:60b267fd71b4720db161a9",
  measurementId: "G-DRLR3D84YS"
};