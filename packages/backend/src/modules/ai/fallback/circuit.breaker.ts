/**
 * BREAKING NEWS WALA — AI Circuit Breaker
 * Grounded in docs/19-API-Pool.md and DEC-051
 * Automatic failover and circuit breaker strategy for AI inference
 */

import { ProviderId, AI_CONFIG_DEFAULTS } from '../constants';
import { CircuitBreakerState } from '../types';

export class CircuitBreakerRegistry {
  private states: Map<ProviderId, CircuitBreakerState> = new Map();
  private failureThreshold: number = AI_CONFIG_DEFAULTS.CIRCUIT_BREAKER_FAILURE_THRESHOLD;
  private resetTimeoutMs: number = AI_CONFIG_DEFAULTS.CIRCUIT_BREAKER_RESET_TIMEOUT_MS;

  constructor(threshold?: number, resetTimeoutMs?: number) {
    if (threshold) this.failureThreshold = threshold;
    if (resetTimeoutMs) this.resetTimeoutMs = resetTimeoutMs;
  }

  public getState(providerId: ProviderId): CircuitBreakerState {
    let state = this.states.get(providerId);
    if (!state) {
      state = {
        providerId,
        state: 'CLOSED',
        failureCount: 0,
      };
      this.states.set(providerId, state);
    }

    // Check if OPEN state has expired and should transition to HALF_OPEN
    if (state.state === 'OPEN' && state.nextAttemptTime && Date.now() >= state.nextAttemptTime) {
      state.state = 'HALF_OPEN';
    }

    return state;
  }

  public canExecute(providerId: ProviderId): boolean {
    const state = this.getState(providerId);
    if (state.state === 'CLOSED') return true;
    if (state.state === 'HALF_OPEN') return true; // Allows 1 probe request
    return false;
  }

  public recordSuccess(providerId: ProviderId): void {
    const state = this.getState(providerId);
    state.state = 'CLOSED';
    state.failureCount = 0;
    state.lastFailureTime = undefined;
    state.nextAttemptTime = undefined;
  }

  public recordFailure(providerId: ProviderId): void {
    const state = this.getState(providerId);
    state.failureCount += 1;
    state.lastFailureTime = Date.now();

    if (state.failureCount >= this.failureThreshold) {
      state.state = 'OPEN';
      state.nextAttemptTime = Date.now() + this.resetTimeoutMs;
    }
  }

  public reset(providerId: ProviderId): void {
    const state = this.getState(providerId);
    state.state = 'CLOSED';
    state.failureCount = 0;
    state.lastFailureTime = undefined;
    state.nextAttemptTime = undefined;
  }

  public getAllStates(): CircuitBreakerState[] {
    return Array.from(this.states.values());
  }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry();

