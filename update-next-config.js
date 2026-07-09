const fs = require('fs');

const configPath = './next.config.js';
let config = fs.readFileSync(configPath, 'utf8');

// Check if images config already exists
if (!config.includes('images: {')) {
  config = config.replace('eslint: {', `images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xyl-images.*.workers.dev',
      },
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  eslint: {`);
  fs.writeFileSync(configPath, config);
  console.log('Updated next.config.js');
}
