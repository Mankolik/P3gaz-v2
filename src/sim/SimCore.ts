export type StepFn = (dtMs: number) => void;

export type RandomFn = () => number;

export interface SimCoreOptions {
  step: StepFn;
  rng?: RandomFn;
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
}
