const app = require('express')();
const setupTracingMiddleware = require('./config/setupTracingMiddleware');
const setupWebdavMiddleware = require('./config/setupWebdavMiddleware');
const setupEventEmitter = require('./config/setupEventEmitter');
const setupPermissionsApi = require('./config/setupPermissionsApi');

// Configuration parameters
const defaultConfig = {
    "rootPath": "/data",
    "basePath":"/api/storage/webdav",
    "auth": {
        "enabled": true
    },
    "tracing": {
        "enabled": true,
        "zipkinUrl": "",
        "samplingRate": 0.01
    },
    "rabbitmq": {},
    "urls":{
        "collections": ""
    }
}

// Read external configuration file
let configuration;
if(process.env.CONFIG_FILE) {
    configuration = {...defaultConfig, ...require(process.env.CONFIG_FILE)}
} else {
    configuration = defaultConfig;
}

const connectionSettings = {
    name: 'default',
    user: 'client',
    pass: 'client',
    host: 'localhost'
}

// Respond to / anonymously to allow for health checks
app.get('/', (req, res, next) => req.get('probe') ? res.send('Hi, I\'m Titan!').end() : next());

if(configuration.tracing.enabled) setupTracingMiddleware(app, configuration.tracing);
const permissionsApi = setupPermissionsApi(configuration);
setupWebdavMiddleware(app, configuration, permissionsApi, server => setupEventEmitter(server, configuration.rabbitmq));

module.exports = app;
