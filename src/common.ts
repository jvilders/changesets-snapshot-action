export const SNAPSHOT_COMMENT_IDENTIFIER = `<!-- changesetsSnapshotPrCommentKey -->`

export interface Snapshot {
  package: string
  version: string
  timestamp: string
  fullString: string
}

export interface Package {
  packageJson: {
    name: string
    version: string
    private?: boolean
  }
}
