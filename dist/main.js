"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapshotPublisher = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const exec_1 = require("@actions/exec");
const github_1 = require("./github");
function hasAtLeastOneElement(arr) {
    return arr.length > 0;
}
class SnapshotPublisher {
    dependenciesLoader;
    // Not very flexible, but fine for a first version
    versionPrefix = 'alpha';
    constructor(dependenciesLoader) {
        this.dependenciesLoader = dependenciesLoader;
    }
    assertEnvironmentPrerequisites(env) {
        if (!process.env.GITHUB_TOKEN) {
            throw new Error('Please provide the GITHUB_TOKEN to the GitHub action');
        }
        if (!process.env.NPM_TOKEN) {
            throw new Error('Please provide the NPM_TOKEN to the GitHub action');
        }
    }
    predictSnapshots({ packages, versionPrefix }) {
        console.log(packages);
        const snapshots = packages
            .filter(p => {
            const { name, version, private: isPrivate } = p.packageJson;
            return name && version && !isPrivate && version.includes(versionPrefix);
        })
            .map(p => {
            const { name, version } = p.packageJson;
            const timestamp = version.split('-').at(-1);
            return {
                package: name,
                version,
                timestamp,
                fullString: `${name}@${version}`,
            };
        });
        return snapshots;
    }
    async setPublishCredentials(npm_token) {
        // Won't work for modern yarn since that ignores .npmrc files
        await (0, exec_1.exec)('bash', [
            '-c',
            `echo "//registry.npmjs.org/:_authToken=${npm_token}" > "$HOME/.npmrc"`,
        ], { silent: true });
    }
    async publishSnapshots() {
        try {
            this.assertEnvironmentPrerequisites(process.env);
            const { octokitSubset: octokit, versionPackages, getPackages, publishPackages, commentBuilder } = await this.dependenciesLoader();
            // Version, removing changeset files and bumping packages
            await versionPackages(this.versionPrefix);
            // Get the packages, collect those that will have snapshots published
            const packages = await getPackages(process.cwd());
            const snapshots = this.predictSnapshots({ packages, versionPrefix: this.versionPrefix });
            console.log({ snapshots });
            if (hasAtLeastOneElement(snapshots)) {
                // publish snapshot packages
                await this.setPublishCredentials(process.env.NPM_TOKEN);
                console.log('publishing');
                await publishPackages(this.versionPrefix);
            }
            // create/update comment
            const associatedIssue = github.context.issue;
            if (associatedIssue.number === undefined) {
                console.log("No associated issue found, not making a comment");
                return;
            }
            const comment = commentBuilder({ snapshots, versionPrefix: this.versionPrefix });
            await (0, github_1.upsertComment)({
                octokit,
                commentBody: comment
            });
        }
        catch (error) {
            // Fail the workflow run if an error occurs
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    }
}
exports.SnapshotPublisher = SnapshotPublisher;
// export async function publishSnapshots(): Promise<void> {
//   try {
//     // Check required tokens
//     if (!process.env.GITHUB_TOKEN) {
//       throw new Error(
//         'Please provide the GITHUB_TOKEN to the GitHub action',
//       );
//     }
//     if (!process.env.NPM_TOKEN) {
//       throw new Error(
//         'Please provide the NPM_TOKEN to the GitHub action',
//       );
//     }
//     const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
//     // Making assumptions here, fine for a first version
//     const versionPrefix = 'alpha';
//     const changesetBinary = path.join('node_modules/.bin/changeset');
//     // Version, removing changeset files and bumping packages
//     await exec(changesetBinary, ['version', '--snapshot', versionPrefix]);
//     // Get the packages, collect those that will have snapshots published
//     const { packages } = await getPackages(process.cwd());
//     const snapshots: Snapshot[] = [];
//     packages.forEach(({ packageJson }) => {
//       const { name, version, private: isPrivate } = packageJson;
//       if (name && version && !isPrivate && version.includes(versionPrefix)) {
//         const timestamp = version.split('-').at(-1) as string;
//         snapshots.push({
//           package: name,
//           version,
//           timestamp,
//           fullString: `${name}@${version}`,
//         });
//       }
//     });
//     // TODO: should this be an error? I don't mind if empty or no changesets are added when this runs.
//     if(!hasAtLeastOneElement(snapshots)) {
//       console.log("No snapshots to publish, exiting early");
//       return
//     }
//     // Make an .npmrc file with the token to allow publishing,
//     // overwrites possible committed .npmrc file
//     await exec(
//       'bash',
//       [
//         '-c',
//         `echo "//registry.npmjs.org/:_authToken=${process.env.NPM_TOKEN}" > "$HOME/.npmrc"`,
//       ],
//       { silent: true },
//     );
//     // Publish the snapshots
//     await exec(changesetBinary, [
//       'publish',
//       '--no-git-tags',
//       '--snapshot',
//       '--tag',
//       versionPrefix,
//     ]);
//     // create/update comment
//     const associatedIssue = github.context.issue;
//     if(associatedIssue.number === undefined){
//       console.log("No associated issue found, not making a comment")
//     }
//     const comment = makeComment(snapshots, versionPrefix);
//     await upsertComment({
//       octokit: {
//         listComments: async () => octokit.rest.issues.listComments({...github.context.repo, issue_number: associatedIssue.number, per_page: 100}),
//         createComment: async (args: {body: string}) => octokit.rest.issues.createComment({...github.context.repo, body: args.body, issue_number: associatedIssue.number}),
//         updateComment: async (args: {comment_id: number, body: string}) => octokit.rest.issues.updateComment({...github.context.repo, body: args.body, comment_id: args.comment_id})
//       },
//       commentBody: comment
//     });
//     // Set outputs for other workflow steps to use
//     // core.setOutput('time', new Date().toTimeString())
//   } catch (error) {
//     // Fail the workflow run if an error occurs
//     if (error instanceof Error) core.setFailed(error.message)
//   }
// }
//# sourceMappingURL=main.js.map