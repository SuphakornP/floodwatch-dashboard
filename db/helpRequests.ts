import { database } from "./database";

export type HelpRequestRecord = {
  id: string;
  reference: string;
  createdAt: string;
  urgency: string;
  fullName: string;
  phone: string;
  alternateContact: string | null;
  preferredLanguage: string;
  district: string;
  village: string;
  locationDetails: string;
  latitude: string | null;
  longitude: string | null;
  peopleCount: number;
  childrenUnderFive: number;
  olderAdults: number;
  disabilityOrMobilityNeeds: boolean;
  needs: string;
  details: string;
};

const createTableSql = `
  CREATE TABLE IF NOT EXISTS help_requests (
    id TEXT PRIMARY KEY NOT NULL,
    reference TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    urgency TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    alternate_contact TEXT,
    preferred_language TEXT NOT NULL,
    district TEXT NOT NULL,
    village TEXT NOT NULL,
    location_details TEXT NOT NULL,
    latitude TEXT,
    longitude TEXT,
    people_count INTEGER NOT NULL,
    children_under_five INTEGER NOT NULL DEFAULT 0,
    older_adults INTEGER NOT NULL DEFAULT 0,
    disability_or_mobility_needs INTEGER NOT NULL DEFAULT 0,
    needs TEXT NOT NULL,
    details TEXT NOT NULL
  )
`;

let schemaReady: Promise<unknown> | null = null;

function ensureSchema() {
  schemaReady ??= database.batch([
    database.prepare(createTableSql),
    database.prepare("CREATE INDEX IF NOT EXISTS help_requests_status_created_idx ON help_requests (status, created_at)"),
    database.prepare("CREATE INDEX IF NOT EXISTS help_requests_district_idx ON help_requests (district)"),
  ]);
  return schemaReady;
}

export async function createHelpRequest(record: HelpRequestRecord) {
  await ensureSchema();
  return database.prepare(`
    INSERT INTO help_requests (
      id, reference, created_at, status, urgency, full_name, phone, alternate_contact,
      preferred_language, district, village, location_details, latitude, longitude,
      people_count, children_under_five, older_adults, disability_or_mobility_needs,
      needs, details
    ) VALUES (?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    record.id,
    record.reference,
    record.createdAt,
    record.urgency,
    record.fullName,
    record.phone,
    record.alternateContact,
    record.preferredLanguage,
    record.district,
    record.village,
    record.locationDetails,
    record.latitude,
    record.longitude,
    record.peopleCount,
    record.childrenUnderFive,
    record.olderAdults,
    record.disabilityOrMobilityNeeds ? 1 : 0,
    record.needs,
    record.details,
  ).run();
}
