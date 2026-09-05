import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const packageLock = JSON.parse(
  await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'),
)
const workflow = await readFile(
  new URL('../.github/workflows/deploy-pages.yml', import.meta.url),
  'utf8',
)

const actionShas = new Map([
  ['actions/checkout', '3d3c42e5aac5ba805825da76410c181273ba90b1'],
  ['actions/setup-node', '820762786026740c76f36085b0efc47a31fe5020'],
  ['actions/upload-pages-artifact', 'fc324d3547104276b827a68afc52ff2a11cc49c9'],
  ['actions/deploy-pages', '368f82528645a54fb793d4d04e342629a3f51346'],
])

test('Node and npm contracts match the lockfile and workflow', () => {
  assert.equal(packageJson.packageManager, 'npm@11.19.1')
  assert.equal(packageJson.engines.node, '>=24.0.0')
  assert.equal(packageLock.lockfileVersion, 3)
  assert.equal(packageLock.packages[''].engines.node, '>=24.0.0')
  assert.match(workflow, /node-version: 24/)
  assert.match(workflow, /cache-dependency-path: package-lock\.json/)
  assert.match(workflow, /run: corepack npm ci/)
  assert.doesNotMatch(workflow, /node-version: (?:20|22)/)
})

test('all external actions are pinned to reviewed commits', () => {
  const uses = [...workflow.matchAll(/^\s*(?:- )?uses: ([^\s#]+)/gm)].map((match) => match[1])

  assert.equal(uses.length, actionShas.size)
  for (const action of uses) {
    const [name, sha] = action.split('@')
    assert.match(sha, /^[0-9a-f]{40}$/)
    assert.equal(sha, actionShas.get(name))
  }
})

test('deployment authority is isolated and every job is bounded', () => {
  assert.match(workflow, /permissions:\n\s{2}contents: read/)
  assert.match(workflow, /deploy:[\s\S]*?permissions:\n\s{6}pages: write\n\s{6}id-token: write/)
  assert.equal((workflow.match(/runs-on:/g) ?? []).length, 2)
  assert.equal((workflow.match(/timeout-minutes:/g) ?? []).length, 2)
  assert.match(workflow, /cancel-in-progress: false/)
  assert.doesNotMatch(workflow, /actions\/configure-pages/)
})
