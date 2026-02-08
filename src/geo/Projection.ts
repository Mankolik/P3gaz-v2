import type { EnuMeters, Meters } from "./GeoTypes";

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface ProjectionConfig {
  pixelsPerMeter: number;
  screenOrigin: ScreenPoint;
  northUp: boolean;
}

export const createDefaultProjection = (): ProjectionConfig => ({
  pixelsPerMeter: 1,
  screenOrigin: { x: 0, y: 0 },
  northUp: true,
});

// # decision: rendering uses a simple ENU-to-screen linear projection
// # impact: mouse picking can invert the projection without extra map APIs
// # impact: sector geometry stays in ENU meters and only projects at draw time

export const enuToScreen = (enu: EnuMeters, config: ProjectionConfig): ScreenPoint => {
  const x = config.screenOrigin.x + enu.eastM * config.pixelsPerMeter;
  const yFactor = config.northUp ? -1 : 1;
  const y = config.screenOrigin.y + enu.northM * config.pixelsPerMeter * yFactor;

  return { x, y };
};

export const screenToEnu = (screen: ScreenPoint, config: ProjectionConfig): EnuMeters => {
  const eastM = (screen.x - config.screenOrigin.x) / config.pixelsPerMeter;
  const yFactor = config.northUp ? -1 : 1;
  const northM = (screen.y - config.screenOrigin.y) / (config.pixelsPerMeter * yFactor);

  return { eastM, northM, upM: 0 };
};

export const metersToPixels = (meters: Meters, config: ProjectionConfig): number =>
  meters * config.pixelsPerMeter;

export const pixelsToMeters = (pixels: number, config: ProjectionConfig): Meters =>
  pixels / config.pixelsPerMeter;

// # note: mouse picking should convert screen -> ENU, then test against sector polygons in ENU
// # note: trajectory math should remain in ENU to avoid mixing map projection distortion
