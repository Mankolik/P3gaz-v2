import type { Degrees, EnuMeters, GeoJsonPolygon, LatLonAlt } from "../geo/GeoTypes";
import type { TrackStatus } from "./TrackStatus";

export type NauticalMiles = number;
export type Knots = number;
export type Feet = number;

export type SectorId = string;

export interface Sector {
  id: SectorId;
  name: string;
  boundary: GeoJsonPolygon;
  floorFt: Feet;
  ceilingFt: Feet;
  frequency?: string;
  // # intent: keep sector geometry in GeoJSON for tooling compatibility
  // # future: allow dynamic activation windows per sector
}

export interface SectorSet {
  id: string;
  name: string;
  sectorIds: SectorId[];
  // # intent: named groupings for staffing and split/merge scenarios
  // # future: store capacity or staffing metadata
}

export interface SectorConfig {
  sectors: Sector[];
  sets: SectorSet[];
  // # intent: capture static sector definitions plus operational groupings
  // # future: include LOA/ownership and flow rules
}

export type WaypointKind = "FIX" | "VOR" | "NDB" | "AIRPORT" | "RNAV";

export interface Waypoint {
  id: string;
  name: string;
  kind: WaypointKind;
  position: LatLonAlt;
  elevationFt?: Feet;
  // # intent: unify fixes and navaids under one type
  // # future: add magnetic variation and multiple coordinate sources
}

export type Fix = Waypoint;

export interface RouteLeg {
  from: Fix;
  to: Fix;
  airway?: string;
  distanceNm?: NauticalMiles;
  // # intent: explicit leg structure for ETA and intent modeling
  // # future: attach per-leg constraints (speed/altitude)
}

export interface Route {
  id: string;
  name?: string;
  legs: RouteLeg[];
  totalDistanceNm?: NauticalMiles;
  // # intent: ordered legs define the path for intent and prediction
  // # future: include SID/STAR references and cached geometry
}

export interface FlightPlan {
  callsign: string;
  departureIcao: string;
  arrivalIcao: string;
  alternateIcao?: string;
  route: Route;
  cruiseAltitudeFt: Feet;
  requestedSpeedKt?: Knots;
  filedEnrouteTimeMin?: number;
  remarks?: string;
  // # intent: filed plan separate from live track intent
  // # future: add fuel, EET by FIR, and equipment codes
}

export interface AircraftPerformanceProfile {
  climbRateFpm: number;
  descentRateFpm: number;
  cruiseSpeedKt: Knots;
  maxSpeedKt: Knots;
  minSpeedKt: Knots;
  serviceCeilingFt: Feet;
  turnRateDegPerSec?: Degrees;
  // # intent: lightweight performance profile for planning and sim
  // # future: add altitude/weight-dependent tables
}

export interface AircraftType {
  icao: string;
  name: string;
  wakeCategory?: string;
  performance: AircraftPerformanceProfile;
  // # intent: normalize aircraft types by ICAO designator
  // # future: attach airline-specific overrides
}

export interface AirlineLivery {
  id: string;
  name: string;
  primaryColorHex?: string;
  secondaryColorHex?: string;
  textureUrl?: string;
  // # intent: keep visual assets separate from airline identity
  // # future: support variant liveries by registration or season
}

export interface CallsignRule {
  airlineIcao: string;
  spokenName: string;
  pattern: string;
  allowLeadingZeros?: boolean;
  // # intent: define how flight numbers map to spoken callsigns
  // # future: support locale-specific pronunciation rules
}

export interface Airline {
  icao: string;
  iata?: string;
  name: string;
  defaultLivery?: AirlineLivery;
  liveries?: AirlineLivery[];
  callsignRules?: CallsignRule[];
  // # intent: group branding, liveries, and callsign logic
  // # future: include fleet mappings and schedules
}

export interface TrackState {
  position: LatLonAlt;
  velocityEnu?: EnuMeters;
  groundspeedKt?: Knots;
  headingDeg?: Degrees;
  verticalSpeedFpm?: number;
  timestampMs: number;
  // # intent: latest observed state for conflict detection and UI
  // # future: add sensor quality flags and provenance
}

export interface TrackIntent {
  flightPlan?: FlightPlan;
  assignedRoute?: Route;
  targetFixId?: string;
  clearedAltitudeFt?: Feet;
  clearedSpeedKt?: Knots;
  clearedHeadingDeg?: Degrees;
  // # intent: controller clearances and desired path separate from state
  // # future: include managed mode flags and constraints
}

export interface TrackHistoryEntry {
  state: TrackState;
  source?: string;
  // # intent: snapshots for smoothing and playback
  // # future: include error bounds per update
}

export interface Track {
  id: string;
  callsign: string;
  aircraftType?: AircraftType;
  airline?: Airline;
  state: TrackState;
  intent?: TrackIntent;
  status?: TrackStatus;
  history?: TrackHistoryEntry[];
  // # intent: consolidate state, intent, and metadata per aircraft
  // # future: add multi-sensor fusion and handoff lifecycle
}
