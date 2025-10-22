import useSWRInfinite from 'swr/infinite'

import type { OdAPIResponse } from '../types'

import { onedriveRequest } from './api'
import { getStoredToken } from './protectedRouteHandler'

// Common axios fetch function for use with useSWR
export async function fetchWithSWR([url, token]: [url: string, token?: string]): Promise<any> {
  return await onedriveRequest.get(url, {
    headers: {
      ...(token ? { 'od-protected-token': token } : {}),
    },
  })
}

/**
 * Paging with useSWRInfinite + protected token support
 * @param path Current query directory path
 * @returns useSWRInfinite API
 */
export function useProtectedSWRInfinite(path: string = '') {
  const hashedToken = getStoredToken(path)

  /**
   * Next page infinite loading for useSWR
   * @param pageIdx The index of this paging collection
   * @param prevPageData Previous page information
   * @param path Directory path
   * @returns API to the next page
   */

  function getNextKey(pageIndex: number, previousPageData: OdAPIResponse): (string | null)[] | null {
    if (previousPageData) previousPageData = previousPageData
    // Reached the end of the collection
    if (previousPageData && !previousPageData.folder) return null
    // First page with no prevPageData
    if (pageIndex === 0) return [`/?path=${path}`, hashedToken]
    // Add nextPage token to API endpoint
    return [`/?path=${path}&next=${previousPageData.next}`, hashedToken]
  }

  // Disable auto-revalidate, these options are equivalent to useSWRImmutable
  // https://swr.vercel.app/docs/revalidation#disable-automatic-revalidations
  const revalidationOptions = {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  }
  // getNextKey函数会接收到pageIndex和previousPageData两个参数
  // pageIndex: 当前页码索引,从0开始
  // previousPageData: 上一页的数据
  // getNextKey内部会使用传入的path构建请求URL
  // path是通过useProtectedSWRInfinite函数的参数传入的
  const data = useSWRInfinite(
    (pageIndex, previousPageData) => getNextKey(pageIndex, previousPageData),
    fetchWithSWR,
    revalidationOptions
  )

  return data
}
