import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const helpRequests = sqliteTable("help_requests", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  createdAt: text("created_at").notNull(),
  status: text("status").notNull().default("new"),
  urgency: text("urgency").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  alternateContact: text("alternate_contact"),
  preferredLanguage: text("preferred_language").notNull(),
  district: text("district").notNull(),
  village: text("village").notNull(),
  locationDetails: text("location_details").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  peopleCount: integer("people_count").notNull(),
  childrenUnderFive: integer("children_under_five").notNull().default(0),
  olderAdults: integer("older_adults").notNull().default(0),
  disabilityOrMobilityNeeds: integer("disability_or_mobility_needs", { mode: "boolean" }).notNull().default(false),
  needs: text("needs").notNull(),
  details: text("details").notNull(),
}, (table) => [
  index("help_requests_status_created_idx").on(table.status, table.createdAt),
  index("help_requests_district_idx").on(table.district),
]);
