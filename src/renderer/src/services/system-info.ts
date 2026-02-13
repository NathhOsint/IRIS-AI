// --- TYPES ---
export interface SystemStats {
  cpu: string
  memory: {
    total: string
    free: string
    usedPercentage: string
  }
  temperature: number
  os: {
    type: string
    uptime: string
  }
}

export interface AppItem {
  name: string
  id: string
}

// --- 1. CORE SYSTEM STATUS (Runs every second) ---
export const getSystemStatus = async (): Promise<SystemStats | null> => {
  try {
    return await window.electron.ipcRenderer.invoke('get-system-stats')
  } catch (error) {
    console.error('Stats Error:', error)
    return null
  }
}

// --- 2. GET INSTALLED APPS (Runs once on load) ---
// Returns a list of strings: ["Chrome", "Discord", "VS Code"...]
export const getAllApps = async (): Promise<AppItem[]> => {
  try {
    const apps = await window.electron.ipcRenderer.invoke('get-installed-apps')
    return Array.isArray(apps) ? apps : []
  } catch (error) {
    console.error('App Fetch Error:', error)
    return []
  }
}

// --- 3. GET DRIVES (Optional, for storage check) ---
export const getDrives = async (): Promise<any[]> => {
  try {
    return await window.electron.ipcRenderer.invoke('get-drives')
  } catch (error) {
    return []
  }
}
