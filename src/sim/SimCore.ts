import { TrackStatus } from "../model/TrackStatus";

export type StepFn = (dtMs: number) => void;

export type RandomFn = () => number;

export interface SimCoreOptions {
  step: StepFn;
  rng?: RandomFn;
}

export interface TrackStatusSignals {
  isPreInbound?: boolean;
  isInbound?: boolean;
  isAccepted?: boolean;
  isIntruder?: boolean;
  hasInboundOffer?: boolean;
  hasOutboundOffer?: boolean;
}

export class SimCore {
  static readonly FIXED_TIMESTEP_MS = 100; // 10Hz

  private accumulatorMs = 0;
  private readonly stepFn: StepFn;
  private readonly rng: RandomFn;

  constructor(options: SimCoreOptions) {
    this.stepFn = options.step;
    this.rng = options.rng ?? (() => 0.5);
    // # determinism: avoid wall-clock randomness by routing randomness through rng
  }

  advance(elapsedMs: number): void {
    if (elapsedMs <= 0) {
      return;
    }

    this.accumulatorMs += elapsedMs;

    // # update phase: consume fixed-size simulation steps deterministically
    while (this.accumulatorMs >= SimCore.FIXED_TIMESTEP_MS) {
      this.stepFn(SimCore.FIXED_TIMESTEP_MS);
      this.accumulatorMs -= SimCore.FIXED_TIMESTEP_MS;
    }

    // # update phase: interpolation only, no state mutation here
  }

  get alpha(): number {
    return this.accumulatorMs / SimCore.FIXED_TIMESTEP_MS;
  }

  getRandom(): number {
    // # future: swap for seeded RNG or replayable stream
    return this.rng();
  }

  static transitionTrackStatus(
    current: TrackStatus,
    signals: TrackStatusSignals,
  ): TrackStatus {
    // # transition: any -> INTRUDER when conflict/unauthorized criteria are met
    if (signals.isIntruder) {
      return TrackStatus.INTRUDER;
    }

    // # transition: any -> ACCEPTED when receiving sector formally accepts responsibility
    if (signals.isAccepted) {
      return TrackStatus.ACCEPTED;
    }

    // # transition: any -> INBOUND_OFFER when upstream offers inbound handoff
    if (signals.hasInboundOffer) {
      return TrackStatus.INBOUND_OFFER;
    }

    // # transition: any -> OUTBOUND_OFFER when downstream requests outbound handoff
    if (signals.hasOutboundOffer) {
      return TrackStatus.OUTBOUND_OFFER;
    }

    // # transition: UNCONCERNED/PRE_INBOUND -> INBOUND when crossing inbound boundary/ETA gate
    if (signals.isInbound) {
      return TrackStatus.INBOUND;
    }

    // # transition: UNCONCERNED -> PRE_INBOUND when projected inbound window starts
    if (signals.isPreInbound) {
      return TrackStatus.PRE_INBOUND;
    }

    // # transition: fallback to UNCONCERNED when none of the inbound criteria are met
    return TrackStatus.UNCONCERNED;
  }
}
