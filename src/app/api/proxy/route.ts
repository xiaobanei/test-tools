import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, method, headers, body: reqBody, params } = body as {
      url: string;
      method: string;
      headers?: Record<string, string>;
      body?: string;
      params?: Record<string, string>;
    };

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Build URL with query params
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (key && value) {
          targetUrl.searchParams.append(key, value);
        }
      });
    }

    // Prepare headers - filter out browser-specific headers
    const fetchHeaders: Record<string, string> = {};
    if (headers && typeof headers === 'object') {
      Object.entries(headers).forEach(([key, value]) => {
        if (key && value) {
          fetchHeaders[key] = value;
        }
      });
    }

    // Build fetch options
    const fetchOptions: RequestInit = {
      method: method || 'GET',
      headers: fetchHeaders,
    };

    // Add body for non-GET requests
    if (method !== 'GET' && method !== 'HEAD' && reqBody) {
      fetchOptions.body = reqBody;
      // Auto set content-type if not provided
      if (!fetchHeaders['Content-Type'] && !fetchHeaders['content-type']) {
        fetchHeaders['Content-Type'] = 'application/json';
      }
    }

    const startTime = Date.now();

    const response = await fetch(targetUrl.toString(), {
      ...fetchOptions,
      // @ts-expect-error - timeout is supported in Node.js fetch
      timeout: 30000,
    }).catch((err: Error) => {
      throw new Error(`Fetch failed: ${err.message}`);
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Collect response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Get response body
    const contentType = response.headers.get('content-type') || '';
    let responseBody: string;
    let isJson = false;

    try {
      responseBody = await response.text();
      // Try to parse and re-format JSON
      if (
        contentType.includes('application/json') ||
        responseBody.trim().startsWith('{') ||
        responseBody.trim().startsWith('[')
      ) {
        const parsed = JSON.parse(responseBody);
        responseBody = JSON.stringify(parsed, null, 2);
        isJson = true;
      }
    } catch {
      // If text() fails, return empty
      responseBody = '';
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      isJson,
      duration,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
