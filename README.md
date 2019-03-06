# Pomment Webhook Telegram

Pomment 的 Telegram 机器人服务。

## 部署

1. 运行 `npm install -g pomment-webhook-telegram` 安装本包
2. 运行 `pomment-telegram-config init`，将示例配置文件复制到你当前的工作目录下
3. 编辑配置文件（请注意下面的注释仅供参考，不要直接复制过去。JSON 不支持注释！）

```javascript
{
    // 你的 Telegram Bot Token。你可以从 BotFather 获取一个
    "token": "REPLACE WITH YOUR ACTUAL TOKEN",

    /*
     * 允许使用该 Bot 的 Chat ID。出于安全考虑，你只能设置一个允许的 Chat ID。如果需要多人管理，请建立群组
     * 你可以这样快速设置该值：
     * 1. 将配置文件的其它字段填好
     * 2. 运行 pomment-telegram-config chatid [你的配置文件位置]
     * 3. 随后，程序会提醒你在想要允许使用 Bot 的 Chat 执行特定的命令。例如：
     *    Now, send /verify a4c2d1cf to the bot on the target chat.
     *    在想要允许使用 Bot 的 Chat 执行程序要求你执行的命令，不一会儿，允许的 Chat ID 就设置为你想要的了
     */
    "allowedChatID": null,

    // Webhook 配置
    "webhookReceiver": {
        // 面向 Telegram 的 Webhook 服务器配置。仅支持监听 127.0.0.1，如果需要外网访问，请使用 nginx 等进行反代
        "telegram": {
            // 请求地址别名。如果设置为 webhook_telegram，则请求地址为 `https://example.com/webhook_telegram`
            "name": "webhook_telegram",
            // 服务器使用的端口
            "port": 7001
        },
        // 面向 Pomment 的 Webhook 服务器配置
        "pomment": {
            "name": "webhook_telegram_pomment",
            "port": 7002
        }
    },

    // 代理设置
    "proxy": {
        // 是否使用代理
        "enabled": false,

        // 代理服务器地址。目前仅支持 socks5 协议
        "address": "socks://127.0.0.1:1080"
    },

    // （可选）用于快速回复的关系列表文件位置。如果不指定，则放置在 $HOME/.pomment_telegram/你的 Token.json
    "indexFile": null,

    // Pomment 服务端的 API Key
    "pommentAPIKey": "REPLACE WITH YOUR ACTUAL KEY",

    // Pomment 服务端的 Webhook 地址
    "pommentAPIServer": "http://example.com"
}
```

4. 在 Pomment 服务端设置 webhook
5. 启动服务端
