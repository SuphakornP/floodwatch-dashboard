import { database } from "./database";

export type DamageAssessmentRecord = {
  id: string;
  reference: string;
  createdAt: string;
  assessorName: string;
  phone: string;
  organization: string | null;
  observedAt: string;
  district: string;
  village: string;
  locationDetails: string;
  latitude: string | null;
  longitude: string | null;
  severity: string;
  accessStatus: string;
  waterPresent: boolean;
  floodDepthCm: number;
  householdsAffected: number;
  peopleAffected: number;
  peopleDisplaced: number;
  peopleInjured: number;
  structuresDamaged: number;
  structuresDestroyed: number;
  categories: string;
  hazards: string;
  evidenceUrl: string | null;
  description: string;
};

const createTableSql = `
  CREATE TABLE IF NOT EXISTS damage_assessments (
    id TEXT PRIMARY KEY NOT NULL,
    reference TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    assessor_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    organization TEXT,
    observed_at TEXT NOT NULL,
    district TEXT NOT NULL,
    village TEXT NOT NULL,
    location_details TEXT NOT NULL,
    latitude TEXT,
    longitude TEXT,
    severity TEXT NOT NULL,
    access_status TEXT NOT NULL,
    water_present INTEGER NOT NULL DEFAULT 0,
    flood_depth_cm INTEGER NOT NULL DEFAULT 0,
    households_affected INTEGER NOT NULL DEFAULT 0,
    people_affected INTEGER NOT NULL DEFAULT 0,
    people_displaced INTEGER NOT NULL DEFAULT 0,
    people_injured INTEGER NOT NULL DEFAULT 0,
    structures_damaged INTEGER NOT NULL DEFAULT 0,
    structures_destroyed INTEGER NOT NULL DEFAULT 0,
    categories TEXT NOT NULL,
    hazards TEXT NOT NULL,
    evidence_url TEXT,
    description TEXT NOT NULL
  )
`;

let schemaReady: Promise<unknown> | null = null;

function ensureSchema() {
  schemaReady ??= database.batch([
    database.prepare(createTableSql),
    database.prepare("CREATE INDEX IF NOT EXISTS damage_assessments_status_created_idx ON damage_assessments (status, created_at)"),
    database.prepare("CREATE INDEX IF NOT EXISTS damage_assessments_district_idx ON damage_assessments (district)"),
  ]);
  return schemaReady;
}

export async function createDamageAssessment(record: DamageAssessmentRecord) {
  await ensureSchema();
  return database.prepare(`
    INSERT INTO damage_assessments (
      id, reference, created_at, status, assessor_name, phone, organization, observed_at,
      district, village, location_details, latitude, longitude, severity, access_status,
      water_present, flood_depth_cm, households_affected, people_affected, people_displaced,
      people_injured, structures_damaged, structures_destroyed, categories, hazards,
      evidence_url, description
    ) VALUES (?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    record.id,
    record.reference,
    record.createdAt,
    record.assessorName,
    record.phone,
    record.organization,
    record.observedAt,
    record.district,
    record.village,
    record.locationDetails,
    record.latitude,
    record.longitude,
    record.severity,
    record.accessStatus,
    record.waterPresent ? 1 : 0,
    record.floodDepthCm,
    record.householdsAffected,
    record.peopleAffected,
    record.peopleDisplaced,
    record.peopleInjured,
    record.structuresDamaged,
    record.structuresDestroyed,
    record.categories,
    record.hazards,
    record.evidenceUrl,
    record.description,
  ).run();
}
