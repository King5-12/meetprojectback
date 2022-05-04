const Koa = require('koa');

const app = new Koa();
const port = process.env.PORT || 8080;


const server = require('http').createServer(app.callback())
const io = require('socket.io')(server)

//监听connect事件
io.on('connection', socket => {
    socket.emit('open');//通知客户端已连接
    console.log('connected');

    //监听disconnect事件
    socket.on('disconnect', () => {
        console.log('disconnect')
    })
});

server.listen(port, () => {
    console.log(`web静态服务已启动:${port}`);
});



