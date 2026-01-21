{
    "apps": [
        {
            "name": "keyauth-backend",
            "script": "dist/main.js",
            "instances": 2,
            "exec_mode": "cluster",
            "watch": false,
            "max_memory_restart": "500M",
            "env": {
                "NODE_ENV": "production",
                "PORT": 3000
            },
            "error_file": "/var/log/pm2/keyauth-backend-error.log",
            "out_file": "/var/log/pm2/keyauth-backend-out.log",
            "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
            "merge_logs": true,
            "autorestart": true,
            "max_restarts": 10,
            "min_uptime": "10s",
            "listen_timeout": 3000,
            "kill_timeout": 5000
        }
    ]
}
