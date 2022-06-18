local kubernetes = {}

local websocketLibrary = syn and syn.websocket or WebSocket
local WebSocket

if not websocketLibrary then return error("Your executor has no support of websockets") end

local TeleportService = game:GetService("TeleportService")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local MessageEvent = Instance.new("BindableEvent")

local function combine(a1, a2)
	local new = {}

	for i,v in pairs(a1) do
		new[i] = v
	end

	for i,v in pairs(a2) do
		new[i] = v
	end

	return new
end

function sendMessage(original) 
	local message = combine(original,{
		client = Players.LocalPlayer.Name,
		["X-Forwarded-For"] = "RKBS",
	})

	WebSocket:Send(HttpService:JSONEncode(message))
end

function handleMessage(msg)
	local message = HttpService:JSONDecode(msg)
	if message.error then
		warn(message.errorCode)
		return warn(message.error)
	end

	if message.method == "loadScript" then
		loadstring(message.script)()
	elseif message.method == "joinGame" then
		TeleportService:Teleport(message.placeId)
	elseif message.method == "joinJobId" then
		TeleportService:TeleportToPlaceInstance(message.placeId, message.jobId)
	end

	MessageEvent:Fire(message.method, message)
end

kubernetes.onEvent = MessageEvent.Event

kubernetes.init = function(ip)
	WebSocket = websocketLibrary.connect(ip)
	sendMessage({method = "register", isMaster = "auto"})
	WebSocket.OnMessage:Connect(handleMessage)

	sendMessage({method = "loadScript", target = "all", script = "print(true)"})
end

kubernetes.onEvent:Connect(print)

kubernetes.init("ws://localhost:9452")

return kubernetes