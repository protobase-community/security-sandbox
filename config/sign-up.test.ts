import { describe, expect, it } from 'vitest'
import config from '../protobase.config'

// The sandbox has no accounts for strangers: Protobase offers sign-up only with `auth.signUp`, and makes accounts for
// people who sign in through a provider in `socialProviders`.
describe('sign-up', () => {
  it('is closed', () => {
    expect(config.auth).toBeTruthy()
    expect(config.auth).not.toHaveProperty('signUp')
    expect(config.auth).not.toHaveProperty('socialProviders')
  })
})
