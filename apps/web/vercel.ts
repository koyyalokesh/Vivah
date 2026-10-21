function getApiOrigin() {
  const configuredOrigin = process.env.VIVAH_API_ORIGIN?.trim();

  if (!configuredOrigin) {
    throw new Error(
      'VIVAH_API_ORIGIN is required. Set it to the HTTPS origin of the Vivah API Vercel project.',
    );
  }

  let url: URL;
  try {
    url = new URL(configuredOrigin);
  } catch {
    throw new Error('VIVAH_API_ORIGIN must be a valid absolute URL.');
  }

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'VIVAH_API_ORIGIN must be an HTTPS origin without credentials, a path, query parameters or a fragment.',
    );
  }

  return url.origin;
}

const apiOrigin = getApiOrigin();

export const config = {
  framework: 'vite',
  installCommand: 'npm install --production=false',
  rewrites: [
    {
      source: '/api/:path*',
      destination: `${apiOrigin}/api/:path*`,
    },
    {
      source: '/(.*)',
      destination: '/index.html',
    },
  ],
  headers: [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store' },
        { key: 'x-vercel-enable-rewrite-caching', value: '0' },
      ],
    },
  ],
};
