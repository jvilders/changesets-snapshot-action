import {
  ActionsWrapper,
  PublishSnapshots,
  WriteComment,
  ActionContext,
  OctokitSubset
} from '../src/actions-wrapper'

import * as core from '@actions/core'

function makeActionsContext(hasAssociatedIssue = true): {
  actionsContext: ActionContext
  restMocks: { list: jest.Mock; create: jest.Mock; update: jest.Mock }
} {
  const listCommentsMock = jest.fn()
  const createCommentMock = jest.fn()
  const updateCommentMock = jest.fn()

  return {
    actionsContext: {
      context: {
        repo: {
          owner: '',
          repo: ''
        },
        issue: {
          owner: '',
          repo: '',
          // @ts-expect-error for testing
          number: hasAssociatedIssue || undefined
        }
      },
      getOctoKit: () => ({
        rest: {
          issues: {
            // @ts-expect-error These are callable objects with other properties I don't use
            listComments: listCommentsMock,
            // @ts-expect-error These are callable objects with other properties I don't use
            createComment: createCommentMock,
            // @ts-expect-error These are callable objects with other properties I don't use
            updateComment: updateCommentMock
          }
        }
      })
    },
    restMocks: {
      list: listCommentsMock,
      create: createCommentMock,
      update: updateCommentMock
    }
  }
}

let setFailedMock: jest.SpiedFunction<typeof core.setFailed>

describe('ActionsWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()

    process.env = {
      GITHUB_TOKEN: 'some',
      NPM_TOKEN: 'value'
    }
  })

  describe('input validation', () => {
    it('should fail if GITHUB_TOKEN is not provided in the environment', async () => {
      const publishSnapshots: PublishSnapshots = jest.fn(async () => ({
        versionPrefix: 'alpha',
        packages: [],
        snapshots: []
      }))
      const writeComment: WriteComment = jest.fn()

      const actionsWrapper = new ActionsWrapper(publishSnapshots, writeComment)

      delete process.env.GITHUB_TOKEN

      const { actionsContext } = makeActionsContext()
      await actionsWrapper.run(actionsContext)

      expect(setFailedMock).toHaveBeenCalledWith(
        'Please provide the GITHUB_TOKEN to the GitHub action'
      )
    })

    it('should fail if NPM_TOKEN is not provided in the environment', async () => {
      const publishSnapshots: PublishSnapshots = jest.fn(async () => ({
        versionPrefix: 'alpha',
        packages: [],
        snapshots: []
      }))
      const writeComment: WriteComment = jest.fn()

      const actionsWrapper = new ActionsWrapper(publishSnapshots, writeComment)

      delete process.env.NPM_TOKEN
      const { actionsContext } = makeActionsContext()
      await actionsWrapper.run(actionsContext)

      expect(setFailedMock).toHaveBeenCalledWith(
        'Please provide the NPM_TOKEN to the GitHub action'
      )
    })
  })

  it('should publish, but not write comment if no associated issue was found', async () => {
    const publishSnapshots: PublishSnapshots = jest.fn(async () => ({
      versionPrefix: 'alpha',
      packages: [],
      snapshots: []
    }))
    const writeComment: WriteComment = jest.fn()

    const actionsWrapper = new ActionsWrapper(publishSnapshots, writeComment)

    const { actionsContext } = makeActionsContext(false)
    await actionsWrapper.run(actionsContext)

    expect(setFailedMock).not.toHaveBeenCalled()
    expect(publishSnapshots).toHaveBeenCalled()
    expect(writeComment).not.toHaveBeenCalled()
  })

  it('should publish and write comment if associated issue was found', async () => {
    const publishSnapshots: PublishSnapshots = jest.fn(async () => ({
      versionPrefix: 'alpha',
      packages: [],
      snapshots: []
    }))
    const writeComment: WriteComment = jest.fn()

    const actionsWrapper = new ActionsWrapper(publishSnapshots, writeComment)

    const { actionsContext } = makeActionsContext()
    await actionsWrapper.run(actionsContext)

    expect(setFailedMock).not.toHaveBeenCalled()
    expect(publishSnapshots).toHaveBeenCalled()
    expect(writeComment).toHaveBeenCalled()
  })

  it('check created subset functions', async () => {
    const publishSnapshots: PublishSnapshots = jest.fn(async () => ({
      versionPrefix: 'alpha',
      packages: [],
      snapshots: []
    }))
    const writeCommentMock = jest.fn()
    const writeComment: WriteComment = writeCommentMock

    const actionsWrapper = new ActionsWrapper(publishSnapshots, writeComment)

    const { actionsContext, restMocks } = makeActionsContext()
    await actionsWrapper.run(actionsContext)

    const octokitSubset: OctokitSubset =
      writeCommentMock.mock.calls[0][0]['octokitSubset']

    await octokitSubset.listComments()
    expect(restMocks.list).toHaveBeenCalledWith({
      ...actionsContext.context.repo,
      issue_number: actionsContext.context.issue.number,
      per_page: 100
    })

    await octokitSubset.createComment({ body: 'testBody' })
    expect(restMocks.create).toHaveBeenCalledWith({
      ...actionsContext.context.repo,
      body: 'testBody',
      issue_number: actionsContext.context.issue.number
    })

    await octokitSubset.updateComment({ comment_id: 1, body: 'testBody' })
    expect(restMocks.update).toHaveBeenCalledWith({
      ...actionsContext.context.repo,
      body: 'testBody',
      comment_id: 1
    })
  })
})
