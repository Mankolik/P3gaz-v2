export type Degrees = number;
export type Meters = number;

export interface LatLonAlt {
  lat: Degrees;
  lon: Degrees;
  altM: Meters;
}

export interface EnuMeters {
  eastM: Meters;
  northM: Meters;
  upM: Meters;
}

export interface GeoOrigin {
  reference: LatLonAlt;
}

// # decision: internal coordinates are local ENU (meters) relative to a reference origin
// # impact: trajectories and sector math run in a near-planar frame, minimizing spherical math cost
// # impact: large-distance sims must rebase origin or accept distortion from the flat-earth model

export const EARTH_RADIUS_M = 6_378_137;

export const degreesToRadians = (degrees: Degrees): number => (degrees * Math.PI) / 180;
export const radiansToDegrees = (radians: number): Degrees => (radians * 180) / Math.PI;

export const latLonToEnu = (point: LatLonAlt, origin: GeoOrigin): EnuMeters => {
  const originLatRad = degreesToRadians(origin.reference.lat);
  const dLat = degreesToRadians(point.lat - origin.reference.lat);
  const dLon = degreesToRadians(point.lon - origin.reference.lon);

  const eastM = dLon * Math.cos(originLatRad) * EARTH_RADIUS_M;
  const northM = dLat * EARTH_RADIUS_M;
  const upM = point.altM - origin.reference.altM;

  return { eastM, northM, upM };
};

export const enuToLatLon = (enu: EnuMeters, origin: GeoOrigin): LatLonAlt => {
  const originLatRad = degreesToRadians(origin.reference.lat);
  const dLat = enu.northM / EARTH_RADIUS_M;
  const dLon = enu.eastM / (EARTH_RADIUS_M * Math.cos(originLatRad));

  return {
    lat: origin.reference.lat + radiansToDegrees(dLat),
    lon: origin.reference.lon + radiansToDegrees(dLon),
    altM: origin.reference.altM + enu.upM,
  };
};
