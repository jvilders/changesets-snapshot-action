"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTable = formatTable;
exports.makeComment = makeComment;
const common_1 = require("./common");
function formatTable(packages) {
    const header = `| Package | Version |\n|------|---------|`;
    const rows = packages.map(p => `| \`${p.package}\` | \`${p.version}\` |`);
    const table = [
        header,
        ...rows
    ].join("\n");
    return table;
}
function makeComment({ snapshots, versionPrefix }) {
    if (snapshots.length === 0) {
        const body = [
            common_1.SNAPSHOT_COMMENT_IDENTIFIER,
            "Snapshot release action ran, but there were no snapshots to release"
        ].join("\n");
        return `${common_1.SNAPSHOT_COMMENT_IDENTIFIER}\nSnapshot release action ran, but there were no snapshots to release`;
    }
    const header = `### 🚀 Snapshot Release (\`${versionPrefix}\`)`;
    const multiple = snapshots.length > 1;
    const introMessage = `Your snapshot${multiple ? 's have' : ' has'} been published.**`;
    const tableElement = formatTable(snapshots);
    const body = [
        header,
        introMessage,
        tableElement
    ].join("\n");
    return `${common_1.SNAPSHOT_COMMENT_IDENTIFIER}${body}`;
}
//# sourceMappingURL=comment.js.map