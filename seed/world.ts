import { coSigned, propertyAcquiredAt, propertyShapeAt, tenanciesOf } from './builders/allocation'
import { timestamps } from './calendar'
import { slugify } from './format'
import { orgSpecs } from './data/reference'
import { worldSeed, type Secret } from './sandbox'
import { scales, type ScaleName } from './scales'

// Splits a scale total over the organizations by share; the last one takes the remainder.
const splitTotal = (total: number) => {
  const parts: number[] = []
  for (const [index, spec] of orgSpecs.entries()) {
    parts.push(index === orgSpecs.length - 1 ? total - parts.reduce((sum, part) => sum + part, 0) : Math.round(total * spec.share))
  }
  return parts
}

// Every table's ids are allocated here, so builders can compute foreign keys without lookups. Tables whose rows are
// only ever referenced from inside one step (charges, payments, work orders, inspections, valuations) number their
// rows as the step streams them. Each organization's generator is seeded from the sandbox secret, which the protected
// values come from too (sandbox.ts).
export const buildWorld = (name: ScaleName, secret: Secret) => {
  const scale = scales[name]
  const properties = splitTotal(scale.properties)
  const next = { user: 1, owner: 1, property: 1, unit: 1, lease: 1, tenant: 1, vendor: 1, ticket: 1 }

  const orgs = orgSpecs.map((base, index) => {
    const spec = { ...base, seed: worldSeed(secret, base.slug) }
    const propertyCount = properties[index]!
    const unitStarts = new Uint32Array(propertyCount + 1)
    for (let ordinal = 0; ordinal < propertyCount; ordinal++) unitStarts[ordinal + 1] = unitStarts[ordinal]! + propertyShapeAt(spec.seed, ordinal).units
    const unitCount = unitStarts[propertyCount]!

    // Per unit: its property, and where its leases start in the organization's lease numbering.
    const unitProperty = new Uint32Array(unitCount)
    const leaseStarts = new Uint32Array(unitCount + 1)
    for (let property = 0; property < propertyCount; property++) {
      const acquiredAt = propertyAcquiredAt(spec.seed, property)
      for (let unit = unitStarts[property]!; unit < unitStarts[property + 1]!; unit++) {
        unitProperty[unit] = property
        leaseStarts[unit + 1] = leaseStarts[unit]! + tenanciesOf(spec.seed, unit, acquiredAt).length
      }
    }
    const leaseCount = leaseStarts[unitCount]!

    // Per lease: where its tenants start; a co-signed lease has two.
    const tenantStarts = new Uint32Array(leaseCount + 1)
    for (let lease = 0; lease < leaseCount; lease++) tenantStarts[lease + 1] = tenantStarts[lease]! + (coSigned(spec.seed, lease) ? 2 : 1)

    const users = spec.users.map(([first, initial, role], position) => ({
      id: next.user + position,
      name: `${first} ${initial}`,
      email: `${slugify(first)}@${spec.slug}.example`,
      role,
    }))
    // The contractors of every country the organization lets homes in, each working in its own.
    const vendorLocales = [...new Set(spec.cities.map((city) => city.locale))]
    const vendors = vendorLocales
      .flatMap((locale) => locale.vendors.map(([vendorName, trade, rate]) => ({ name: vendorName, trade, rate, locale })))
      .map((vendor, position) => ({ ...vendor, id: next.vendor + position }))
    const ticketCount = Math.round(unitCount * scale.ticketsPerUnit)
    const org = {
      ...spec,
      users,
      managers: users.filter((user) => user.role === 'manager'),
      maintenanceUsers: users.filter((user) => user.role === 'maintenance'),
      inspectors: users.filter((user) => user.role === 'manager' || user.role === 'maintenance'),
      vendors,
      ownerCount: Math.max(3, Math.round(propertyCount / 6)),
      ownerFirstId: next.owner,
      propertyCount,
      propertyFirstId: next.property,
      unitStarts,
      unitCount,
      unitProperty,
      unitFirstId: next.unit,
      leaseStarts,
      leaseCount,
      leaseFirstId: next.lease,
      tenantStarts,
      tenantFirstId: next.tenant,
      ticketCount,
      ticketFirstId: next.ticket,
      ticketTimes: timestamps(ticketCount, spec.seed + 10),
    }
    next.user += users.length
    next.owner += org.ownerCount
    next.property += propertyCount
    next.unit += unitCount
    next.lease += leaseCount
    next.tenant += tenantStarts[leaseCount]!
    next.vendor += vendors.length
    next.ticket += ticketCount
    return org
  })

  return { name, orgs, secret }
}

export type World = ReturnType<typeof buildWorld>
export type Org = World['orgs'][number]
