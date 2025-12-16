import { Tenant, ResidenceID, EntityType, ResidenceConfig, PersonStatus, OriginOptions } from './types';

export const DEFAULT_RESIDENCE_CONFIG: ResidenceConfig[] = [
  { id: ResidenceID.NORTH, name: "Résidence du Parc (Nord)", color: '#3b82f6' },
  { id: ResidenceID.SOUTH, name: "Campus Sud (Sud)", color: '#ef4444' },
  { id: ResidenceID.CENTER, name: "Le Loft (Centre)", color: '#10b981' },
  { id: ResidenceID.EAST, name: "Rive Droite (Est)", color: '#f59e0b' },
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
  ]
};

export const MOCK_TENANTS: Tenant[] = [
  { id: '1', name: 'Alice D.', residenceId: ResidenceID.NORTH, originName: 'Université des Sciences', originType: EntityType.SCHOOL, studyYear: 'Master 1', duration: '2 ans', status: PersonStatus.TENANT },
  { id: '2', name: 'Bob M.', residenceId: ResidenceID.NORTH, originName: 'Université des Sciences', originType: EntityType.SCHOOL, studyYear: 'Licence 3', duration: '10 mois', status: PersonStatus.TENANT },
  { id: '3', name: 'Charlie P.', residenceId: ResidenceID.NORTH, originName: 'IUT Informatique', originType: EntityType.SCHOOL, studyYear: 'BUT 2', duration: '1 an', status: PersonStatus.TENANT },
  { id: '4', name: 'Diane L.', residenceId: ResidenceID.SOUTH, originName: 'Business School A', originType: EntityType.SCHOOL, studyYear: 'Master 2', duration: '6 mois', status: PersonStatus.TENANT },
  { id: '5', name: 'Evan R.', residenceId: ResidenceID.SOUTH, originName: 'Business School A', originType: EntityType.SCHOOL, studyYear: 'Master 1', duration: '2 ans', status: PersonStatus.TENANT },
  { id: '6', name: 'Fanny G.', residenceId: ResidenceID.SOUTH, originName: 'Design Institute', originType: EntityType.SCHOOL, studyYear: 'Licence 1', status: PersonStatus.TENANT },
  { id: '7', name: 'Gael H.', residenceId: ResidenceID.CENTER, originName: 'École d\'Art', originType: EntityType.SCHOOL, studyYear: 'Master 1', duration: '12 mois', status: PersonStatus.TENANT },
  { id: '8', name: 'Hugo J.', residenceId: ResidenceID.CENTER, originName: 'Tech Startup Hub', originType: EntityType.INTERNSHIP, studyYear: 'Stage', duration: '6 mois', status: PersonStatus.TENANT },
  { id: '9', name: 'Ines K.', residenceId: ResidenceID.CENTER, originName: 'Faculté de Droit', originType: EntityType.SCHOOL, studyYear: 'Licence 2', duration: '9 mois', status: PersonStatus.TENANT },
  { id: '10', name: 'Jean L.', residenceId: ResidenceID.EAST, originName: 'Faculté de Médecine', originType: EntityType.SCHOOL, studyYear: 'Interne', duration: '3 ans', status: PersonStatus.TENANT },
  { id: '11', name: 'Kevin M.', residenceId: ResidenceID.EAST, originName: 'Hôpital CHU', originType: EntityType.INTERNSHIP, studyYear: 'Stage', duration: '4 mois', status: PersonStatus.TENANT },
  { id: '12', name: 'Lea N.', residenceId: ResidenceID.EAST, originName: 'Faculté de Médecine', originType: EntityType.SCHOOL, studyYear: '5ème année', status: PersonStatus.TENANT },
  { id: '13', name: 'Marc O.', residenceId: ResidenceID.NORTH, originName: 'École d\'Ingénieurs Z', originType: EntityType.SCHOOL, studyYear: '3ème année', duration: '3 ans', status: PersonStatus.TENANT },
  { id: '14', name: 'Nina P.', residenceId: ResidenceID.NORTH, originName: 'École d\'Ingénieurs Z', originType: EntityType.SCHOOL, studyYear: '4ème année', status: PersonStatus.TENANT },
  { id: '15', name: 'Oscar Q.', residenceId: ResidenceID.SOUTH, originName: 'Banque Populaire Siege', originType: EntityType.INTERNSHIP, studyYear: 'Alternance', duration: '1 an', status: PersonStatus.TENANT },
  // Nouveaux contacts exemples
  { id: '101', name: 'Thomas V.', residenceId: ResidenceID.CENTER, originName: 'École d\'Art', originType: EntityType.SCHOOL, studyYear: 'Terminale', status: PersonStatus.PROSPECT },
  { id: '102', name: 'Sarah B.', residenceId: ResidenceID.NORTH, originName: 'Lycée International', originType: EntityType.SCHOOL, studyYear: 'Terminale', status: PersonStatus.PROSPECT },
];

export const SCHOOL_COLOR = '#6b7280';

// Configuration Firebase intégrée pour éviter la saisie manuelle
export const EMBEDDED_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBjfqf-viJEaFoMJNx63hQBNSI3OL8vbIY",
  authDomain: "resimap63000.firebaseapp.com",
  projectId: "resimap63000",
  storageBucket: "resimap63000.firebasestorage.app",
  messagingSenderId: "660641960588",
  appId: "1:660641960588:web:60b267fd71b4720db161a9",
  measurementId: "G-DRLR3D84YS",
  // URL Standard Europe (West 1)
  databaseURL: "https://resimap63000-default-rtdb.europe-west1.firebasedatabase.app"
};