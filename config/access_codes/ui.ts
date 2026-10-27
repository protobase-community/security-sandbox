import { view } from '@protobase/schema'
import type { accessCodes } from './data'

export const accessCodesView = view<typeof accessCodes>('access_codes')
  .names({ singular: 'Access code', plural: 'Access codes' })
  .fields((r) => ({
    property_id: r.property_id.label('Property'),
    kind: r.kind.format('badge').valueLabels({ key_safe: 'Key safe', smart_lock: 'Smart lock' }),
    code: r.code.help('Shown one at a time, and every reveal is logged.').format('code'),
  }))
  .list((r) => ({ columns: [r.property_id, r.kind, r.created_at] }))
  .filters((r, w) => [w.facets(r.kind)])
