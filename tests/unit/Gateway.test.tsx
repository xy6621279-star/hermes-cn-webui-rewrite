import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { Gateway } from '@/app/pages/gateway/Gateway'

const mockFetch = vi.fn()
global.fetch = mockFetch

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 0 },
    mutations: { retry: false },
  },
})

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

const mockGatewayRunning = {
  platforms: [
    { id: 'weixin', name: '微信', icon: '💚', enabled: true, status: 'online', has_webhook: false, config: { token: 'x' } },
    { id: 'feishu', name: '飞书', icon: '📮', enabled: false, status: 'offline', has_webhook: true, config: null },
  ],
  gateway_running: true,
  pid: 12345,
}

const mockGatewayStopped = {
  platforms: [
    { id: 'weixin', name: '微信', icon: '💚', enabled: false, status: 'configured', has_webhook: false, config: null },
  ],
  gateway_running: false,
  pid: null,
}

describe('Gateway', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockImplementation(() => new Promise(() => {}))
  })

  it('shows loading when fetching gateway status', () => {
    renderWithProviders(<Gateway />)
    expect(screen.queryByText('消息网关')).toBeNull()
  })

  it('shows error when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    renderWithProviders(<Gateway />)
    await waitFor(() => {
      expect(screen.getByText(/获取网关状态失败/)).toBeTruthy()
    })
  })

  it('renders running state with pid and stop/restart actions', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGatewayRunning) })
    renderWithProviders(<Gateway />)
    await waitFor(() => {
      expect(screen.getByText('消息网关')).toBeTruthy()
      expect(screen.getByText(/PID:/)).toBeTruthy()
      expect(screen.getByText('停止')).toBeTruthy()
      expect(screen.getByText('热重启')).toBeTruthy()
    })
  })

  it('renders stopped state with start action', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGatewayStopped) })
    renderWithProviders(<Gateway />)
    await waitFor(() => {
      expect(screen.getByText('已停止')).toBeTruthy()
      expect(screen.getByText('启动')).toBeTruthy()
    })
  })

  it('renders current platform cards from registry', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGatewayRunning) })
    renderWithProviders(<Gateway />)
    await waitFor(() => {
      expect(screen.getByText('微信')).toBeTruthy()
      expect(screen.getByText('飞书')).toBeTruthy()
      expect(screen.getAllByText(/扫码登录|重新绑定/).length).toBeGreaterThan(0)
    })
  })
})
