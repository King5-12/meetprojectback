const defaultOption = {
    type: "json",
    successCode: 200,
    failCode: 500,
}
function routerResponse(option = defaultOption) {
    return async function (ctx, next) {
        ctx.success = function (data, msg = '请求成功') {
            ctx.type = option.type
            ctx.body = {
                code: option.successCode,
                msg: msg,
                data: data
            }
        }

        ctx.fail = function (msg = '服务器错误', code = 500) {
            ctx.type = option.type || 'json'
            ctx.body = {
                code: code || option.failCode,
                msg: msg
            }
            console.log(ctx.body)
        }
        await next()

    }

}
module.exports = routerResponse;
