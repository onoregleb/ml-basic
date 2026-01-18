/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Включаем оптимизации для production
  reactStrictMode: true,
  swcMinify: true,
  
  // Оптимизации для слабого железа
  experimental: {
    optimizeCss: true,
  },
  
  // Сжатие
  compress: true,
  
  // Оптимизация сборки
  webpack: (config, { dev, isServer }) => {
    // Оптимизации только для production
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          plotly: {
            test: /[\\/]node_modules[\\/](plotly\.js|react-plotly\.js)[\\/]/,
            name: 'plotly',
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }
    return config;
  },
  
  // Оптимизация статических файлов
  poweredByHeader: false,
  
  // Генерация статических страниц где возможно
  output: 'standalone',

  // Proxy API requests from frontend to backend:
  // client code can call /api/... regardless of deployment host.
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://localhost:8000'
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
