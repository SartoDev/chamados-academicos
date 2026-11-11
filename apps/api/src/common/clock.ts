/**
 * Time source used as an injection token, so time-dependent rules (login attempt window,
 * token validity) are testable with a controlled clock instead of waiting for real time.
 */
export abstract class Clock {
  abstract now(): Date;
}

export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}
