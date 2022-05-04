const Koa = require('koa');

const app = new Koa();
const port = process.env.PORT || 8080;

const router = require('./router');
const routerResponse = require('./middleware/routerResponse')
const cors = require('./middleware/cors')

app.use(cors());
app.use(routerResponse())
app.use(router.routes(), router.allowedMethods());

app.listen(port, () => {
    console.log(`web静态服务已启动:${port}`);
});
