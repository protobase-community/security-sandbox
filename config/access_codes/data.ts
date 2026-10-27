import { f, resource } from '@protobase/schema'
import { access } from '../roles'

/** portfolio.access_codes: the codes of a property's key safe and smart lock, revealed one at a time (level 3 in the README). */
export const accessCodes = resource('access_codes')
  .table('portfolio.access_codes')
  .fields({
    id: f.bigint().readOnly().filterable().sortable().dbDefault(),
    organization_id: f.relation('organizations').filterable().sortable(),
    property_id: f.relation('properties').filterable().sortable(),
    kind: f.enum(['key_safe', 'smart_lock']).filterable().sortable(),
    code: f.text().sensitive(),
    created_at: f.timestamp().readOnly().filterable().sortable().dbDefault(),
    updated_at: f.timestamp().readOnly().dbDefault(),
  })
  .primaryKey((r) => r.id)
  .tenant((r) => r.organization_id)
  .access(access('access_codes'))
