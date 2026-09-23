import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { search } = new URL(request.url);
    const urlParamIndex = search.indexOf('url=');
    if (urlParamIndex === -1) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    const rawUrl = search.substring(urlParamIndex + 4);
    const targetUrl = decodeURIComponent(rawUrl);

    const upstreamResponse = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: new URL(targetUrl).origin,
      },
      cache: 'force-cache',
    });

    if (!upstreamResponse.ok) {
      return new NextResponse(`Upstream failed: ${upstreamResponse.statusText}`, {
        status: upstreamResponse.status,
      });
    }

    const contentType = upstreamResponse.headers.get('content-type') || 'image/jpeg';
    const buffer = await upstreamResponse.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return new NextResponse('Internal Proxy Error', { status: 500 });
  }
}