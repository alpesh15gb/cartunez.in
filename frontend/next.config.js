const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ["src"],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      // Old/dead paths → real routes so nothing 404s at go-live
      { source: "/:lang/customer-service", destination: "/:lang/support", permanent: true },
      { source: "/:lang/contact", destination: "/:lang/support", permanent: true },
      { source: "/:lang/wishlist", destination: "/:lang/account", permanent: true },
      { source: "/:lang/content/:page", destination: "/:lang/:page", permanent: true },
    ]
  },
  images: {
    // Medusa v1 serves relative /uploads/ URLs; next/image's optimizer
    // cannot resolve them against its own origin and returns 400.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}
module.exports = nextConfig
