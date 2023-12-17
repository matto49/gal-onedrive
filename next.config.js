const { i18n } = require('./next-i18next.config')

module.exports = {
  i18n,
  reactStrictMode: true,
  // Required by Next i18n with API routes, otherwise API routes 404 when fetching without trailing slash
  trailingSlash: true,
  webpack(config) {
    const fileLoaderRule = config.module.rules.find(rule => rule.test?.test?.('.svg'))
    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        // resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ['@svgr/webpack'],
      }
    )

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i

    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'shiraha.cn',
        port: '',
        pathname: '/favicon/**',
      },
      {
        protocol: 'https',
        hostname: 's3.bmp.ovh',
        port: '',
        pathname: '/imgs/**',
      },
    ],
  },
  rewrites() {
    return [
      {
        source: '/onedrive/:path*',
        destination: `${process.env.HOST}/onedrive/:path*`,
      },
    ]
  },
}
