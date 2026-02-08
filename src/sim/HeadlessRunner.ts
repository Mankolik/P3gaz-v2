import type { SectorConfig, Track } from "../model/ModelTypes";
import { SimCore } from "./SimCore";

export interface HeadlessModel {
  timestampMs: number;
  tracks: Track[];
  sectors?: SectorConfig;
}

export interface HeadlessSnapshot {
  tick: number;
  alpha: number;
  timestampMs: number;
  model: HeadlessModel;
}

export type SnapshotListener = (snapshot: HeadlessSnapshot) => void;

export type HeadlessStepFn = (
  model: HeadlessModel,
  dtMs: number,
  core: SimCore,
) => HeadlessModel;

export interface HeadlessRunnerOptions {
  model: HeadlessModel;
  step?: HeadlessStepFn;
  rng?: () => number;
  intervalMs?: number;
}

const defaultStep: HeadlessStepFn = (model, dtMs) => ({
  ...model,
  timestampMs: model.timestampMs + dtMs,
});

export class HeadlessRunner {
  private core: SimCore;
  private state: HeadlessModel;
  private tick = 0;
  private lastTimerMs = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private readonly listeners = new Set<SnapshotListener>();
  private readonly stepFn: HeadlessStepFn;
  private readonly intervalMs: number;

  constructor(options: HeadlessRunnerOptions) {
    this.state = options.model;
    this.stepFn = options.step ?? defaultStep;
    this.intervalMs = options.intervalMs ?? SimCore.FIXED_TIMESTEP_MS;
    this.core = new SimCore({
      rng: options.rng,
      step: (dtMs) => {
        this.state = this.stepFn(this.state, dtMs, this.core);
        this.tick += 1;
        this.emitSnapshot();
      },
    });
  }

  get model(): HeadlessModel {
    return this.state;
  }

  onSnapshot(listener: SnapshotListener): void {
    // # renderer hook: a future UI can subscribe here and render each snapshot
    this.listeners.add(listener);
  }

  offSnapshot(listener: SnapshotListener): void {
    this.listeners.delete(listener);
  }

  advanceBy(elapsedMs: number): void {
    const tickBefore = this.tick;
    this.core.advance(elapsedMs);

    if (this.tick === tickBefore) {
      this.emitSnapshot();
    }
  }

  startTimer(): void {
    if (this.timerId) {
      return;
    }

    this.lastTimerMs = Date.now();
    this.timerId = setInterval(() => {
      const nowMs = Date.now();
      const elapsedMs = nowMs - this.lastTimerMs;
      this.lastTimerMs = nowMs;
      this.advanceBy(elapsedMs);
    }, this.intervalMs);
  }

  stopTimer(): void {
    if (!this.timerId) {
      return;
    }

    clearInterval(this.timerId);
    this.timerId = null;
  }

  private emitSnapshot(): void {
    const snapshot: HeadlessSnapshot = {
      tick: this.tick,
      alpha: this.core.alpha,
      timestampMs: this.state.timestampMs,
      model: this.state,
    };

    this.listeners.forEach((listener) => listener(snapshot));
  }
}
