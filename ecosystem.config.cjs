module.exports = {
  apps: [
    {
      name: 'evalplus-api',
      script: 'npm',
      args: 'run dev',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      autorestart: true,
      max_memory_restart: '500M',
      watch: false
    },
    {
      name: 'prisma-studio',
      script: 'npx',
      args: 'prisma studio --port 5555 --browser none',
      instances: 1,
      exec_mode: 'fork',
      cwd: './',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/prisma-studio-err.log',
      out_file: './logs/prisma-studio-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      autorestart: true,
      max_memory_restart: '300M',
      watch: false,
      // Reiniciar si falla
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
