const HUB_ENDPOINTS = [
  'https://pubsubhubbub.appspot.com/',
  'https://websub.superfeedr.com/',
]

const FEED_URLS = [
  'https://audiomatome.com/rss.xml',
  'https://audiomatome.com/en/rss.xml',
]

type PingResult = {
  hub: string
  status: number
}

type Environment = {
  WEBSUB_PING_SECRET?: string
}

export const onRequest = async ({
  request,
  env,
}: {
  request: Request
  env: Environment
}): Promise<Response> => {
  if (request.method !== 'POST') {
    return new Response('method not allowed', { status: 405 })
  }

  const expectedSecret = env.WEBSUB_PING_SECRET
  if (expectedSecret) {
    const providedSecret =
      request.headers.get('x-websub-secret') ?? request.headers.get('authorization')

    if (providedSecret !== expectedSecret) {
      return new Response('unauthorized', { status: 401 })
    }
  }

  const published: PingResult[] = []

  for (const hub of HUB_ENDPOINTS) {
    const body = new URLSearchParams()
    body.append('hub.mode', 'publish')
    FEED_URLS.forEach((url) => body.append('hub.url', url))

    const response = await fetch(hub, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    if (!response.ok) {
      const errorPayload = {
        error: `failed to publish to ${hub}: ${response.status} ${response.statusText}`,
        published,
      }

      return new Response(JSON.stringify(errorPayload, null, 2), {
        status: 502,
        headers: {
          'content-type': 'application/json',
        },
      })
    }

    published.push({ hub, status: response.status })
  }

  return new Response(JSON.stringify({ status: 'ok', published }, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
  })
}
