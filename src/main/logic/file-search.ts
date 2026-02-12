import { IpcMain } from 'electron'
import { glob } from 'glob'
import path from 'path'

export default function registerFileSearch(ipcMain: IpcMain) {
  ipcMain.handle('search-files', async (_event, { fileName, searchPath }) => {
    try {
      // If path given, use it. If not, use the System Root (e.g., C:\ or /)
      const rootDir = searchPath ? path.resolve(searchPath) : path.parse(process.cwd()).root

      console.log(`🔍 Searching: ${fileName} in ${rootDir}`)

      const files = await glob(`**/*${fileName}*`, {
        cwd: rootDir,
        nodir: true,
        nocase: true,
        maxDepth: 4, // ⚠️ Limit depth to prevent scanning millions of system files
        ignore: [
          '**/node_modules/**',
          '**/AppData/**',
          '**/Program Files/**',
          '**/Windows/**',
          '**/.git/**'
        ],
        absolute: true,
        windowsPathsNoEscape: true
      })

      // Return top 5 results
      return files.slice(0, 5).join('\n') || 'No files found.'
    } catch (err) {
      console.error(err)
      return `Error: ${err}`
    }
  })
}
