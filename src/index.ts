import path from 'path'
import { CommentWriter, makeComment } from './comment'
import { SnapshotPublisher } from './publisher'
import {
  getPackages as manyPkgGetPackages,
  Package
} from '@manypkg/get-packages'
import { exec } from '@actions/exec'
import { ActionsWrapper } from './actions-wrapper'
import * as github from '@actions/github'

const commentWriter = new CommentWriter(makeComment)
const writeComment = commentWriter.writeComment.bind(commentWriter)

const snapshotPublisher = new SnapshotPublisher(async () => {
  const changesetBinary = path.join('node_modules/.bin/changeset')
  const versionPackages = async (snapshotPrefix: string): Promise<void> => {
    await exec(changesetBinary, ['version', '--snapshot', snapshotPrefix])
  }
  const getPackages = async (cwd: string): Promise<Package[]> =>
    (await manyPkgGetPackages(cwd)).packages
  const setPublishCredentials = async (npm_token: string): Promise<void> => {
    // This works for npm and pnpm, but modern yarn (possibly others) won't read
    // .npmrc files
    await exec(
      'bash',
      [
        '-c',
        `echo "//registry.npmjs.org/:_authToken=${npm_token}" > "$HOME/.npmrc"`
      ],
      { silent: true }
    )
  }
  const publishPackages = async (snapshotPrefix: string): Promise<void> => {
    await exec(changesetBinary, [
      'publish',
      '--no-git-tags',
      '--snapshot',
      '--tag',
      snapshotPrefix
    ])
  }

  return {
    versionPackages,
    getPackages,
    setPublishCredentials,
    publishPackages
  }
})
const publishSnapshots =
  snapshotPublisher.publishSnapshots.bind(snapshotPublisher)

const actionsWrapper = new ActionsWrapper(publishSnapshots, writeComment)
actionsWrapper.run({
  context: github.context,
  getOctoKit: github.getOctokit.bind(github)
})
