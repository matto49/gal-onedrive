import { NextRouter } from 'next/router'
import toast from 'react-hot-toast'
import JSZip from 'jszip'
import { useTranslation } from 'next-i18next'

import { fetcher } from '../utils/fetchWithSWR'
import { getStoredToken } from '../utils/protectedRouteHandler'
import { onedriveRequest } from '../utils/api'

/**
 * A loading toast component with file download progress support
 * @param props
 * @param props.router Next router instance, used for reloading the page
 * @param props.progress Current downloading and compression progress (returned by jszip metadata)
 */
export function DownloadingToast({ router, progress }: { router: NextRouter; progress?: string }) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center space-x-2">
      <div className="w-56">
        <span>{progress ? t('Downloading {{progress}}%', { progress }) : t('Downloading selected files...')}</span>

        <div className="relative mt-2">
          <div className="flex h-1 overflow-hidden rounded bg-gray-100">
            <div style={{ width: `${progress}%` }} className="bg-gray-500 text-white transition-all duration-100"></div>
          </div>
        </div>
      </div>
      <button
        className="rounded bg-red-500 p-2 text-white hover:bg-red-400 focus:outline-none focus:ring focus:ring-red-300"
        onClick={() => router.reload()}
      >
        {t('Cancel')}
      </button>
    </div>
  )
}

// Blob download helper
export function downloadBlob({ blob, name }: { blob: Blob; name: string }) {
  // Prepare for download
  const el = document.createElement('a')
  el.style.display = 'none'
  document.body.appendChild(el)

  // Download zip file
  const bUrl = window.URL.createObjectURL(blob)
  el.href = bUrl
  el.download = name
  el.click()
  window.URL.revokeObjectURL(bUrl)
  el.remove()
}

/**
 * Download multiple files after compressing them into a zip
 * @param toastId Toast ID to be used for toast notification
 * @param files Files to be downloaded
 * @param folder Optional folder name to hold files, otherwise flatten files in the zip
 */
export async function downloadMultipleFiles({
  toastId,
  router,
  files,
  folder,
}: {
  toastId: string
  router: NextRouter
  files: { name: string; url: string }[]
  folder?: string
}): Promise<void> {
  const zip = new JSZip()
  const dir = folder ? zip.folder(folder)! : zip

  // Add selected file blobs to zip
  files.forEach(({ name, url }) => {
    dir.file(
      name,
      fetch(url).then(r => {
        return r.blob()
      })
    )
  })

  // Create zip file and download it
  const b = await zip.generateAsync({ type: 'blob' }, metadata => {
    toast.loading(<DownloadingToast router={router} progress={metadata.percent.toFixed(0)} />, {
      id: toastId,
    })
  })
  downloadBlob({ blob: b, name: folder ? folder + '.zip' : 'download.zip' })
}

/**
 * Download hierarchical tree-like files after compressing them into a zip
 * @param toastId Toast ID to be used for toast notification
 * @param files Files to be downloaded. Array of file and folder items excluding root folder.
 * Folder items MUST be in front of its children items in the array.
 * Use async generator because generation of the array may be slow.
 * When waiting for its generation, we can meanwhile download bodies of already got items.
 * Only folder items can have url undefined.
 * @param basePath Root dir path of files to be downloaded
 * @param folder Optional folder name to hold files, otherwise flatten files in the zip
 */
export async function downloadTreelikeMultipleFiles({
  toastId,
  router,
  files,
  basePath,
  folder,
}: {
  toastId: string
  router: NextRouter
  files: AsyncGenerator<{
    name: string
    url?: string
    path: string
    isFolder: boolean
  }>
  basePath: string
  folder?: string
}): Promise<void> {
  const zip = new JSZip()
  const root = folder ? zip.folder(folder)! : zip
  const map = [{ path: basePath, dir: root }]

  // Add selected file blobs to zip according to its path
  for await (const { name, url, path, isFolder } of files) {
    // Search parent dir in map
    const i = map
      .slice()
      .reverse()
      .findIndex(
        ({ path: parent }) =>
          path.substring(0, parent.length) === parent && path.substring(parent.length + 1).indexOf('/') === -1
      )
    if (i === -1) {
      throw new Error('File array does not satisfy requirement')
    }

    // Add file or folder to zip
    const dir = map[map.length - 1 - i].dir
    if (isFolder) {
      map.push({ path, dir: dir.folder(name)! })
    } else {
      dir.file(
        name,
        fetch(url!).then(r => r.blob())
      )
    }
  }

  // Create zip file and download it
  const b = await zip.generateAsync({ type: 'blob' }, metadata => {
    toast.loading(<DownloadingToast router={router} progress={metadata.percent.toFixed(0)} />, {
      id: toastId,
    })
  })
  downloadBlob({ blob: b, name: folder ? folder + '.zip' : 'download.zip' })
}

