const puppeteer = require('puppeteer-extra')
const fs = require("fs-extra")
const path = require("path")
const robot = require("kbm-robot")
const { exec, spawn } = require("child_process")
const http = require("http")
const WebSocket = require("ws")
const to = require('await-to-js').default

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')

puppeteer.use(StealthPlugin())
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

const clientsPass = fs.readJsonSync("./clients.json")
const express = require("express")
const app = express()

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

spawn("./Multiple_ROBLOX.exe")
spawn("./Synapse Launcher.exe")

const server = http.createServer(app)
const wss = new WebSocket.Server({ server });
const clients = {}

function parseJson(json) {
    return new Promise((resolve, reject) => {
        try {
            resolve(JSON.parse(json))
        } catch (err) {
            reject(err)
        }
    })
}

function send(client, message) {
    if (client == "all") {
        wss.clients.forEach((ws) => {
            ws.send(JSON.stringify(message))
        })
    } else {
        clients[client].ws.send(JSON.stringify(message))
    }
}

function sendError(ws, code, error) {
    ws.send(JSON.stringify({
        statusCode: code,
        error,
    }))
}

async function handleClient(ws, message) {
    let client = clients[message.client] || {}
    let method = message.method

    switch (method) {
        case "register":
            let isMaster = message.isMaster
            if (isMaster == "auto") {
                let isFound = false
                for (const user in clients) { if (user.isMaster) { isFound = true } }

                isMaster = !isFound
            }

            client.session = 1
            client.initialized = true
            client.username = message.client
            client.isMaster = isMaster
            client.ws = ws

            clients[message.client] = client
            break;
        case "loadScript":
            if (client.isMaster) {
                send(message.target, {
                    method: "loadScript",
                    caller: message.client,
                    script: message.script,
                })
            } else {
                sendError(ws, 403, "Command locked to master")
            }
            break;
        case "joinGame":
            if (client.isMaster) {
                send(message.target, {
                    method: "loadScript",
                    caller: message.client,
                    placeId: message.placeId,
                })
            } else {
                sendError(ws, 403, "Command locked to master")
            }
            break;
        case "joinJobId":
            if (client.isMaster) {
                send(message.target, {
                    method: "loadScript",
                    caller: message.client,
                    placeId: message.placeId,
                    jobId: message.jobId,
                })
            } else {
                sendError(ws, 403, "Command locked to master")
            }
            break;
        case "clients":
            let curatedClientsList = {}

            for (const client in clients) {
                curatedClientsList[client] = {
                    session: clients[client].session,
                    initialized: clients[client].initialized,
                    username: clients[client].username,
                    isMaster: clients[client].isMaster,
                }
            }

            send(message.client, {
                method: "clients",
                clients: curatedClientsList,
            })
            break;
        case "broadcast":
            send("all", {
                method: "broadcast",
                caller: message.client,
                message: message.message,
            })

            break;
        case "sendMessage":
            send(message.target, {
                method: "sendMessage",
                caller: message.client,
                message: message.message,
            })

            break;
    }
}

wss.on('connection', (ws) => {
    ws.on('message', async (msg) => {
        let [err, message] = await to(parseJson(msg.toString()))

        if (!err && message["X-Forwarded-For"] == "RKBS") {
            handleClient(ws, message)
        } else {
            console.log(err)
        }
    })
})

app.get("/newClient/:client/:game", async (req, res) => {
    let clientPass = clientsPass[req.params.client]
    let game = parseFloat(req.params.game) || 7434670018

    let browser = await puppeteer.launch({
        headless: false,
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    })

    let page = await browser.newPage()

    await page.goto(`https://www.roblox.com/games/${game}`, { waitUntil: "networkidle0" })

    const cookies = [{
        "domain": ".roblox.com",
        "expirationDate": Math.floor(Date.now() / 1000) + 31536000,
        "hostOnly": false,
        "httpOnly": true,
        "name": ".ROBLOSECURITY",
        "path": "/",
        "sameSite": "unspecified",
        "secure": false,
        "session": false,
        "storeId": "1",
        'value': clientPass,
        "id": 1
    }]

    await page.setCookie(...cookies);
    await page.reload({ waitUntil: "networkidle0" })

    await sleep(500)

    await page.evaluate(() => {
        $("#game-details-play-button-container > button > span").click()
    })

    await sleep(500)

    robot.startJar()

    await robot.press("left")
        .sleep(500)
        .release("left")
        .sleep(500)
        .press("enter")
        .sleep(500)
        .release("enter")
        .go()
        .then(robot.stopJar)

    await browser.close()

    clients[req.params.client] = {
        initialized: false,
        session: -1,
        username: req.params.client,
    }

    res.sendStatus(201)
})

server.listen(9452, () => {
    console.log(`Server started on port ${server.address().port}`);
})