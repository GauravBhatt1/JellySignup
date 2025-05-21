// Vercel configuration for deployment
module.exports = {
  // Ensure the build process works correctly
  build: {
    env: {
      NODE_ENV: 'production',
    },
  },
  // Route configuration
  routes: [
    { src: '/api/(.*)', dest: '/server/index.ts' },
    { src: '/(.*)', dest: '/server/index.ts' },
  ],
};