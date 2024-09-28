import { Package } from '../src/common'
import {
  SnapshotPublisher,
  SnapshotPublisherDependencies
} from '../src/publisher'

function makeDependencies(
  retrievedPackages: Package[] = []
): SnapshotPublisherDependencies {
  const versionPackagesMock = jest.fn()
  const getPackagesMock = jest.fn(async () => retrievedPackages)
  const setPublishCredentialsMock = jest.fn()
  const publishPackagesMock = jest.fn()

  return {
    versionPackages: versionPackagesMock,
    getPackages: getPackagesMock,
    setPublishCredentials: setPublishCredentialsMock,
    publishPackages: publishPackagesMock
  }
}

describe('SnapshotPublisher', () => {
  it('should not publish snapshots if no qualifying versions were bumped', async () => {
    const dependencies = makeDependencies()
    const snapshotPublisher = new SnapshotPublisher(async () => dependencies)

    await snapshotPublisher.publishSnapshots('')

    expect(dependencies.versionPackages).toHaveBeenCalled()
    expect(dependencies.getPackages).toHaveBeenCalled()
    expect(dependencies.setPublishCredentials).not.toHaveBeenCalled()
    expect(dependencies.publishPackages).not.toHaveBeenCalled()
  })

  it('should publish snapshots if qualifying packages were bumped', async () => {
    const dependencies = makeDependencies([
      {
        packageJson: {
          name: 'test',
          version: '1.0.0-alpha-1234567890'
        }
      }
    ])
    const snapshotPublisher = new SnapshotPublisher(async () => dependencies)

    await snapshotPublisher.publishSnapshots('')

    expect(dependencies.versionPackages).toHaveBeenCalled()
    expect(dependencies.getPackages).toHaveBeenCalled()
    expect(dependencies.setPublishCredentials).toHaveBeenCalled()
    expect(dependencies.publishPackages).toHaveBeenCalled()
  })
})
