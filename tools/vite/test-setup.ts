import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import 'reflect-metadata';

// Vitest runs ESM setup files; register React cleanup explicitly.
afterEach(cleanup);
