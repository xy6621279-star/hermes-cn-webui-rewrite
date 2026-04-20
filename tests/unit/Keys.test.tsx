import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { Keys } from '@/app/pages/keys/Keys'

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

const mockKeysResponse = {
  keys: [
    {
      id: 'openai',
      name: 'OpenAI',
      key: 'OPENAI_API_KEY',
      value: 'sk-test-12345',
      masked: 'sk-••••••••45',
      hasKey: true,
      valid: true,
      url: 'https://platform.openai.com',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      key: 'ANTHROPIC_API_KEY',
      value: 'sk-ant-12345',
      masked: 'sk-•••••••45',
      hasKey: true,
      valid: true,
      url: 'https://console.anthropic.com',
    },
    {
      id: 'tavily',
      name: 'Tavily',
      key: 'TAVILY_API_KEY',
      value: '',
      masked: '未设置',
      hasKey: false,
      url: 'https://tavily.com',
    },
  ],
}

const mockConfirm = vi.fn()
global.confirm = mockConfirm

describe('Keys', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockConfirm.mockReset()
    mockConfirm.mockReturnValue(true)
  })

  it('shows loading spinner when fetching keys', () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}))
    renderWithProviders(<Keys />)
    expect(screen.queryByText('密钥管理')).toBeNull()
  })

  it('shows error when keys fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    renderWithProviders(<Keys />)
    await waitFor(() => {
      expect(screen.getByText(/获取密钥失败/)).toBeTruthy()
      expect(screen.getByText(/无法连接到服务器/)).toBeTruthy()
    })
  })

  it('renders page title and key cards', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockKeysResponse) })
    renderWithProviders(<Keys />)
    await waitFor(() => {
      expect(screen.getByText('密钥管理')).toBeTruthy()
      expect(screen.getByText('OpenAI')).toBeTruthy()
      expect(screen.getByText('Anthropic')).toBeTruthy()
      expect(screen.getByText('Tavily')).toBeTruthy()
      expect(screen.getByText('sk-••••••••45')).toBeTruthy()
    })
  })

  it('renders apply links for keys with urls', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockKeysResponse) })
    renderWithProviders(<Keys />)
    await waitFor(() => {
      expect(screen.getAllByText('申请').length).toBeGreaterThan(0)
    })
  })

  it('shows empty state when no keys', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ keys: [] }) })
    renderWithProviders(<Keys />)
    await waitFor(() => {
      expect(screen.getByText('暂无密钥配置')).toBeTruthy()
    })
  })

  it('toggles key visibility when show button clicked', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockKeysResponse) })
    renderWithProviders(<Keys />)
    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeTruthy()
    })
    await userEvent.click(screen.getAllByText(/显示/)[0])
    expect(screen.getByText('sk-test-12345')).toBeTruthy()
  })

  it('enters edit mode when edit button clicked and exits on cancel', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockKeysResponse) })
    renderWithProviders(<Keys />)
    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeTruthy()
    })
    await userEvent.click(screen.getAllByText(/编辑/)[0])
    expect(screen.getByText('保存')).toBeTruthy()
    await userEvent.click(screen.getByText('取消'))
    await waitFor(() => {
      expect(screen.queryByText('保存')).toBeNull()
    })
  })

  it('renders test actions for configured keys', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockKeysResponse) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) })
    renderWithProviders(<Keys />)
    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeTruthy()
    })
    expect(screen.getAllByText('测试').length).toBeGreaterThan(0)
  })

  it('calls test API when test button clicked', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockKeysResponse) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, message: 'OK' }) })
    renderWithProviders(<Keys />)
    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeTruthy()
    })
    await userEvent.click(screen.getAllByText('测试')[0])
    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith('/api/keys/test', expect.objectContaining({ method: 'POST' }))
      expect(screen.getByText('OK')).toBeTruthy()
    })
  })
})
