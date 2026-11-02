/**
 * BREAKING NEWS WALA — Test Suite In-Memory Server Helper
 * Allows in-process testing of the Express app using native fetch without external dependencies.
 */

import { Application } from 'express';
import { AddressInfo } from 'net';
import { Server } from 'http';

export interface TestClient {
  server: Server;
  baseUrl: string;
  close: () => Promise<void>;
  get: (path: string, headers?: Record<string, string>) => Promise<Response>;
  post: (path: string, body?: any, headers?: Record<string, string>) => Promise<Response>;
  put: (path: string, body?: any, headers?: Record<string, string>) => Promise<Response>;
  patch: (path: string, body?: any, headers?: Record<string, string>) => Promise<Response>;
  delete: (path: string, headers?: Record<string, string>) => Promise<Response>;
}

export async function createTestClient(app: Application): Promise<TestClient> {
  const server = app.listen(0, '127.0.0.1');

  await new Promise<void>((resolve) => {
    server.on('listening', () => resolve());
  });

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    server,
    baseUrl,
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
    get: async (path: string, headers: Record<string, string> = {}) => {
      return fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers,
      });
    },
    post: async (path: string, body?: any, headers: Record<string, string> = {}) => {
      return fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    },
    put: async (path: string, body?: any, headers: Record<string, string> = {}) => {
      return fetch(`${baseUrl}${path}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    },
    patch: async (path: string, body?: any, headers: Record<string, string> = {}) => {
      return fetch(`${baseUrl}${path}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    },
    delete: async (path: string, headers: Record<string, string> = {}) => {
      return fetch(`${baseUrl}${path}`, {
        method: 'DELETE',
        headers,
      });
    },
  };
}

