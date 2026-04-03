import fetch, { Headers, Request, Response } from 'node-fetch';

// Force a non-undici fetch implementation for constrained shared-hosting environments.
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;

await import('./server.js');
