export type Degrees = number;
export type Meters = number;

export interface LatLonAlt {
  lat: Degrees;
  lon: Degrees;
  altM: Meters;
}

export type LonLatTuple = [lon: Degrees, lat: Degrees];

export interface GeoJsonPolygon {
  type: "Polygon";
  coordinates: LonLatTuple[][];
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
// # decision: external coordinates use lon/lat ordering (e.g. [-3.476, 50.5033]) and GeoJSON
// # impact: trajectories and sector math run in a near-planar frame, minimizing spherical math cost
// # impact: large-distance sims must rebase origin or accept distortion from the flat-earth model
// # impact: conversion helpers assume GeoJSON-style [lon, lat] ordering to avoid axis swaps

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

export const lonLatToLatLonAlt = (point: LonLatTuple, altM: Meters = 0): LatLonAlt => ({
  lon: point[0],
  lat: point[1],
  altM,
});

export const latLonAltToLonLat = (point: LatLonAlt): LonLatTuple => [point.lon, point.lat];

export const polygonLonLatToEnu = (
  polygon: GeoJsonPolygon,
  origin: GeoOrigin,
  altM: Meters = 0,
): EnuMeters[][] =>
  polygon.coordinates.map((ring) =>
    ring.map((coordinate) => latLonToEnu(lonLatToLatLonAlt(coordinate, altM), origin)),
  );

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
