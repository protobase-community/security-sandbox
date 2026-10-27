import { f, resource } from '@protobase/schema'
import { access } from '../roles'

/** core.integrations: the payment provider's API key, for admins, through the API and MCP only: no screen shows it (level 4 in the README). */
export const integrations = resource('integrations')
  .table('core.integrations')
  .fields({
    id: f.integer().readOnly().filterable().sortable().dbDefault(),
    organization_id: f.relation('organizations').filterable().sortable(),
    provider: f.text(),
    api_key: f.text(),
    created_at: f.timestamp().readOnly().dbDefault(),
    updated_at: f.timestamp().readOnly().dbDefault(),
  })
  .primaryKey((r) => r.id)
  .tenant((r) => r.organization_id)
  .access(access('integrations'))
