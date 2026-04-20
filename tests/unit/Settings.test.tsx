import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { Settings } from '@/app/pages/settings/Settings'

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

const mockSystemInfo = {
  webui_version: '2.2.0',
  agent_version: '0.8.0',
  hermes_home: '/Users/user/.hermes',
  node_version: 'v20.0.0',
  platform: 'darwin',
  theme: 'dark',
  language: 'zh',
}

describe('Settings', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('Loading state', () => {
    it('shows loading spinner when fetching', () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))
      renderWithProviders(<Settings />)
      expect(screen.queryByText('设置')).toBeNull()
    })
  })

  describe('Error state', () => {
    it('shows error when system info fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      renderWithProviders(<Settings />)
      await waitFor(() => {
        expect(screen.getByText(/获取系统信息失败/)).toBeTruthy()
      })
    })

    it('shows retry button on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      renderWithProviders(<Settings />)
      await waitFor(() => {
        expect(screen.getByText('重试')).toBeTruthy()
      })
    })
  })

  describe('Page structure', () => {
    it('renders settings page title', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSystemInfo) })
      renderWithProviders(<Settings />)
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: '设置' })).toBeTruthy()
      })
    })

    it('renders theme section', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSystemInfo) })
      renderWithProviders(<Settings />)
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 3, name: '主题' })).toBeTruthy()
      })
    })

    it('renders backup actions', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSystemInfo) })
      renderWithProviders(<Settings />)
      await waitFor(() => {
        expect(screen.getByText('导出备份')).toBeTruthy()
        expect(screen.getByText('导入备份')).toBeTruthy()
      })
    })

    it('renders about section system info', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSystemInfo) })
      renderWithProviders(<Settings />)
      await waitFor(() => {
        expect(screen.getByText('WebUI 版本')).toBeTruthy()
        expect(screen.getByText('2.2.0')).toBeTruthy()
        expect(screen.getByText('Agent 版本')).toBeTruthy()
      })
    })
  })
})
