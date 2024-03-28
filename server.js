const http = require('http')
const app = require('./app.js')
const server = http.createServer(app)

const cluster = require('cluster')
const os = require('os')
const cpu = os.cpus().length

// console.log(cpu)
if (cluster.isPrimary) {
    for (i = 0; i < cpu; i++) {
        cluster.fork()
    }
}
else {
    server.listen(3000, () => {
        console.log(`server is running ${process.pid}`);
    })
}

