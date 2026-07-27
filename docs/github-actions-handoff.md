# GitHub Actions runtime-verification handoff

The commerce workflow already runs for pull requests and manual dispatches. The repository owner
must perform the following commands from a workstation authenticated to the destination GitHub
repository. Replace `OWNER`, `REPOSITORY`, and the remote URL before running them.

## 1. Connect and push the branch

```bash
git remote add origin git@github.com:OWNER/REPOSITORY.git
# If origin already exists, inspect it before changing it:
git remote -v
git push --set-upstream origin work
```

Do not place a token in the remote URL. Use an SSH key or GitHub CLI credential storage.

## 2. Open the pull request

```bash
gh auth status
gh pr create \
  --repo OWNER/REPOSITORY \
  --base main \
  --head work \
  --title "ci: complete Medusa v1 runtime verification" \
  --body-file /tmp/cartunez-pr-body.md
```

Opening the pull request starts `.github/workflows/commerce-verification.yml` automatically. Record
the PR URL printed by `gh pr create`.

## 3. Locate the first failure

```bash
gh run list --repo OWNER/REPOSITORY --workflow "Commerce verification" --branch work --limit 10
RUN_ID="$(gh run list --repo OWNER/REPOSITORY --workflow "Commerce verification" --branch work --limit 1 --json databaseId --jq '.[0].databaseId')"
gh run view "$RUN_ID" --repo OWNER/REPOSITORY
gh run view "$RUN_ID" --repo OWNER/REPOSITORY --log-failed
```

Record the run URL, job, step, command, and sanitized error before changing repository code.

## 4. Bootstrap the intentionally absent backend lockfile

Use Node 20 and npm 10.8.2 on a machine with direct public npm access:

```bash
nvm use 20
npm install --global npm@10.8.2
cd backend/cartunez-medusa
export NODE_ENV=test
export DATABASE_URL=postgresql://postgres:local-test-password@127.0.0.1:5432/cartunez_ci
export CONFIRM_DISPOSABLE_DATABASE=yes
node scripts/verify-ci-environment.js
rm -rf node_modules
npm install
rm -rf node_modules
npm ci
npm ls @medusajs/medusa typeorm
if npm ls medusa-extender --depth=0; then exit 1; fi
git add package-lock.json
git commit -m "build: add verified Medusa backend lockfile"
git push
```

`verify-ci-environment.js` requires `DATABASE_URL` to identify `cartunez_ci` and
`CONFIRM_DISPOSABLE_DATABASE=yes`; it prints only the database host and name, never credentials.
Do not commit a lockfile unless both installation commands pass without force or legacy-peer flags.

## 5. Manual dispatch and reruns

```bash
gh workflow run commerce-verification.yml --repo OWNER/REPOSITORY --ref work
gh run watch --repo OWNER/REPOSITORY
gh run rerun "$RUN_ID" --repo OWNER/REPOSITORY --failed
```

After every observed-failure fix, push the focused commit and allow the entire pull-request workflow
to run again. Do not use `continue-on-error`, fabricate fixtures, or upload an unsanitized Medusa
log. Failed-run artifacts contain only `medusa.sanitized.log`.

## Equivalent disposable local run

After the reviewed backend lockfile exists, a Docker-capable workstation can reproduce the gate:

```bash
nvm use 20
npm install --global npm@10.8.2
./scripts/verify-commerce-runtime.sh
```

The script starts only PostgreSQL 16, Redis 7, and Meilisearch 1.7 from
`backend/docker-compose.verify.yml`, uses `cartunez_ci`, and removes containers and volumes on exit.
It refuses to start without the reviewed backend lockfile and the required toolchain/safety checks.
