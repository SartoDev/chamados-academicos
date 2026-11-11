import { describe, expect, it } from '@jest/globals';
import { isCrossOriginStateChange, isStateChangingMethod } from './origin-check.js';

const APP_ORIGIN = 'http://localhost:8080';

describe('origin check (BR2.6)', () => {
  it.each(['POST', 'put', 'Patch', 'DELETE'])('treats %s as state-changing', (method) => {
    expect(isStateChangingMethod(method)).toBe(true);
  });

  it.each(['GET', 'HEAD', 'OPTIONS'])('does not treat %s as state-changing', (method) => {
    expect(isStateChangingMethod(method)).toBe(false);
  });

  it('refuses a state-changing request from another origin', () => {
    expect(isCrossOriginStateChange('POST', 'https://evil.example', APP_ORIGIN)).toBe(true);
    expect(isCrossOriginStateChange('PATCH', 'null', APP_ORIGIN)).toBe(true);
  });

  it('accepts a state-changing request from the system origin', () => {
    expect(isCrossOriginStateChange('DELETE', APP_ORIGIN, APP_ORIGIN)).toBe(false);
  });

  it('accepts a request without an Origin header', () => {
    expect(isCrossOriginStateChange('POST', undefined, APP_ORIGIN)).toBe(false);
    expect(isCrossOriginStateChange('POST', '', APP_ORIGIN)).toBe(false);
  });

  it('never refuses a read because of its origin', () => {
    expect(isCrossOriginStateChange('GET', 'https://evil.example', APP_ORIGIN)).toBe(false);
  });
});
