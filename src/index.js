const Koa = require('koa');
const fs = require('fs')
const path = require('path')

const app = new Koa();
const port = process.env.PORT || 8080;


const server = require('http').createServer(app.callback())
const io = require('socket.io')(server)

const { log, INFO, ERROR } = require("./log");
const { makeSensitiveMap, filterSensitiveWord } = require("./utils/dirty");

let dirtyMap = null


fs.readFile(path.join(__dirname, './utils/dirty.txt'), 'utf-8', function (err, data) {
    if (err) {
        console.error(err);
        return
    }
    console.log(data, 'dirtydata')
    const dirtyList = data.split("\n")
    console.log(dirtyList, 'dirtyList')
    dirtyMap = makeSensitiveMap(dirtyList)
});

const { getUserByUsername, insertUser } = require("./database/sqlite3");

const {
    CONNECTION,
    DISCONNECT,
    LOGIN,
    REGISTER,
    LEAVE,
    JOIN,
    MSG,
} = require("./socket-types");

const { Response } = require("./utils/response");

const userToSocket = new Map();
const roomToUser = new Map();


// socket.emit() ：向建立该连接的客户端广播
// socket.broadcast.emit() ：向除去建立该连接的客户端的所有客户端广播
// io.sockets.emit() ：向所有客户端广播，等同于上面两个的和

const room = "room"

//监听connect事件
io.on(CONNECTION, socket => {
    console.log("connection --->", socket.id);
    let username;

    // 用户登录
    // 用户登录之后便会加入到一个特定的房间里
    // 我们需要保存该用户对应的socketid
    // 这样之后如果用户之间需要通信，使用该id查找对应的socket
    // 然后emit即可 username => socketid => socket => socket.emit
    socket.on(LOGIN, (data) => {
        // 解构并重命名
        const { username: username_, password: password_ } = data;
        getUserByUsername(username_)
            .then((user) => {
                if (user === undefined) {
                    socket.emit(LOGIN, Response(-1, {}, "用户不存在"));
                    return;
                }
                if (user.password === password_) {
                    // 先要进行检查是否已经登录了
                    // 如果已经存在该用户, 不能再次登录
                    if (userToSocket.has(username_)) {
                        socket.emit(LOGIN, Response(-1, {}, "用户已登录"));
                        return;
                    }

                    // 赋值
                    username = username_;

                    // 加入房间
                    socket.join(room);

                    // 将用户加入到room中
                    if (roomToUser.has(room)) {
                        roomToUser
                            .get(room)
                            .push({ username: username_ });
                    } else {
                        roomToUser.set(room, [
                            { username: username_ },
                        ]);
                    }

                    // 设置用户对应的socket
                    userToSocket.set(username_, socket.id);

                    // 通知客户端登录成功
                    socket.emit(
                        LOGIN,
                        Response(
                            200,
                            { username: username_, },
                            `欢迎登录 ${username_}`
                        )
                    );

                    // 告诉房间里的其他人
                    socket
                        .to(room)
                        .emit(JOIN, Response(200, username_, null));


                    return;
                } else {
                    // 通知用户密码输入错误
                    socket.emit(LOGIN, Response(-1, {}, "密码输入错误"));

                    log(INFO, `${user.username} password error`);
                    return;
                }
            })
            .catch((err) => {
                log(ERROR, err);
            });
    });

    // 用户注册
    socket.on(REGISTER, (data) => {
        const { username, password } = data;
        insertUser(username, password)
            .then((res) => {
                console.log("res: ", res);
                if (res.code === 200) {
                    socket.emit(REGISTER, Response(200, {}, "注册成功"));
                } else {
                    socket.emit(
                        REGISTER,
                        Response(-1, {}, "用户名已经被注册")
                    );
                }
            })
            .catch((err) => {
                log(ERROR, err);
            });
    });


    //监听disconnect事件
    socket.on(DISCONNECT, () => {
        console.log("disconnect: ", socket.id);
        log(INFO, `${username} disconnect`);

        console.info("now map: ", userToSocket);
        userToSocket.delete(username);
        socket.leave(room);
        // 对其他用户进行广播
        socket.to(room).emit(LEAVE, Response(200, username, null));
    })

    // 用户发送的文本信息
    // 用户必须提供对应的发送方，以及信息
    // 通过用户名我们可以查到socket，进而emit发送消息
    socket.on(MSG, (req) => {
        const { data } = req;
        console.log(data.user, data.msg);
        const dirtyInfo = filterSensitiveWord(data.msg, dirtyMap)
        console.log("dirtyInfo", dirtyInfo);

        if (dirtyInfo.flag) {
            data.msg = data.msg.replace(dirtyInfo.sensitiveWord, "*".repeat(dirtyInfo.sensitiveWord.length))
        }
        socket
            .to(room)
            .emit(MSG, Response(200, { ...data }, null));
    });
});

server.listen(port, () => {
    console.log(`web静态服务已启动:${port}`);
});



