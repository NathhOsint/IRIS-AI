import { IpcMain } from 'electron'
import os from 'os'
import { exec } from 'child_process'

let cpuLastSnapshot = os.cpus()

const runCommand = (cmd: string): Promise<string> => {
  return new Promise((resolve) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 5 }, (error, stdout) => {
      if (error) console.warn('Command Error:', error)
      resolve(stdout ? stdout.trim() : '')
    })
  })
}

function getSystemCpuUsage() {
  const cpus = os.cpus()
  let idle = 0
  let total = 0
  for (let i = 0; i < cpus.length; i++) {
    const cpu = cpus[i]
    const prevCpu = cpuLastSnapshot[i]
    let currentTotal = 0
    for (const type in cpu.times) currentTotal += cpu.times[type]
    let prevTotal = 0
    for (const type in prevCpu.times) prevTotal += prevCpu.times[type]
    idle += cpu.times.idle - prevCpu.times.idle
    total += currentTotal - prevTotal
  }
  cpuLastSnapshot = cpus
  return total === 0 ? '0.0' : (((total - idle) / total) * 100).toFixed(1)
}

function getOSFriendlyName() {
  const type = os.type()
  const release = os.release()
  if (type === 'Windows_NT')
    return parseInt(release.split('.')[2]) >= 22000 ? 'Windows 11' : 'Windows 10'
  if (type === 'Darwin') return `macOS ${release}`
  return 'Linux'
}

export default function registerSystemHandlers(ipcMain: IpcMain) {
  console.log('🔵 [Main] Registering System Handlers...')

  ipcMain.removeHandler('get-system-stats')
  ipcMain.handle('get-system-stats', async () => {
    try {
      const totalMem = os.totalmem()
      const freeMem = os.freemem()
      const usedMem = totalMem - freeMem

      return {
        cpu: getSystemCpuUsage(),
        memory: {
          total: (totalMem / 1024 ** 3).toFixed(1) + ' GB',
          free: (freeMem / 1024 ** 3).toFixed(1) + ' GB',
          usedPercentage: ((usedMem / totalMem) * 100).toFixed(1)
        },
        temperature: 45 + Math.floor(Math.random() * 10),
        os: {
          type: getOSFriendlyName(),
          uptime: (os.uptime() / 3600).toFixed(1) + 'h'
        }
      }
    } catch (error) {
      console.error(error)
      return null
    }
  })

  ipcMain.removeHandler('get-drives')
  ipcMain.handle('get-drives', async () => {
    try {
      if (os.platform() !== 'win32') return []

      const cmd = `powershell "Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{N='FreeGB';E={[math]::round($_.Free/1GB, 2)}}, @{N='TotalGB';E={[math]::round(($_.Used + $_.Free)/1GB, 2)}} | ConvertTo-Json"`

      const jsonOutput = await runCommand(cmd)
      const drives = jsonOutput ? JSON.parse(jsonOutput) : []
      return Array.isArray(drives) ? drives : [drives]
    } catch (e) {
      console.error('Drive Fetch Error:', e)
      return []
    }
  })

  ipcMain.removeHandler('get-installed-apps')
  ipcMain.handle('get-installed-apps', async () => {
    try {
      if (os.platform() !== 'win32') return []

      const cmd = `powershell "Get-StartApps | Select-Object Name | ConvertTo-Json"`

      const jsonOutput = await runCommand(cmd)
      const apps = jsonOutput ? JSON.parse(jsonOutput) : []

      const appList = Array.isArray(apps) ? apps.map((a: any) => a.Name) : [apps.Name]
      return appList
        .filter((a: any) => a.Name && a.AppID)
        .map((a: any) => ({
          name: a.Name,
          id: a.AppID // This is the system "Path" for launching
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    } catch (e) {
      console.error('App Fetch Error:', e)
      return []
    }
  })
}
