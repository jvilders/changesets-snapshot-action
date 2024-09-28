import { OctokitSubset } from './actions-wrapper'
import { Snapshot, SNAPSHOT_COMMENT_IDENTIFIER } from './common'

export function formatTable(packages: Snapshot[]): string {
  const header = `| Package | Version |\n|------|---------|`
  const rows = packages.map(p => `| \`${p.package}\` | \`${p.version}\` |`)

  const table = [header, ...rows].join('\n')

  return table
}

export function makeComment({
  snapshots,
  versionPrefix
}: {
  snapshots: Snapshot[]
  versionPrefix: string
}): `${typeof SNAPSHOT_COMMENT_IDENTIFIER}${string}` {
  if (snapshots.length === 0) {
    return `${SNAPSHOT_COMMENT_IDENTIFIER}\nSnapshot release action ran, but there were no snapshots to release`
  }

  const header = `### 🚀 Snapshot Release (\`${versionPrefix}\`)`
  const multiple = snapshots.length > 1
  const introMessage = `**Your snapshot${multiple ? 's have' : ' has'} been published**:`
  const tableElement = formatTable(snapshots)

  const body = [header, introMessage, tableElement].join('\n')

  return `${SNAPSHOT_COMMENT_IDENTIFIER}\n${body}`
}

export class CommentWriter {
  constructor(
    private makeComment: ({
      snapshots,
      versionPrefix
    }: {
      snapshots: Snapshot[]
      versionPrefix: string
    }) => `${typeof SNAPSHOT_COMMENT_IDENTIFIER}${string}`
  ) {}

  async writeComment({
    octokitSubset,
    snapshots,
    versionPrefix
  }: {
    octokitSubset: OctokitSubset
    snapshots: Snapshot[]
    versionPrefix: string
  }): Promise<void> {
    const commentBody = this.makeComment({ snapshots, versionPrefix })

    const comments = await octokitSubset.listComments()

    const existingComment = comments.data.find(v =>
      v.body?.startsWith(SNAPSHOT_COMMENT_IDENTIFIER)
    )

    if (existingComment) {
      console.log('Found an existing comment, updating...')
      const response = await octokitSubset.updateComment({
        comment_id: existingComment.id,
        body: commentBody
      })
      console.log(`GitHub API response: ${response.status}`)
    } else {
      console.log(`No existing comment found, creating...`)
      const response = await octokitSubset.createComment({ body: commentBody })
      console.log(`GitHub API response: ${response.status}`)
    }
  }
}
