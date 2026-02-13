import { IpcMain } from 'electron'
import { exec } from 'child_process'

const APP_ALIASES: Record<string, string> = {
  vscode: 'code',
  code: 'code',
  'visual studio code': 'code',
  terminal: 'wt',
  cmd: 'start cmd',
  git: 'start git-bash',
  mongo: 'mongodbcompass',
  mongodb: 'mongodbcompass',
  postman: 'postman',

  chrome: 'start chrome',
  'google chrome': 'start chrome',
  edge: 'start msedge',
  brave: 'start brave',
  firefox: 'start firefox',

  whatsapp: 'start whatsapp:',
  discord: 'Update.exe --processStart Discord.exe',
  spotify: 'start spotify:',
  telegram: 'start telegram:',

  tlauncher: 'TLauncher',
  minecraft: 'MinecraftLauncher',
  'cheat engine': 'Cheat Engine',
  steam: 'start steam:',
  'epic games': 'com.epicgames.launcher:',

  'live wallpaper': 'livelywpf', // Try Lively Wallpaper default
  lively: 'livelywpf',
  notepad: 'notepad',
  calculator: 'calc',
  settings: 'start ms-settings:',
  explorer: 'explorer',
  files: 'explorer',
  'task manager': 'taskmgr'
}

export default function registerAppLauncher(ipcMain: IpcMain) {
  ipcMain.removeHandler('open-app')

  ipcMain.handle('open-app', async (_event, appName: string) => {
    return new Promise((resolve) => {
      const lowerName = appName.toLowerCase().trim()

      let command = APP_ALIASES[lowerName]

      if (command) {
        executeCommand(command, appName, resolve)
      } else {
        launchViaPowerShell(appName, resolve)
      }
    })
  })
}

// Helper to run the command
function executeCommand(command: string, appName: string, resolve: any) {
  console.log(`🚀 IRIS Launching Direct: ${command}`)
  exec(command, (error) => {
    if (error) {
      console.warn(`Direct launch failed for ${appName}, trying fallback...`)
      launchViaPowerShell(appName, resolve)
    } else {
      resolve({ success: true, message: `Opened ${appName}` })
    }
  })
}

function launchViaPowerShell(appName: string, resolve: any) {
  console.log(`🔎 IRIS Deep Search for: ${appName}`)

  const psCommand = `powershell -Command "Get-StartApps | Where-Object { $_.Name -like '*${appName}*' } | Select-Object -First 1 -ExpandProperty AppID"`

  exec(psCommand, (err, stdout) => {
    if (err) {
      console.warn(`PowerShell search failed for ${appName}:`, err)
    }
    const appId = stdout.trim()

    if (appId) {
      console.log(`🎯 Found AppID: ${appId}`)
      const launchCmd = `start explorer "shell:AppsFolder\\${appId}"`

      exec(launchCmd, (launchErr) => {
        if (launchErr) {
          resolve({ success: false, error: `Found app but could not launch: ${launchErr.message}` })
        } else {
          resolve({ success: true, message: `Opened ${appName} via System Search` })
        }
      })
    } else {
      console.error(`❌ Could not find app: ${appName}`)
      resolve({
        success: false,
        error: `Could not find '${appName}' on this system. Try opening it manually once.`
      })
    }
  })
}
