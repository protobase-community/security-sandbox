import { describe, expect, it } from 'vitest'
import { owners, properties, tenants, vendors } from '../config'
import { ownerAt, propertyAt } from './builders/property'
import { ledgerOf } from './builders/ledger'
import { tenantsOf } from './builders/tenancy'
import { currencies } from './data/currencies'
import { slugify } from './format'
import { validIban } from './iban'
import { leasesOf } from './steps/leasing'
import { buildWorld } from './world'

type Checked = { recordSchema(): unknown }

// The issues a create would find with these fields of a record, as `field: value`.
const refused = (resource: Checked, record: Record<string, unknown>) => {
  const shape = (resource.recordSchema() as { shape: Record<string, { safeParse(value: unknown): { success: boolean } }> }).shape
  return Object.entries(record).filter(([field, value]) => !shape[field]!.safeParse(value).success).map(([field, value]) => `${field}: ${String(value)}`)
}

const world = buildWorld('small', Buffer.alloc(32, 7))
const all = world.orgs.map((org) => {
  const leases = [...leasesOf(org)]
  return {
    org,
    owners: Array.from({ length: org.ownerCount }, (_, ordinal) => ownerAt(org, ordinal)),
    properties: Array.from({ length: org.propertyCount }, (_, ordinal) => propertyAt(org, ordinal)),
    leases,
    tenants: leases.flatMap((lease) => tenantsOf(org, lease)),
  }
})

describe('the sample data across the world', () => {
  it('passes the checks a create makes on every owner, property, tenant and vendor', () => {
    const problems = all.flatMap(({ org, owners: seeded, properties: homes, tenants: people }) => [
      ...seeded.flatMap((o) => refused(owners, { name: o.name, email: o.email, phone: o.phone, iban: o.iban })),
      ...homes.flatMap((p) => refused(properties, { name: p.name, street: p.street, house_number: p.houseNumber, postal_code: p.postalCode, city: p.city.name, country: p.city.locale.country, currency: p.city.locale.currency })),
      ...people.flatMap((t) => refused(tenants, { first_name: t.firstName, last_name: t.lastName, email: t.email, phone: t.phone, iban: t.iban })),
      ...org.vendors.flatMap((v) => refused(vendors, { name: v.name, currency: v.locale.currency })),
    ])
    expect(problems).toEqual([])
  })

  it('gives every IBAN valid check digits, and none where the country has no IBANs', () => {
    const accounts = all.flatMap(({ owners: seeded, tenants: people }) => [...seeded, ...people].map((record) => record.iban))
    expect(accounts.filter((iban) => iban !== null && !validIban(iban))).toEqual([])
    expect(accounts.some((iban) => iban === null)).toBe(true)
  })

  it.each([
    ['Latin letters with diacritics', /[À-ɏ]/u], ['Cyrillic', /\p{Script=Cyrillic}/u], ['Greek', /\p{Script=Greek}/u],
    ['Arabic', /\p{Script=Arabic}/u], ['Hebrew', /\p{Script=Hebrew}/u], ['Han', /\p{Script=Han}/u], ['Hangul', /\p{Script=Hangul}/u],
    ['Devanagari', /\p{Script=Devanagari}/u], ['Thai', /\p{Script=Thai}/u],
  ])('writes names and addresses in %s in the organization everyone works in', (_, script) => {
    const { owners: seeded, properties: homes, tenants: people } = all[0]!
    const texts = [...seeded.map((o) => o.name), ...homes.flatMap((p) => [p.name, p.street, p.city.name]), ...people.flatMap((t) => [t.firstName, t.lastName])]
    expect(texts.some((text) => script.test(text))).toBe(true)
  })

  it('lets homes in many countries and currencies, some without a postal code', () => {
    const homes = all.flatMap((entry) => entry.properties)
    expect(new Set(homes.map((p) => p.city.locale.country)).size).toBeGreaterThanOrEqual(15)
    expect(new Set(homes.map((p) => p.city.locale.currency)).size).toBeGreaterThanOrEqual(10)
    expect(homes.some((p) => p.postalCode === null)).toBe(true)
  })

  it('charges whole yen and won, and amounts that fit the money columns', () => {
    for (const { org, leases } of all) {
      for (const lease of leases) {
        const charges = ledgerOf(org, lease)
        const amounts = [lease.rentCents, ...charges.flatMap((charge) => [charge.amountCents, ...charge.payments.map((payment) => payment.amountCents)])]
        if (!currencies[lease.currency].cents) expect(amounts.filter((amount) => amount % 100 !== 0)).toEqual([])
        // numeric(10, 2)
        expect(Math.max(...amounts, ...tenantsOf(org, lease).map((t) => t.incomeCents))).toBeLessThan(1e10)
      }
    }
  })

  it('writes e-mail addresses only on the domains set aside for examples', () => {
    const emails = all.flatMap(({ owners: seeded, tenants: people }) => [...seeded, ...people].map((record) => record.email))
    expect(emails.filter((email) => !/^[a-z0-9.-]+@(example\.(com|net|org)|[a-z0-9-]+\.example)$/.test(email))).toEqual([])
  })
})

describe('slugify', () => {
  it.each([['Müller', 'muller'], ['Weißenbörn', 'weissenborn'], ['Łukasz', 'lukasz'], ['Đặng', 'dang'], ['İpek Yıldız', 'ipek-yildiz'], ['Søren', 'soren'], ['田中', '']])(
    'makes %s %s',
    (name, slug) => {
      expect(slugify(name)).toBe(slug)
    },
  )
})
