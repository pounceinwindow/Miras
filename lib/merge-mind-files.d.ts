export interface MindTargetManifest {
  targetIndex: number
  locationId: string
  entityId: string
}

export interface MindFileInput {
  locationId: string
  entityId: string
  buffer: Uint8Array | Buffer
}

export interface MergedMindOutput {
  mindBuffer: Uint8Array
  manifest: { targets: MindTargetManifest[] }
}

export function mergeMindFiles(files: MindFileInput[]): MergedMindOutput
