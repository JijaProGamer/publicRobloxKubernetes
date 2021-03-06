local kubernetes = {}

local websocketLibrary = syn and syn.websocket or WebSocket
local WebSocket

if not websocketLibrary then return error("Your executor has no support of websockets") end

local TeleportService = game:GetService("TeleportService")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local MessageEvent = Instance.new("BindableEvent")
local ErrorEvent = Instance.new("BindableEvent")

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

local function sendMessage(original) 
	local message = combine(original,{
		client = Players.LocalPlayer.Name,
		["X-Forwarded-For"] = "RKBS",
	})

	WebSocket:Send(HttpService:JSONEncode(message))
end

local function handleMessage(msg)
	local message = HttpService:JSONDecode(msg)
	if message.error then
		warn(message.errorCode)
		warn(message.error)
		ErrorEvent:Fire(message)
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

local function waitForMessage(method)
	local message
	
	repeat
		message = WebSocket.OnMessage:Wait()
		message = HttpService:JSONDecode(message)
	until message.method == method
	
	return message
end

kubernetes.onEvent = MessageEvent.Event
kubernetes.onError = ErrorEvent.Event

kubernetes.init = function(ip)
	WebSocket = websocketLibrary.connect(ip)
	sendMessage({method = "register", isMaster = "auto"})
	kubernetes.ping()
	
	WebSocket.OnMessage:Connect(handleMessage)
end

kubernetes.ping = function()
	sendMessage({
		method = "ping",
	})
end

coroutine.wrap(function()
	while task.wait(1) do
		kubernetes.ping()
	end
end)()

kubernetes.loadScript = function(target, scriptToSend)
	sendMessage({
		method = "loadScript",
		target = target,
		script = scriptToSend
	})
end

kubernetes.joinGame = function(target, placeId)
	sendMessage({
		method = "joinGame",
		target = target,
		placeId = placeId
	})
end

kubernetes.joinJobId = function(target, placeId, jobId)
	sendMessage({
		method = "joinJobId",
		target = target,
		placeId = placeId,
		jobId = jobId
	})
end

kubernetes.clients = function()
	sendMessage({ method = "clients" })
	local response = waitForMessage("clients").clients

	return response
end

kubernetes.localClient = function()
	sendMessage({ method = "clients" })
	local clients = waitForMessage("clients").clients
	local response = clients[Players.LocalPlayer.Name]

	return response
end

kubernetes.broadcast = function(message)
	sendMessage({
		method = "broadcast",
		message = message
	})
end

kubernetes.sendMessage = function(target, message)
	sendMessage({
		method = "sendMessage",
		target = target,
		message = message
	})
end

return kubernetes