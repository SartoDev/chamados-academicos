import { EventEmitter } from 'node:events';
import { Injectable } from '@nestjs/common';

/** In-process events that let one block react to another without injecting it. */
export interface AppEventMap {
  /** Emitted by Users after a password reset; Auth clears the login attempt counter (BR3.7). */
  'user.password-reset': { email: string };
}

export type AppEventName = keyof AppEventMap;

@Injectable()
export class AppEvents {
  private readonly emitter = new EventEmitter();

  /** Listeners run synchronously; an error thrown by a listener reaches the emitter. */
  emit<E extends AppEventName>(event: E, payload: AppEventMap[E]): void {
    this.emitter.emit(event, payload);
  }

  on<E extends AppEventName>(event: E, listener: (payload: AppEventMap[E]) => void): () => void {
    this.emitter.on(event, listener);
    return () => {
      this.emitter.off(event, listener);
    };
  }
}
