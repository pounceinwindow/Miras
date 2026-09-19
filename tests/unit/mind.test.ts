import { describe, it, expect } from 'vitest'
import { encode, decode } from '@msgpack/msgpack'
import { mergeMindFiles } from '../../lib/merge-mind-files'

describe('mergeMindFiles (JS algorithm reference)', () => {
  it('merges multiple .mind files and builds correct manifest', () => {
    const file1 = {
      locationId: 'loc-1',
      entityId: 'ent-1',
      buffer: encode({
        v: 2,
        dataList: [
          { targetName: 'shurale-face', features: [1, 2, 3] },
          { targetName: 'shurale-horn', features: [4, 5, 6] },
        ],
      }),
    }

    const file2 = {
      locationId: 'loc-2',
      entityId: 'ent-2',
      buffer: encode({
        v: 2,
        dataList: [{ targetName: 'su-anasy-comb', features: [7, 8, 9] }],
      }),
    }

    const { mindBuffer, manifest } = mergeMindFiles([file1, file2])

    // Verify manifest
    expect(manifest.targets).toHaveLength(3)
    expect(manifest.targets[0]).toEqual({
      targetIndex: 0,
      locationId: 'loc-1',
      entityId: 'ent-1',
    })
    expect(manifest.targets[1]).toEqual({
      targetIndex: 1,
      locationId: 'loc-1',
      entityId: 'ent-1',
    })
    expect(manifest.targets[2]).toEqual({
      targetIndex: 2,
      locationId: 'loc-2',
      entityId: 'ent-2',
    })

    // Verify decoded buffer
    const decoded = decode(mindBuffer) as { v: number; dataList: unknown[] }
    expect(decoded.v).toBe(2)
    expect(decoded.dataList).toHaveLength(3)
    expect(decoded.dataList[0]).toEqual({
      targetName: 'shurale-face',
      features: [1, 2, 3],
    })
    expect(decoded.dataList[1]).toEqual({
      targetName: 'shurale-horn',
      features: [4, 5, 6],
    })
    expect(decoded.dataList[2]).toEqual({
      targetName: 'su-anasy-comb',
      features: [7, 8, 9],
    })
  })

  it('throws error when .mind versions are incompatible', () => {
    const file1 = {
      locationId: 'loc-1',
      entityId: 'ent-1',
      buffer: encode({ v: 2, dataList: [] }),
    }
    const file2 = {
      locationId: 'loc-2',
      entityId: 'ent-2',
      buffer: encode({ v: 3, dataList: [] }),
    }

    expect(() => mergeMindFiles([file1, file2])).toThrow(
      /Incompatible .mind versions/,
    )
  })

  it('throws error when file list is empty', () => {
    expect(() => mergeMindFiles([])).toThrow(/No .mind files provided/)
  })
})
