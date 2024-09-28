import { GitHub } from '@actions/github/lib/utils'
import { Package, Snapshot } from './common'
import * as core from '@actions/core'

// move later
export type PublishSnapshots = (npm_token: string) => Promise<{
  versionPrefix: string
  packages: Package[]
  snapshots: Snapshot[]
}>
export type WriteComment = ({
  octokitSubset,
  snapshots,
  versionPrefix
}: {
  octokitSubset: OctokitSubset
  snapshots: Snapshot[]
  versionPrefix: string
}) => Promise<void>

export interface OctokitSubset {
  listComments: () => Promise<{ data: { body?: string; id: number }[] }>
  createComment: (args: { body: string }) => Promise<{ status: number }>
  updateComment: (args: {
    comment_id: number
    body: string
  }) => Promise<{ status: number }>
}

interface Context {
  repo: {
    owner: string
    repo: string
  }
  issue: {
    number: number
  }
}

export interface ActionContext {
  context: Context
  getOctoKit: (token: string) => InstanceType<typeof GitHub>
}

export class ActionsWrapper {
  constructor(
    private publishSnapshots: PublishSnapshots,
    private writeComment: WriteComment
  ) {}

  private getEnvironmentPrerequisites(env: NodeJS.ProcessEnv): {
    GITHUB_TOKEN: string
    NPM_TOKEN: string
  } {
    if (env.GITHUB_TOKEN === undefined) {
      throw new Error('Please provide the GITHUB_TOKEN to the GitHub action')
    }
    if (env.NPM_TOKEN === undefined) {
      throw new Error('Please provide the NPM_TOKEN to the GitHub action')
    }

    return {
      GITHUB_TOKEN: env.GITHUB_TOKEN,
      NPM_TOKEN: env.NPM_TOKEN
    }
  }

  private makeOctokitSubset(
    octokit: InstanceType<typeof GitHub>,
    issueNumber: number,
    context: Context
  ): OctokitSubset {
    const octokitSubset = {
      listComments: async () =>
        octokit.rest.issues.listComments({
          ...context.repo,
          issue_number: issueNumber,
          per_page: 100
        }),
      createComment: async (args: { body: string }) =>
        octokit.rest.issues.createComment({
          ...context.repo,
          body: args.body,
          issue_number: issueNumber
        }),
      updateComment: async (args: { comment_id: number; body: string }) =>
        octokit.rest.issues.updateComment({
          ...context.repo,
          body: args.body,
          comment_id: args.comment_id
        })
    }

    return octokitSubset
  }

  async run(actionContext: ActionContext): Promise<void> {
    try {
      const { GITHUB_TOKEN, NPM_TOKEN } = this.getEnvironmentPrerequisites(
        process.env
      )

      // If ever adding inputs for the action, might need to inject factories for the publishSnapshots
      // and writeComment functions and use those here, so it could e.g. use a custom intro message for the comment.

      // Maybe set some things as action outputs, skip for now
      const { versionPrefix, snapshots } =
        await this.publishSnapshots(NPM_TOKEN)

      const associatedIssue = actionContext.context.issue
      console.log({ associatedIssue })
      if (associatedIssue.number !== undefined) {
        // upsert comment
        const octokit = actionContext.getOctoKit(GITHUB_TOKEN)
        // const octokit = github.getOctokit(GITHUB_TOKEN);
        const octokitSubset = this.makeOctokitSubset(
          octokit,
          associatedIssue.number,
          actionContext.context
        )
        await this.writeComment({ octokitSubset, snapshots, versionPrefix })
      }
    } catch (error) {
      // Fail the workflow run if an error occurs
      if (error instanceof Error) core.setFailed(error.message)
    }
  }
}
