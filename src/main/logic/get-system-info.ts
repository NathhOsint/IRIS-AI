import { IpcMain } from 'electron' // Type only
import os from 'os'

// 1. Helper Helpers (Keep these)
let cpuLastSnapshot = os.cpus()
function getSystemCpuUsage() {
  const cpus = os.cpus()
  let idle = 0; let total = 0
  for (let i = 0; i < cpus.length; i++) {
    const cpu = cpus[i]; const prevCpu = cpuLastSnapshot[i]
    let currentTotal = 0; for (const type in cpu.times) currentTotal += cpu.times[type]
    let prevTotal = 0; for (const type in prevCpu.times) prevTotal += prevCpu.times[type]
    idle += (cpu.times.idle - prevCpu.times.idle); total += (currentTotal - prevTotal)
  }
  cpuLastSnapshot = cpus
  return total === 0 ? '0.0' : (((total - idle) / total) * 100).toFixed(1)
}

function getOSFriendlyName() {
  const type = os.type(); const release = os.release()
  if (type === 'Windows_NT') return parseInt(release.split('.')[2]) >= 22000 ? 'Windows 11' : 'Windows 10'
  if (type === 'Darwin') return `macOS ${release}`
  return 'Linux'
}

// 2. THE FIX: Accept ipcMain as an argument
export default function registerSystemHandlers(ipcMain: IpcMain) {
  console.log('🔵 [Main] Registering System Stats...') 

  // Remove old handlers to prevent hot-reload duplicates
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
}