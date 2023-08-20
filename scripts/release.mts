import prompts from 'prompts'
import semver from 'semver'
import 'zx/globals'

const { type } = await prompts({
  type: 'select',
  name: 'type',
  message: '请选择发布类型',
  choices: [
    { title: 'Kivi Core', value: 'core' },
    { title: 'Kivi Plugin', value: 'plugin' },
  ],
})

switch (type) {
  case 'core':
    handleCoreRelease()
    break
  case 'plugin':
    handlePluginRelease()
    break
}

async function readProjectsFromDir(dir: string) {
  const projects = (await $`ls ${dir}`).stdout
    .split('\n')
    .filter(Boolean)
    .map((e) => e.trim())

  return projects
    .map((proj) => path.resolve(`${dir}/${proj}/package.json`))
    .filter((pkg) => fs.existsSync(pkg))
    .map((e) => ({ path: e, pkg: JSON.parse(fs.readFileSync(e, 'utf-8')) as Record<string, any> }))
    .map((e) => ({ ...e, value: e.pkg.name, title: e.pkg.name }))
}

async function handleCoreRelease() {
  const projects = await readProjectsFromDir('packages')

  const currentVersion = projects[0].pkg.version || ''
  const versions: semver.ReleaseType[] = ['prerelease', 'patch', 'minor', 'major']

  const res = await $`git rev-parse --short HEAD`
  const lastCommitHash = res.stdout.replace(/(\n|,$)/g, '')

  const { version } = await prompts({
    type: 'select',
    name: 'version',
    message: '请选择发布版本',
    choices: versions.map((e) => ({
      title: generateNextVersion(currentVersion, e, lastCommitHash) + ` (${e}) `,
      value: generateNextVersion(currentVersion, e, lastCommitHash)!,
    })),
  })

  if (!version) return

  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: `确认发布 ${version} 版本吗？`,
  })

  if (confirm) {
    await $`pnpm run build`

    bumpVersion(projects, version)

    await $`git add . -A`
    await $`git commit -m "release: v${version}"`
    await $`git tag -a v${version} -m "v${version}"`
    await $`git push --tags`
    await $`git push`
  }
}

function handlePluginRelease() {
  console.log('// TODO')
}

function bumpVersion(projects: { pkg: Record<string, any>; path: string }[], version: string) {
  projects.forEach((proj) => {
    proj.pkg.version = version
    fs.writeFileSync(proj.path, JSON.stringify(proj.pkg, null, 2))
  })
}

// fix semver prerelease
function generateNextVersion(version: string, type: semver.ReleaseType, hash: string) {
  if (type === 'prerelease') {
    const SemVer = semver.parse(semver.minVersion(version))
    const { major, minor, patch } = SemVer!

    return `${major}.${minor}.${patch}-beta.${hash}`
  } else {
    return semver.inc(version, type)
  }
}
