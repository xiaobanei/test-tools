'use client';

import { useState, useCallback } from 'react';
import { Send, Clock, Copy, Check, Trash2, RotateCcw, Zap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  KeyValueEditor,
  createPair,
  type KeyValuePair,
} from '@/components/key-value-editor';

// HTTP methods with colors
const HTTP_METHODS = [
  { value: 'GET', color: 'text-green-500' },
  { value: 'POST', color: 'text-amber-500' },
  { value: 'PUT', color: 'text-blue-500' },
  { value: 'PATCH', color: 'text-purple-500' },
  { value: 'DELETE', color: 'text-red-500' },
  { value: 'HEAD', color: 'text-cyan-500' },
  { value: 'OPTIONS', color: 'text-gray-500' },
] as const;

type HttpMethod = (typeof HTTP_METHODS)[number]['value'];

interface RequestHistory {
  id: string;
  method: HttpMethod;
  url: string;
  status: number;
  duration: number;
  timestamp: number;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  isJson: boolean;
  duration: number;
}

const STATUS_COLORS: Record<string, string> = {
  '2': 'bg-green-500/15 text-green-400 border-green-500/30',
  '3': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  '4': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  '5': 'bg-red-500/15 text-red-400 border-red-500/30',
};

function getStatusColor(status: number): string {
  const firstDigit = String(status)[0];
  return STATUS_COLORS[firstDigit] || 'bg-gray-500/15 text-gray-400 border-gray-500/30';
}

