export const IMMIGRATION_STATUS_OPTIONS = [
  "Indefinite Leave to Remain / Settled Status",
  "EU Pre-Settled Status",
  "Skilled Worker Visa",
  "Student Visa",
  "Graduate Visa",
  "Family / Partner / Spouse Visa",
  "Global Talent Visa",
  "UK Ancestry Visa",
  "Innovator Founder Visa",
  "Visitor Visa",
  "Dependant Visa",
  "Health and Care Worker Visa",
  "Asylum Seeker / Awaiting an Asylum Decision",
  "Refugee Status / Humanitarian Protection",
  "Other UK Visa or Immigration Permission",
  "Visa Expired / No Current Permission",
  "Not Currently in the UK",
  "Not Sure",
] as const;

export type ImmigrationStatus = (typeof IMMIGRATION_STATUS_OPTIONS)[number];
