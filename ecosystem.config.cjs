module.exports = {
  apps: [{
    name: 'rise-confirm-postman',
    script: 'node',
    args: '.next/standalone/apps/postman-like/server.js',
    cwd: './',
    env: {
      NODE_ENV: 'production',
      PORT: '10012'
    }
  }]
}