export default function ApiTester() {
  // Request state
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<KeyValuePair[]>([createPair('Content-Type', 'application/json')]);
  const [params, setParams] = useState<KeyValuePair[]>([]);
  const [body, setBody] = useState('');

  // Response state
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  // Copy state
  const [copied, setCopied] = useState(false);

  const sendRequest = useCallback(async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Build headers object from enabled pairs
      const headerObj: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.enabled && h.key.trim()) {
          headerObj[h.key.trim()] = h.value;
        }
      });

      // Build params object from enabled pairs
      const paramObj: Record<string, string> = {};
      params.forEach((p) => {
        if (p.enabled && p.key.trim()) {
          paramObj[p.key.trim()] = p.value;
        }
      });

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          method,
          headers: headerObj,
          params: paramObj,
          body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      const responseData: ResponseData = {
        status: data.status,
        statusText: data.statusText,
        headers: data.headers,
        body: data.body,
        isJson: data.isJson,
        duration: data.duration,
      };

      setResponse(responseData);

      // Add to history
      const historyItem: RequestHistory = {
        id: Date.now().toString(),
        method,
        url: url.trim(),
        status: data.status,
        duration: data.duration,
        timestamp: Date.now(),
      };
      setHistory((prev) => [historyItem, ...prev].slice(0, 50));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '请求失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [url, method, headers, params, body]);

  const copyResponse = useCallback(async () => {
    if (!response?.body) return;
    await navigator.clipboard.writeText(response.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [response]);

  const loadHistory = useCallback((item: RequestHistory) => {
    setMethod(item.method);
    setUrl(item.url);
  }, []);

  const clearAll = useCallback(() => {
    setUrl('');
    setMethod('GET');
    setHeaders([createPair('Content-Type', 'application/json')]);
    setParams([]);
    setBody('');
    setResponse(null);
    setError(null);
  }, []);

  const formatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(body);
      setBody(JSON.stringify(parsed, null, 2));
    } catch {
      // ignore
    }
  }, [body]);

  const currentMethodColor = HTTP_METHODS.find((m) => m.value === method)?.color || 'text-foreground';

  return (
    <div className="flex h-screen bg-background text-foreground dark">
      {/* History Sidebar */}
      {showHistory && (
        <aside className="w-64 shrink-0 border-r border-border flex flex-col bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">历史记录</h2>
            <span className="text-xs text-muted-foreground">{history.length} 条</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  暂无请求记录
                </div>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadHistory(item)}
                    className="w-full text-left px-3 py-2.5 rounded-md hover:bg-accent/50 transition-colors mb-0.5"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-bold ${
                          HTTP_METHODS.find((m) => m.value === item.method)?.color
                        }`}
                      >
                        {item.method}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${getStatusColor(item.status)}`}
                      >
                        {item.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {item.duration}ms
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate font-mono">
                      {item.url}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Zap className="size-5 text-primary" />
            <h1 className="text-base font-semibold tracking-tight">API Tester</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs"
            >
              {showHistory ? '隐藏历史' : '显示历史'}
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">
              <RotateCcw className="size-3.5" />
              重置
            </Button>
          </div>
        </header>

        {/* URL Bar */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-card">
          <Select value={method} onValueChange={(v) => setMethod(v as HttpMethod)}>
            <SelectTrigger className="w-28 h-10 font-bold text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HTTP_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  <span className={m.color + ' font-bold'}>{m.value}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入请求 URL，如 https://jsonplaceholder.typicode.com/posts"
            className="h-10 font-mono text-sm flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendRequest();
            }}
          />
          <Button
            onClick={sendRequest}
            disabled={loading || !url.trim()}
            className="h-10 px-6 gap-2"
          >
            {loading ? (
              <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {loading ? '发送中...' : '发送'}
          </Button>
        </div>

        {/* Request/Response Panels */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Request Config */}
          <div className="h-[45%] border-b border-border flex flex-col min-h-0">
            <Tabs defaultValue="params" className="flex flex-col h-full">
              <div className="px-6 pt-3 pb-0">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="params" className="text-xs">
                    Params
                    {params.filter((p) => p.enabled && p.key.trim()).length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                        {params.filter((p) => p.enabled && p.key.trim()).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="headers" className="text-xs">
                    Headers
                    {headers.filter((h) => h.enabled && h.key.trim()).length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                        {headers.filter((h) => h.enabled && h.key.trim()).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="body" className="text-xs">
                    Body
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 min-h-0 px-6 py-3 overflow-auto">
                <TabsContent value="params" className="mt-0">
                  <KeyValueEditor
                    pairs={params}
                    onChange={setParams}
                    keyPlaceholder="参数名"
                    valuePlaceholder="参数值"
                  />
                </TabsContent>
                <TabsContent value="headers" className="mt-0">
                  <KeyValueEditor
                    pairs={headers}
                    onChange={setHeaders}
                    keyPlaceholder="Header 名"
                    valuePlaceholder="Header 值"
                  />
                </TabsContent>
                <TabsContent value="body" className="mt-0 h-full flex flex-col">
                  {method === 'GET' || method === 'HEAD' ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      <span className={currentMethodColor + ' font-bold mr-2'}>{method}</span>
                      请求不支持 Body
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={formatJson}
                          className="text-xs text-muted-foreground"
                        >
                          <Plus className="size-3" />
                          格式化 JSON
                        </Button>
                      </div>
                      <Textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder='{"key": "value"}'
                        className="flex-1 min-h-[120px] font-mono text-xs leading-relaxed resize-none"
                      />
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Response Panel */}
          <div className="flex-1 flex flex-col min-h-0">
            {error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="text-4xl">⚠️</div>
                  <p className="text-destructive font-medium">请求失败</p>
                  <p className="text-sm text-muted-foreground max-w-md">{error}</p>
                </div>
              </div>
            ) : response ? (
              <div className="flex flex-col h-full">
                {/* Response Status Bar */}
                <div className="flex items-center gap-3 px-6 py-2.5 border-b border-border bg-card">
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold px-2.5 py-0.5 ${getStatusColor(response.status)}`}
                  >
                    {response.status} {response.statusText}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {response.duration}ms
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="text-xs text-muted-foreground">
                    {response.isJson ? 'JSON' : 'Text'}
                  </div>
                  <div className="ml-auto">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={copyResponse}
                      className="text-muted-foreground"
                    >
                      {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                    </Button>
                  </div>
                </div>
                {/* Response Content */}
                <Tabs defaultValue="body" className="flex flex-col flex-1 min-h-0">
                  <div className="px-6 pt-2 pb-0">
                    <TabsList className="bg-muted/50">
                      <TabsTrigger value="body" className="text-xs">
                        Body
                      </TabsTrigger>
                      <TabsTrigger value="headers" className="text-xs">
                        Headers
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <div className="flex-1 min-h-0 px-6 py-3">
                    <TabsContent value="body" className="mt-0 h-full">
                      <ScrollArea className="h-full">
                        <pre className="text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap break-all">
                          {response.body || '(空响应)'}
                        </pre>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="headers" className="mt-0">
                      <ScrollArea className="h-full">
                        <div className="space-y-1">
                          {Object.entries(response.headers).map(([key, value]) => (
                            <div key={key} className="flex gap-3 text-xs font-mono py-1">
                              <span className="text-primary font-medium min-w-[180px] shrink-0">
                                {key}
                              </span>
                              <span className="text-muted-foreground break-all">{value}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3 text-muted-foreground">
                  <div className="text-5xl opacity-20">
                    <Send className="size-12 mx-auto" />
                  </div>
                  <p className="text-sm">输入 URL 并点击发送，开始测试接口</p>
                  <p className="text-xs text-muted-foreground/60">
                    支持 GET / POST / PUT / PATCH / DELETE / HEAD / OPTIONS
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
