import { OctokitSubset } from '../src/actions-wrapper'
import { makeComment, CommentWriter } from '../src/comment'
import { Snapshot, SNAPSHOT_COMMENT_IDENTIFIER } from '../src/common'

function makeSnapshot({
  packageName = 'test-package',
  version = '1.0.0-alpha-1234567890',
  timestamp = '1234567890',
  fullString = 'test-package@1.0.0-alpha-1234567890'
}: {
  packageName?: string
  version?: string
  timestamp?: string
  fullString?: string
}): Snapshot {
  return {
    package: packageName,
    version,
    timestamp,
    fullString
  }
}

describe('makeComment', () => {
  it('should return a short comment if no snapshots are published', () => {
    const snapshots: Snapshot[] = []
    const comment = makeComment({
      snapshots,
      versionPrefix: 'test'
    })

    expect(comment).toBe(
      `${SNAPSHOT_COMMENT_IDENTIFIER}\nSnapshot release action ran, but there were no snapshots to release`
    )
  })

  it('should present published snapshot in a table', () => {
    const snapshots: Snapshot[] = [makeSnapshot({})]
    const comment = makeComment({
      snapshots,
      versionPrefix: 'test'
    })

    expect(comment)
      .toBe(`<!-- changesetsSnapshotPrCommentKey -->### 🚀 Snapshot Release (\`test\`)
Your snapshot has been published.**
| Package | Version |
|------|---------|
| \`test-package\` | \`1.0.0-alpha-1234567890\` |`)
  })

  it('should present published snapshots in a table', () => {
    const snapshots: Snapshot[] = [makeSnapshot({}), makeSnapshot({})]
    const comment = makeComment({
      snapshots,
      versionPrefix: 'test'
    })

    expect(comment)
      .toBe(`<!-- changesetsSnapshotPrCommentKey -->### 🚀 Snapshot Release (\`test\`)
Your snapshots have been published.**
| Package | Version |
|------|---------|
| \`test-package\` | \`1.0.0-alpha-1234567890\` |
| \`test-package\` | \`1.0.0-alpha-1234567890\` |`)
  })
})

describe('CommentWriter', () => {
  it('should create a comment if no existing comment is found', async () => {
    const commentWriter = new CommentWriter(
      () => `${SNAPSHOT_COMMENT_IDENTIFIER}test`
    )

    const listCommentsMock = jest.fn(async () => ({ data: [] }))
    const createCommentMock = jest.fn(async () => ({ status: 1 }))
    const updateCommentMock = jest.fn(async () => ({ status: 1 }))

    const octokitSubset: OctokitSubset = {
      listComments: listCommentsMock,
      createComment: createCommentMock,
      updateComment: updateCommentMock
    }

    await commentWriter.writeComment({
      octokitSubset,
      snapshots: [],
      versionPrefix: ''
    })

    expect(listCommentsMock).toHaveBeenCalled()
    expect(createCommentMock).toHaveBeenCalled()
    expect(updateCommentMock).not.toHaveBeenCalled()
  })

  it('should update a comment if an existing comment is found', async () => {
    const commentWriter = new CommentWriter(
      () => `${SNAPSHOT_COMMENT_IDENTIFIER}test`
    )

    const listCommentsMock = jest.fn(async () => ({
      data: [
        {
          body: SNAPSHOT_COMMENT_IDENTIFIER,
          id: 1
        }
      ]
    }))
    const createCommentMock = jest.fn(async () => ({ status: 1 }))
    const updateCommentMock = jest.fn(async () => ({ status: 1 }))

    const octokitSubset: OctokitSubset = {
      listComments: listCommentsMock,
      createComment: createCommentMock,
      updateComment: updateCommentMock
    }

    await commentWriter.writeComment({
      octokitSubset,
      snapshots: [],
      versionPrefix: ''
    })

    expect(listCommentsMock).toHaveBeenCalled()
    expect(createCommentMock).not.toHaveBeenCalled()
    expect(updateCommentMock).toHaveBeenCalled()
  })
})
