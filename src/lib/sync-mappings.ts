import { TEAMS, PARTICIPANTS } from './constants';

/**
 * Maps full team names (from Google Sheet) to team abbreviations (DB)
 * Auto-derived from TEAMS constant to stay in sync if teams change
 */
export const TEAM_NAME_TO_ABBR: Record<string, string> = Object.entries(TEAMS).reduce(
  (acc, [abbr, config]) => {
    acc[config.name] = abbr;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Common informal abbreviations players type in the sheet that aren't the
 * canonical 3–4 letter abbreviation. Case-insensitive — keys must be UPPERCASE.
 * Add entries here when a sync run reports `Unknown team '<X>'` for a value
 * that's really one of our teams.
 */
export const TEAM_ABBR_ALIASES: Record<string, string> = {
  PK: 'PBKS',
  PB: 'PBKS',
  PUNJAB: 'PBKS',
  BLR: 'RCB',
  BANGALORE: 'RCB',
  BENGALURU: 'RCB',
  HYD: 'SRH',
  CHE: 'CSK',
  KOL: 'KKR',
  MUM: 'MI',
  DEL: 'DC',
  LKO: 'LSG',
  LUCKNOW: 'LSG',
  RAJ: 'RR',
  GUJ: 'GT',
};

/**
 * Resolves a team value (full name, canonical abbreviation, or informal alias)
 * to its canonical abbreviation. Returns null if the value can't be resolved.
 *
 * Used by the sync layer to coerce sheet values to DB-friendly abbreviations.
 */
export function resolveTeamAbbr(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = raw.toString().trim();
  if (trimmed === '') return null;
  const upper = trimmed.toUpperCase();
  if (TEAM_NAME_TO_ABBR[trimmed]) return TEAM_NAME_TO_ABBR[trimmed];
  if (Object.values(TEAM_NAME_TO_ABBR).includes(upper)) return upper;
  if (TEAM_ABBR_ALIASES[upper]) return TEAM_ABBR_ALIASES[upper];
  return null;
}

/**
 * Maps sheet player display names to database participant IDs
 * Includes special overrides for name mismatches
 */
const SHEET_PLAYER_OVERRIDES: Record<string, string> = {
  'Manick': 'panicking',
  'Manikbasha': 'panicking', // Legacy alias
  'Sathish': 'sathish',
  'Satish': 'sathish',
  'Vamshi': 'vamshi',
  'Vamsi': 'vamshi', // Legacy alias
};

/**
 * Resolves a player name from the sheet to a participant ID in the database
 * Handles special overrides and lowercase fallback
 *
 * @param sheetName - Player name as it appears in the Google Sheet
 * @returns Participant ID, or null if not found
 */
export function resolvePlayerId(sheetName: string): string | null {
  // Check overrides first
  if (SHEET_PLAYER_OVERRIDES[sheetName]) {
    return SHEET_PLAYER_OVERRIDES[sheetName];
  }

  // Try exact match (case-insensitive)
  const participant = PARTICIPANTS.find(
    (p) => p.name.toLowerCase() === sheetName.toLowerCase()
  );
  if (participant) {
    return participant.id;
  }

  // Fallback: return lowercase version if it doesn't match any participant
  return null;
}

/**
 * Maps match type from sheet format to database format
 * Sheet formats: "Normal", "Qualifier 1", "Qualifier 2", "Eliminator", "Final"
 * DB formats: "league", "qualifier1", "qualifier2", "eliminator", "final"
 */
export const MATCH_TYPE_MAP: Record<string, string> = {
  'Normal': 'league',
  'League': 'league',
  'Power': 'league', // Power matches are identified by is_power_match flag, not match_type
  'Qualifier 1': 'qualifier1',
  'Qualifier1': 'qualifier1',
  'Qualifier 2': 'qualifier2',
  'Qualifier2': 'qualifier2',
  'Eliminator': 'eliminator',
  'Final': 'final',
};

/**
 * Converts a match type from sheet format to DB format
 * @param sheetMatchType - Match type from Google Sheet
 * @returns Database match type, defaults to 'league' if not found
 */
export function resolveMatchType(sheetMatchType: string): string {
  return MATCH_TYPE_MAP[sheetMatchType] || 'league';
}
