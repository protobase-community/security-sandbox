import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { loadProjectAuth } from '@protobase/cli/auth'
import { configExports, createAdmin } from '@protobase/server'
import * as config from './index'
import { roles } from './roles'

// The app's admin API built with Protobase's public API from its own config folder and roles, with the sign-in its
// protobase.config.ts describes, as `dev` and `serve` build it, so a startup check such as an owner field that must
// hold the user ids refuses here instead of on the app's first start. Building the API reaches no database.
const noRequests = () => { throw new Error('No requests in this test') }

describe('the app', () => {
  beforeAll(() => {
    vi.stubEnv('PROTOBASE_SECRET', 'a-secret-only-this-test-uses-0123456789')
    vi.stubEnv('PROTOBASE_URL', 'http://localhost:5173')
    vi.stubEnv('DATABASE_URL', 'postgres://nobody@127.0.0.1:1/none')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  it('passes the startup checks with its own auth', async () => {
    const auth = await loadProjectAuth(process.cwd())
    const { resources, views, pages, userMenu, bottomBars, subscriptions } = configExports(config)
    expect(() =>
      createAdmin({
        resources,
        views,
        pages,
        ...(userMenu && { userMenu }),
        bottomBars,
        subscriptions,
        db: {} as never,
        // With MCP on, the authenticator also verifies the MCP endpoint's tokens (`forAudience`).
        authenticate: Object.assign(noRequests, { forAudience: () => noRequests }),
        auth,
        options: { roles },
      }),
    ).not.toThrow()
  }, 60_000)
})
