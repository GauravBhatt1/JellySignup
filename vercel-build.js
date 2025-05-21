// This script runs during the Vercel build process
// It helps configure the application for deployment

console.log('Starting Vercel build process');

// Environment variable check
const requiredEnvVars = ['JELLYFIN_API_KEY', 'JELLYFIN_SERVER_URL', 'TMDB_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn('⚠️ Missing environment variables:', missingEnvVars.join(', '));
  console.warn('The application may not function correctly without these variables.');
} else {
  console.log('✅ All required environment variables found');
}

// Build process continues
console.log('Running build script...');

// The actual build command will be executed by Vercel after this script runs