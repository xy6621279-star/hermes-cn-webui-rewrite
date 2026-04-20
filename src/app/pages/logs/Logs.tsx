import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, FileText, Loader2, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import type { LogsResponse } from '@/lib/api'

const LEVELS = ['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG']

export function Logs() {
  const [file, setFile] = useState('')
  const [lines, setLines] = useState(200)
  const [level, setLevel] = useState('ALL')
  const [component, setComponent] = useState('all')

  const { data, isLoading, error, refetch, isFetching } = useQuery<LogsResponse>({
    queryKey: ['logs', file, lines, level, component],
    queryFn: () => api.getLogs({ file: file || undefined, lines, level, component }),
    refetchInterval: 15000,
  })

  const logLines = data?.lines || []
  const activeFile = data?.file || '自动选择最新日志'

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">获取日志失败</span>
        </div>
        <button
          onClick={() => refetch()}
          className="mt-3 flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <RefreshCw className="h-4 w-4" />
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">日志查看</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            当前文件：{activeFile}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">日志文件</span>
          <input
            type="text"
            value={file}
            onChange={(e) => setFile(e.target.value)}
            placeholder="留空自动选择"
            className="w-full rounded border border-input bg-background px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">级别</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded border border-input bg-background px-3 py-2"
          >
            {LEVELS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">组件筛选</span>
          <input
            type="text"
            value={component === 'all' ? '' : component}
            onChange={(e) => setComponent(e.target.value.trim() || 'all')}
            placeholder="如 gateway / browser"
            className="w-full rounded border border-input bg-background px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">行数</span>
          <input
            type="number"
            min={10}
            max={1000}
            step={10}
            value={lines}
            onChange={(e) => setLines(Math.max(10, Math.min(1000, Number(e.target.value) || 200)))}
            className="w-full rounded border border-input bg-background px-3 py-2"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">显示行数</p>
          <p className="text-2xl font-bold">{logLines.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">筛选级别</p>
          <p className="text-2xl font-bold">{level}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">组件</p>
          <p className="text-2xl font-bold">{component === 'all' ? '全部' : component}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          日志输出
        </div>
        <div className="max-h-[560px] overflow-auto bg-black/90 p-4 font-mono text-xs leading-6 text-green-400">
          {logLines.length === 0 ? (
            <div className="text-muted-foreground">暂无日志内容</div>
          ) : (
            logLines.map((line, index) => (
              <div key={`${index}-${line.slice(0, 20)}`} className="whitespace-pre-wrap break-all">
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
