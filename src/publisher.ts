import { Package, Snapshot } from './common'

function hasAtLeastOneElement<T>(arr: T[]): arr is [T, ...T[]] {
  return arr.length > 0
}

export interface SnapshotPublisherDependencies {
  versionPackages: (snapshotPrefix: string) => Promise<void>
  getPackages: (cwd: string) => Promise<Package[]>
  setPublishCredentials: (npm_token: string) => Promise<void>
  publishPackages: (snapshotPrefix: string) => Promise<void>
}

export class SnapshotPublisher {
  // Not very flexible, but fine for a first version
  private readonly versionPrefix = 'alpha'

  constructor(
    private dependenciesLoader: () => Promise<SnapshotPublisherDependencies>
  ) {}

  private predictSnapshots({
    packages,
    versionPrefix
  }: {
    packages: Package[]
    versionPrefix: string
  }): Snapshot[] {
    const snapshots: Snapshot[] = packages
      .filter(p => {
        const { name, version, private: isPrivate } = p.packageJson
        return name && version && !isPrivate && version.includes(versionPrefix)
      })
      .map(p => {
        const { name, version } = p.packageJson
        const timestamp = version.split('-').at(-1) as string
        return {
          package: name,
          version,
          timestamp,
          fullString: `${name}@${version}`
        }
      })

    return snapshots
  }

  async publishSnapshots(npm_token: string): Promise<{
    versionPrefix: string
    packages: Package[]
    snapshots: Snapshot[]
  }> {
    const {
      versionPackages,
      getPackages,
      setPublishCredentials,
      publishPackages
    } = await this.dependenciesLoader()

    // Version, removing changeset files and bumping packages
    await versionPackages(this.versionPrefix)

    // Get the packages, collect those that will have snapshots published
    const packages = await getPackages(process.cwd())
    console.log({ packages })

    const snapshots = this.predictSnapshots({
      packages,
      versionPrefix: this.versionPrefix
    })
    console.log({ snapshots })

    if (hasAtLeastOneElement(snapshots)) {
      console.log('At least one snapshot was found, publishing snapshots...')
      // publish snapshot packages
      await setPublishCredentials(npm_token)
      await publishPackages(this.versionPrefix)
    }

    return {
      versionPrefix: this.versionPrefix,
      packages,
      snapshots
    }
  }
}
