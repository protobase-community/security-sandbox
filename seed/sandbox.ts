import { createHash, createHmac, randomBytes } from 'node:crypto'

// The sandbox secret: 32 random bytes, kept offline by the operator and never on the server. Everything the seed writes
// comes from it, so the same secret rebuilds the same data, and the data cannot be rebuilt without it.
//
// - The realistic data (names, homes, rent, tickets) comes from the seed's own generator (rng.ts), seeded per
//   organization with 32 bits of HMAC-SHA256(secret, "world:<slug>"). That generator is not cryptographic, and 32 bits
//   can be searched, so this data is not protected: working out its seed reveals nothing about the secret.
// - The protected values, one kind per challenge level, are each HMAC-SHA256(secret, label) itself, 140 bits or more:
//   without the secret nobody can compute one, from the source or from any other data.

export type Secret = Buffer

const hexSecret = /^[0-9a-f]{64}$/i

/** The secret in `SANDBOX_SECRET` (64 hex characters), or a new one from the CSPRNG when it is unset. */
export const readSecret = (value: string | undefined) => {
  if (value === undefined || value === '') return { secret: randomBytes(32), generated: true }
  if (!hexSecret.test(value)) throw new Error('SANDBOX_SECRET must be 64 hex characters (openssl rand -hex 32)')
  return { secret: Buffer.from(value, 'hex'), generated: false }
}

const derive = (secret: Secret, label: string) => createHmac('sha256', secret).update(label).digest()

/** The 32-bit seed of an organization's realistic data. */
export const worldSeed = (secret: Secret, slug: string) => derive(secret, `world:${slug}`).readUInt32BE(0)

// Crockford's base32: 32 letters and digits, so each byte's low 5 bits pick one without bias.
const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** `groups` groups of `size` base32 characters, 5 bits each, joined by dashes; at most 32 characters. */
const token = (secret: Secret, label: string, groups: number, size: number) => {
  const characters = [...derive(secret, label)].slice(0, groups * size).map((byte) => alphabet[byte & 31])
  return Array.from({ length: groups }, (_, group) => characters.slice(group * size, (group + 1) * size).join('')).join('-')
}

/** Level 1: an organization's invoice inbox token, a column of a public table that the data config leaves out. 150 bits. */
export const inboxToken = (secret: Secret, organizationId: number) => token(secret, `inbox-token:${organizationId}`, 6, 5)

/** Level 2: a tenant's internal customer number, in the data config but on no screen. 150 bits. */
export const tenantNumber = (secret: Secret, tenantId: number) => token(secret, `tenant-number:${tenantId}`, 6, 5)

export const accessCodeKinds = ['key_safe', 'smart_lock'] as const

/** Level 3: the code of a property's key safe or smart lock, revealed on request. 140 bits. */
export const accessCode = (secret: Secret, propertyId: number, kind: (typeof accessCodeKinds)[number]) =>
  token(secret, `access-code:${propertyId}:${kind}`, 7, 4)

/** Level 4: an organization's payment provider API key, a resource with no screen. 160 bits. */
export const integrationKey = (secret: Secret, organizationId: number) => `sk_live_${token(secret, `integration-key:${organizationId}`, 1, 32)}`

/** Level 5: an organization's webhook signing secret, in a table no resource reads. 160 bits. */
export const webhookSecret = (secret: Secret, organizationId: number) => `whsec_${token(secret, `webhook-secret:${organizationId}`, 1, 32)}`

const sha256 = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex')

/**
 * What the README publishes per level: the SHA-256 of one protected value, its canary, and of the secret (as hex). A
 * finder proves a read by sending a value whose SHA-256 is listed; the hashes give nothing away.
 */
export const commitments = (secret: Secret) => [
  ['1', 'inbox token of organization 1', sha256(inboxToken(secret, 1))],
  ['2', 'internal number of tenant 1', sha256(tenantNumber(secret, 1))],
  ['3', 'key safe code of property 1', sha256(accessCode(secret, 1, 'key_safe'))],
  ['4', 'API key of organization 1', sha256(integrationKey(secret, 1))],
  ['5', 'webhook secret of organization 1', sha256(webhookSecret(secret, 1))],
  ['7', 'the secret', sha256(secret.toString('hex'))],
] as const
