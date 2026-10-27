import type { Db } from '../../db/connection'
import { windowEnd } from '../calendar'
import { copyRows } from '../copy'
import { iso, row } from '../format'
import { accessCode, accessCodeKinds, inboxToken, integrationKey, tenantNumber, webhookSecret } from '../sandbox'
import type { World } from '../world'

// The challenge levels' protected values (seed/sandbox.ts), written after the realistic data they sit beside.

const tenantIds = (world: World) =>
  world.orgs.flatMap((org) => Array.from({ length: org.tenantStarts[org.leaseCount]! }, (_, ordinal) => org.tenantFirstId + ordinal))

function* accessCodeRows(world: World) {
  let id = 1
  for (const org of world.orgs) {
    for (let ordinal = 0; ordinal < org.propertyCount; ordinal++) {
      const propertyId = org.propertyFirstId + ordinal
      for (const kind of accessCodeKinds) yield row(id++, org.id, propertyId, kind, accessCode(world.secret, propertyId, kind), iso(windowEnd), iso(windowEnd))
    }
  }
}

export const seedSandbox = async (sql: Db, world: World) => {
  const { secret } = world
  for (const org of world.orgs) await sql`update core.organizations set inbox_token = ${inboxToken(secret, org.id)} where id = ${org.id}`
  const tenants = tenantIds(world)
  await sql`
    update leasing.tenants l set internal_number = t.number
    from unnest(${tenants}::bigint[], ${tenants.map((id) => tenantNumber(secret, id))}::text[]) as t (id, number)
    where l.id = t.id
  `
  await copyRows(sql, 'portfolio.access_codes (id, organization_id, property_id, kind, code, created_at, updated_at)', accessCodeRows(world))
  await copyRows(sql, 'core.integrations (id, organization_id, provider, api_key, created_at, updated_at)', world.orgs.map((org) =>
    row(org.id, org.id, 'payments', integrationKey(secret, org.id), iso(windowEnd), iso(windowEnd))))
  await copyRows(sql, 'core.webhook_secrets (organization_id, provider, secret, created_at)', world.orgs.map((org) =>
    row(org.id, 'payments', webhookSecret(secret, org.id), iso(windowEnd))))
}
