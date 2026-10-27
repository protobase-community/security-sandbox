import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { accessCode, commitments, inboxToken, integrationKey, readSecret, tenantNumber, webhookSecret, worldSeed } from './sandbox'

const secret = Buffer.alloc(32, 1)
const other = Buffer.alloc(32, 2)

describe('the sandbox secret', () => {
  it('is read from 64 hex characters, or made when unset', () => {
    expect(readSecret('ab'.repeat(32))).toEqual({ secret: Buffer.alloc(32, 0xab), generated: false })
    expect(() => readSecret('not-hex')).toThrow('64 hex characters')
    const made = readSecret(undefined)
    expect(made.generated).toBe(true)
    expect(made.secret).toHaveLength(32)
    expect(readSecret('').secret.equals(made.secret)).toBe(false)
  })

  it('gives the same values every time, and others for another secret', () => {
    const values = (key: Buffer) => [worldSeed(key, 'kestrel-lane'), inboxToken(key, 1), tenantNumber(key, 1), accessCode(key, 1, 'key_safe'), integrationKey(key, 1), webhookSecret(key, 1)]
    expect(values(secret)).toEqual(values(Buffer.from(secret)))
    const theirs = values(other)
    for (const [index, value] of values(secret).entries()) expect(value).not.toEqual(theirs[index])
  })

  it('gives each record its own value', () => {
    expect(tenantNumber(secret, 1)).not.toBe(tenantNumber(secret, 2))
    expect(accessCode(secret, 1, 'key_safe')).not.toBe(accessCode(secret, 1, 'smart_lock'))
  })

  it('writes the protected values in their formats', () => {
    expect(inboxToken(secret, 1)).toMatch(/^[0-9A-HJKMNP-TV-Z]{5}(-[0-9A-HJKMNP-TV-Z]{5}){5}$/)
    expect(tenantNumber(secret, 1)).toMatch(/^[0-9A-Z]{5}(-[0-9A-Z]{5}){5}$/)
    expect(accessCode(secret, 1, 'key_safe')).toMatch(/^[0-9A-Z]{4}(-[0-9A-Z]{4}){6}$/)
    expect(integrationKey(secret, 1)).toMatch(/^sk_live_[0-9A-Z]{32}$/)
    expect(webhookSecret(secret, 1)).toMatch(/^whsec_[0-9A-Z]{32}$/)
  })

  it('commits to each level with the SHA-256 of its canary', () => {
    const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')
    expect(commitments(secret).map(([level]) => level)).toEqual(['1', '2', '3', '4', '5', '7'])
    expect(commitments(secret)).toContainEqual(['2', 'internal number of tenant 1', sha256(tenantNumber(secret, 1))])
    expect(commitments(secret)).toContainEqual(['7', 'the secret', sha256('01'.repeat(32))])
  })
})