interface TraverseItem {
  path: string
  meta: any
  isFolder: boolean
  error?: { status: number; message: string }
}

/**
 * One-shot concurrent top-down file traversing for the folder.
 * Due to react hook limit, we cannot reuse SWR utils for recursive actions.
 * We will directly fetch API and arrange responses instead.
 * In folder tree, we visit folders top-down as concurrently as possible.
 * Every time we visit a folder, we fetch and return meta of all its children.
 * If folders have pagination, partically retrieved items are not returned immediately,
 * but after all children of the folder have been successfully retrieved.
 * If an error occurred in paginated fetching, all children will be dropped.
 * @param path Folder to be traversed. The path should be cleaned in advance.
 * @returns Array of items representing folders and files of traversed folder top-down and excluding root folder.
 * Due to top-down, Folder items are ALWAYS in front of its children items.
 * Error key in the item will contain the error when there is a handleable error.
 */
// 这是一个异步生成器函数,用于遍历文件夹内容
export async function* traverseFolder(path: string): AsyncGenerator<TraverseItem, void, undefined> {
  // 获取加密的token用于认证
  const hashedToken = getStoredToken(path)

  // 生成一个请求任务,用于获取文件夹内容
  // i: 任务索引
  // path: 文件夹路径
  // next: 分页标记
  const genTask = async (i: number, path: string, next?: string) => {
    return {
      i,
      path,
      // 发起请求获取文件夹数据
      data: await onedriveRequest.get('',
        {
          headers: {
            ...(hashedToken ? { 'od-protected-token': hashedToken } : {})
          },
          params: {
            path,
            ...(next ? { next } : {}),
          },
        }
      ).catch(error => ({ i, path, error })),
    }
  }

  // 任务池,存放所有待处理的请求Promise
  let pool = [genTask(0, path)]

  // 缓存带分页的文件夹内容
  const buf: { [k: string]: TraverseItem[] } = {}

  // 只要任务池不为空就继续处理
  while (pool.filter(() => true).length > 0) {
    let info: { i: number; path: string; data: any }
    try {
      // 等待最快完成的任务
      info = await Promise.race(pool.filter(() => true))
    } catch (error: any) {
      const { i, path, error: innerError } = error
      // 处理4xx错误
      if (Math.floor(innerError.status / 100) === 4) {
        delete pool[i]
        yield {
          path,
          meta: {},
          isFolder: true,
          error: { status: innerError.status, message: innerError.message.error },
        }
        continue
      } else {
        throw error
      }
    }

    console.log('info', info)
    const { i, path, data: wrappedData } = info
    const data = wrappedData.data
    // 验证返回的是文件夹数据
    if (!data || !data.folder) {
      throw new Error('Path is not folder')
    }
    delete pool[i]

    // 处理文件夹内容,生成TraverseItem数组
    const items = data.folder.value.map((c: any) => {
      const p = `${path === '/' ? '' : path}/${encodeURIComponent(c.name)}`
      return { path: p, meta: c, isFolder: Boolean(c.folder) }
    }) as TraverseItem[]

    if (data.next) {
      // 如果有下一页,先缓存当前页内容
      buf[path] = (buf[path] ?? []).concat(items)

      // 添加下一页的请求任务
      const i = pool.length
      pool[i] = genTask(i, path, data.next)
    } else {
      // 没有下一页,合并所有分页内容
      const allItems = (buf[path] ?? []).concat(items)
      if (buf[path]) {
        delete buf[path]
      }

      // 对文件夹类型的项目,添加遍历其内容的任务
      allItems
        .filter(item => item.isFolder)
        .forEach(item => {
          const i = pool.length
          pool[i] = genTask(i, item.path)
        })
      // 返回处理好的内容
      yield* allItems
    }
  }
}
