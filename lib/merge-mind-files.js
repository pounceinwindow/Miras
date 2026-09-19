import { decode, encode } from '@msgpack/msgpack'

/**
 * Combines the targets stored in several MindAR files and keeps a manifest
 * that maps every target index back to its location and guardian.
 *
 * @param {Array<{ locationId: string, entityId: string, buffer: Uint8Array|Buffer }>} files
 * @returns {{ mindBuffer: Uint8Array, manifest: { targets: Array<{ targetIndex: number, locationId: string, entityId: string }> } }}
 */
export function mergeMindFiles(files) {
  if (!files || files.length === 0) {
    throw new Error('No .mind files provided to merge.')
  }

  const allTargets = []
  const manifestTargets = []
  let commonVersion = null

  for (const file of files) {
    const decoded = decode(file.buffer)
    if (decoded.v === undefined || decoded.v === null) {
      throw new Error(
        `Missing version 'v' in .mind file for location ${file.locationId}`,
      )
    }
    if (commonVersion === null) {
      commonVersion = decoded.v
    } else if (commonVersion !== decoded.v) {
      throw new Error(
        `Incompatible .mind versions: expected v=${commonVersion}, got v=${decoded.v} for location ${file.locationId}`,
      )
    }
    if (!Array.isArray(decoded.dataList)) {
      throw new Error(
        `Missing or invalid 'dataList' in .mind file for location ${file.locationId}`,
      )
    }
    for (const target of decoded.dataList) {
      const targetIndex = allTargets.length
      allTargets.push(target)
      manifestTargets.push({
        targetIndex,
        locationId: String(file.locationId),
        entityId: String(file.entityId),
      })
    }
  }

  return {
    mindBuffer: encode({ v: commonVersion, dataList: allTargets }),
    manifest: { targets: manifestTargets },
  }
}
