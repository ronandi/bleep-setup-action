import * as core from '@actions/core'
import * as fs from 'fs'
import * as tc from '@actions/tool-cache'
import * as yaml from 'yaml'

async function downloadBleep(version: string): Promise<void> {
  const baseUrl = `https://github.com/oyvindberg/bleep/releases/download/v${version}/bleep`

  const unixLike = async (url: string): Promise<void> => {
    const guid = await tc.downloadTool(url)
    const extracted = await tc.extractTar(guid)
    const cachedDir = await tc.cacheDir(extracted, 'bleep', version)
    core.addPath(cachedDir)
  }

  if (process.platform === 'linux' && process.arch === 'x64') {
    unixLike(`${baseUrl}-x86_64-pc-linux.tar.gz`)
  } else if (process.platform === 'linux' && process.arch === 'arm64') {
    unixLike(`${baseUrl}-arm64-pc-linux.tar.gz`)
  } else if (process.platform === 'win32' && process.arch === 'x64') {
    const guid = await tc.downloadTool(`${baseUrl}-x86_64-pc-win32.zip`)
    const extracted = await tc.extractZip(guid)
    const cachedDir = await tc.cacheDir(extracted, 'bleep', version)
    core.addPath(cachedDir)
  } else if (process.platform === 'darwin' && process.arch === 'x64') {
    unixLike(`${baseUrl}-x86_64-apple-darwin.tar.gz`)
  } else if (process.platform === 'darwin' && process.arch === 'arm64') {
    unixLike(`${baseUrl}-arm64-apple-darwin.tar.gz`)
  } else {
    return Promise.reject(new Error(`Not supported os/arch: ${process.platform}/${process.arch}`))
  }
}

async function run(): Promise<void> {
  try {
    await core.group('Install Bleep', async () => {
      if (!fs.existsSync('bleep.yaml')) {
        throw new Error(
          "bleep.yaml doesn't exist. You likely need to run `bleep-setup-action` after checking out source",
        )
      }
      const bleepYamlStr = fs.readFileSync('bleep.yaml', { encoding: 'utf-8' })
      const bleepYaml = yaml.parse(bleepYamlStr)
      const version = bleepYaml['$version']
      if (typeof version !== 'string') {
        throw new Error(`Couldn't read \`$version\` from ${bleepYamlStr}`)
      }
      await downloadBleep(version)
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    core.setFailed(msg)
  }
}

run()
