import { createHash } from 'node:crypto'
import { schemas } from '../seed/maintenance'
import { connect } from './connection'

// `db:fingerprint`: a SHA-256 of every row of the app's tables, per table and in total, read-only. Right after the seed
// it is the data's commitment (level 6 in the README); a later run that differs means a row changed. Seeding the same
// secret into an empty database gives the same fingerprint, so a diff of both runs' output names the tables that changed.
// The auth schema (accounts and sessions) is left out: it changes whenever anyone signs in.

const sql = connect({ max: 1 })

const tables = await sql.begin('read only', async (tx) => {
  // Rows as text depend on these settings, so they are fixed: the same rows give the same text on any connection.
  await tx`set local timezone = 'UTC'`
  await tx`set local datestyle = 'ISO, YMD'`
  await tx`set local intervalstyle = 'postgres'`
  await tx`set local extra_float_digits = 1`
  const names = await tx`
    select format('%I.%I', schemaname, tablename) as name from pg_tables where schemaname in ${tx(schemas)} order by 1
  `
  const digests = []
  for (const { name } of names) {
    const [digest] = await tx.unsafe(`
      select count(*)::int as rows,
        encode(sha256(convert_to(coalesce(string_agg(hash, '' order by hash), ''), 'UTF8')), 'hex') as hash
      from (select encode(sha256(convert_to(t::text, 'UTF8')), 'hex') as hash from ${name} t) as hashed
    `)
    digests.push(`${digest!.hash}  ${String(digest!.rows).padStart(9)}  ${name}`)
  }
  return digests
})
await sql.end()

for (const line of tables) console.log(line)
console.log(`${createHash('sha256').update(tables.join('\n')).digest('hex')}  total`)
