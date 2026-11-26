import { isIP } from 'node:net'

export const localWebHosts = ['localhost', '127.0.0.1', '[::1]']

function address(value: string) {
  const host = value
    .trim()
    .toLowerCase()
    .replace(/^\[(.*)\]$/, '$1')
  if (host !== 'localhost' && !isIP(host)) {
    throw new Error('Web 地址必须为 IP 地址或 localhost')
  }
  return host
}

export function webAccess(host = '127.0.0.1', allowed = '') {
  const hostname = address(host)
  const allowedHosts = allowed
    .split(',')
    .filter((item) => item.trim())
    .map((item) => {
      const value = address(item)
      if (value === '0.0.0.0' || value === '::') {
        throw new Error('WEB_ALLOWED_HOSTS 必须填写实际访问 IP，不能填写通配监听地址')
      }
      return isIP(value) === 6 ? `[${value}]` : value
    })
  if (hostname === '0.0.0.0' || hostname === '::') {
    if (!allowedHosts.length) {
      throw new Error('局域网监听需同时设置 WEB_ALLOWED_HOSTS，例如 10.10.1.12')
    }
  } else {
    allowedHosts.push(isIP(hostname) === 6 ? `[${hostname}]` : hostname)
  }
  return { hostname, allowedHosts: [...new Set([...localWebHosts, ...allowedHosts])] }
}
