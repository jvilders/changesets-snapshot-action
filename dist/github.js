"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertComment = upsertComment;
const common_1 = require("./common");
async function upsertComment({ octokit, commentBody }) {
    const comments = await octokit.listComments();
    const existingComment = comments.data.find((v) => v.body?.startsWith(common_1.SNAPSHOT_COMMENT_IDENTIFIER));
    if (existingComment) {
        console.log("Found an existing comment, updating...", existingComment);
        const response = await octokit.updateComment({ comment_id: existingComment.id, body: commentBody });
        console.log(`GitHub API response: ${response.status}`);
    }
    else {
        console.log(`No existing comment found, creating...`);
        const response = await octokit.createComment({ body: commentBody });
        console.log(`GitHub API response: ${response.status}`);
    }
}
//# sourceMappingURL=github.js.map