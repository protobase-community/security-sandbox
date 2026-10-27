import { defineConfig } from '@protobase/config'

// The whole app, as one object. Its code is found by its path: resources in config/, roles in config/roles.ts and the
// auth hooks in auth/hooks.ts. Its address and secret are Protobase's defaults, PROTOBASE_URL and PROTOBASE_SECRET (see
// .env.example).
export default defineConfig({
  auth: {
    // No defaultRole on purpose: every account is created with an explicit role (`protobase users create --role`).
    roles: ['admin', 'manager', 'finance', 'maintenance'],
    // A security sandbox: no `signUp` and no `socialProviders`, so nobody can make an account (README).
    // MCP clients sign in as a user and reach the resources that user's role reads.
    mcp: true,
  },
  // Organizations are not used yet: everyone works in organization 1.
  authenticate: { tenant: 1 },
})
