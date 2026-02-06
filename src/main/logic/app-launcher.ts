import { IpcMain } from 'electron'
import { exec } from 'child_process'
import os from 'os'

// Helper: Run Shell Command wrapped in a Promise
const runCommand = (cmd: string): Promise<string> => {
  return new Promise((resolve) => {
    exec(cmd, (err, stdout) => {
      // If error, return empty string so app doesn't crash
      resolve(err ? '' : stdout.trim())
    })
  })
}

// Export the Registration Function
export default function registerAppScanner(ipcMain: IpcMain) {
  console.log('🔵 [Main] Registering App Scanner...')

  // Clean up old handlers to avoid "Duplicate Handler" errors
  ipcMain.removeHandler('get-running-apps')

  // Register the Handler
  ipcMain.handle('get-running-apps', async () => {
    try {
      if (os.platform() === 'win32') {
        // Windows: Get apps with a visible window title
        const cmd = `powershell "Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object -ExpandProperty ProcessName"`
        const output = await runCommand(cmd)
        // Clean output: Split by new line, trim, remove empty
        const apps = output
          .split(/\r?\n/)
          .map((a) => a.trim())
          .filter((a) => a)
        return [...new Set(apps)] // Remove duplicates
      }

      if (os.platform() === 'darwin') {
        // Mac: Get apps that are not background-only
        const cmd = `osascript -e 'tell application "System Events" to get name of (processes where background only is false)'`
        const output = await runCommand(cmd)
        return output.split(', ').map((s) => s.trim())
      }

      return [] // Linux or other OS not supported yet
    } catch (e) {
      console.error('App Scan Error:', e)
      return []
    }
  })
}
