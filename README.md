# Changesets Snapshot action

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

## Features

- Applies changesets to create snapshot versions
- Publishes relevant snapshot versions (not private)
- Creates/updates issue comment if possible

### Details

Uses standard `changeset version` command to bump package versions. In absence
of easy-to-access output from this command indicating which packages were
bumped, the action will read out all packages of the project (using the
wonderful [manypkg](https://github.com/Thinkmill/manypkg) library) and filter
them: Only packages which are not marked private in their `package.json` (which
changeset would not publish) and which have versions containing the snapshot
prefix (because this step runs after the snapshot versioning command) are kept.
If any packages remain, the publish step is run. If an associated issue can be
found, a comment is created/updated with the published snapshot releases.

## Motivation

The existing actions I found didn't work quite right with my setup, so I made a
very simple version for myself. It doesn't take inputs, it doesn't provide
outputs, it's extremely barebones.

It's used like this:

```yaml
steps:
  - name: Release snapshot
    uses: jvilders/changesets-snapshot-action@[version here]
    env:
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The action is intended for use in PR workflows where it will create/update a
comment, but there's nothing inherently preventing it from working in response
to other GitHub events.

## Limitations/shortcomings

- Process of 'predicting' snapshot releases is more brittle than relying on
  output from the version command. Parsing stdout might be more reliable.
- Logic gating the publishing step is based on this prediction logic too. If
  this logic were to be wrong, possibly due to future changes in the
  `changesets` package, it would prevent publishing valid snapshot releases
  simply because the prediction logic overlooks them.
- Publishing credentials (the passed `NPM_TOKEN`) are put in an `.npmrc` file at
  the root of the project. This means this actions only works for projects that
  read an `.npmrc` for publishing credentials. That means npm, pnpm, probably
  others, but not modern Yarn for example. Also, if there already was a
  committed `.npmrc` file using interpolation for its credentials, this action
  would overwrite it.

## Inspiration and thanks

- [snapit](https://github.com/Shopify/snapit) action by
  [Shopify](https://github.com/Shopify)
- [changesets-snapshot](https://github.com/seek-oss/changesets-snapshot) action
  by [seek-oss](https://github.com/seek-oss)
- [changesets-snapshot-action](https://github.com/the-guild-org/changesets-snapshot-action)
  by [the-guild-org](https://github.com/the-guild-org)
- Repository setup by the
  [TypeScript action public template](https://github.com/actions/typescript-action)
