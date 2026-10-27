import { f, resource } from '@protobase/schema'
import { access } from '../roles'

/**
 * core.organizations. Unique: (slug). Anyone, signed in or not, reads their names and cities; the invoice inbox token
 * next to them in the table is not a field here (level 1 in the README).
 */
export const organizations = resource('organizations')
  .table('core.organizations')
  .fields({
    id: f.integer().readOnly().filterable().sortable().dbDefault(),
    name: f.text(),
    slug: f.text().filterable().sortable(),
    city: f.text(),
    kvk_number: f.text(),
    created_at: f.timestamp().readOnly().dbDefault(),
    updated_at: f.timestamp().readOnly().dbDefault(),
  })
  .primaryKey((r) => r.id)
  .access(access('organizations'))
