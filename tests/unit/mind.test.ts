import { decode, encode } from '@msgpack/msgpack'
import { describe, expect, it } from 'vitest'
import { mergeMindFiles } from '../../lib/merge-mind-files'

describe('mergeMindFiles', () => {
  it('merges nearby targets and preserves their manifest mapping', () => {
    const first = encode({ v: 2, dataList: [{ name: 'first' }] })
    const second = encode({ v: 2, dataList: [{ name: 'second' }] })

    const result = mergeMindFiles([
      { locationId: 'place-1', entityId: 'su-anasy', buffer: first },
      { locationId: 'place-2', entityId: 'kereml', buffer: second },
    ])

    expect(result.manifest.targets).toEqual([
      { targetIndex: 0, locationId: 'place-1', entityId: 'su-anasy' },
      { targetIndex: 1, locationId: 'place-2', entityId: 'kereml' },
    ])
    expect(
      (decode(result.mindBuffer) as { dataList: unknown[] }).dataList,
    ).toHaveLength(2)
  })

  it('rejects an empty bundle', () => {
    expect(() => mergeMindFiles([])).toThrow('No .mind files provided')
  })
})
