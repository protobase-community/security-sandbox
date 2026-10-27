import { f, resource } from '@protobase/schema'
import { access, roles } from '../roles'

/**
 * leasing.tenants. Income and IBAN are screening data: only roles holding `screening.read` see them, and the IBAN only
 * when revealed. So is the internal number, which no screen shows: only the API and MCP give it (level 2 in the README).
 */
export const tenants = resource('tenants')
  .table('leasing.tenants')
  .fields({
    id: f.bigint().readOnly().filterable().sortable().dbDefault(),
    organization_id: f.relation('organizations').filterable().sortable(),
    first_name: f.text(),
    last_name: f.text().filterable().sortable(),
    email: f.text(),
    phone: f.text().optional(),
    date_of_birth: f.date(),
    iban: f.text().optional().regex(/^[A-Z]{2}\d{2}(?: ?[A-Z0-9]){11,30}$/, 'An IBAN, with or without spaces, such as GB29 NWBK 6016 1331 9268 19').sensitive().access({ read: roles.can('screening.read') }),
    monthly_income: f.decimal({ precision: 10, scale: 2 }).access({ read: roles.can('screening.read') }),
    income_currency: f.currency().access({ read: roles.can('screening.read') }),
    internal_number: f.text().optional().readOnly().access({ read: roles.can('screening.read') }),
    created_at: f.timestamp().readOnly().filterable().sortable().dbDefault(),
    updated_at: f.timestamp().readOnly().dbDefault(),
  })
  .primaryKey((r) => r.id)
  .tenant((r) => r.organization_id)
  .search((r) => [r.first_name, r.last_name, r.email, r.phone.digitsEnd()])
  .access(access('tenants'))
