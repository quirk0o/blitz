import {resolve, dirname} from 'path'
import {spawn} from 'child_process'
import {ensureDir, copy as fsCopy, unlink} from 'fs-extra'
import chokidar from 'chokidar'

// NOTE:
// This is a poor mans rsync final implementation should
// probably use filestreams or something fancy like that

const log = msg => {
  console.log(msg)
}

const transformPath = path => {
  const match = /^\/?app\/.+\/(pages\/.*)$/.exec(path)
  return match ? match[1] : path
}

const copy = (src, dest) => async path => {
  const paths = {
    src: resolve(src, path),
    dest: resolve(dest, transformPath(path)),
  }

  log(`${path} -> .blitz/${path}`)

  await ensureDir(dirname(paths.dest))
  await fsCopy(paths.src, paths.dest, {dereference: true})
}

const remove = base => async (path, stats) => {
  await unlink(resolve(base, path))
  log(`DELETE: .blitz/${path}`)
}

function startNext(cwd) {
  const next = spawn('../node_modules/.bin/next', ['dev'], {
    cwd,
    stdio: [process.stdin, process.stdout, process.stderr],
  })

  next.on('close', function() {
    process.exit(0)
  })
}

async function run({root}) {
  const src = resolve(root)
  const dest = resolve(root, '.blitz')
  await ensureDir(dest)

  const watchPaths = [
    'app/**/*',
    'pages/**/*',
    'public/**/*',
    'utils/**/*',
    'prisma/**/*',
    'package.json',
    '*config.js',
    '*.d.ts',
    '*.js',
    '*.css',
    '*.json',
  ]
  const watcher = chokidar.watch(watchPaths)

  watcher.on('change', copy(src, dest))
  watcher.on('add', copy(src, dest))
  watcher.on('unlink', remove(dest))
  watcher.on('ready', () => {
    startNext(dest)
  })
}

export default run({root: resolve(__dirname, '..')})
