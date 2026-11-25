import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { record } from '../analysis/strategy'

export class WorkbenchStore {
  constructor(readonly root = resolve('artifacts', 'workbench')) {}
  path(...parts: string[]) {
    if (parts.some((s) => !/^[A-Za-z0-9._-]+$/.test(s) || s === '.' || s === '..')) {
      throw new Error('无效的本地资源 ID')
    }
    return resolve(this.root, ...parts)
  }
  async read<T>(parts: string[], fallback?: T): Promise<T> {
    try {
      return JSON.parse(await readFile(this.path(...parts), 'utf8')) as T
    } catch (error) {
      if (record(error).code === 'ENOENT' && fallback !== undefined) {
        return fallback
      }
      throw error
    }
  }
  async write(parts: string[], value: unknown) {
    const target = this.path(...parts)
    await mkdir(dirname(target), { recursive: true })
    const temporary = `${target}.${randomUUID()}.tmp`
    await writeFile(temporary, JSON.stringify(value, null, 2))
    await rename(temporary, target)
  }
  async list(folder: string) {
    try {
      return (await readdir(this.path(folder))).filter((id) => /^[A-Za-z0-9-]+$/.test(id))
    } catch (error) {
      if (record(error).code === 'ENOENT') {
        return []
      }
      throw error
    }
  }
}
