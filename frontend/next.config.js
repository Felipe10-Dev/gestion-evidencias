/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/proyectos/:projectId/equipos/nuevo',
        destination: '/proyectos/equipos/nuevo?projectId=:projectId',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
