roKubernetes is a NodeJS/Lua project to
allow roblox clients to communicate with
other ones and with the nodeJS server
using websockets.

It is using a master/slave paragrim to control
parent nodes and children.

```lua
local roKubernetes = loadstring(game:HttpGet("https://raw.githubusercontent.com/JijaProGamer/publicRobloxKubernetes/master/kubernetes.lua"
    , true))()
```

For the server to run it has to have 
Synapse X installed and configured with
auto launch on and discord autojoin off 
and Multiple_ROBLOX.exe

The module has the following events:

```lua
roKubernetes.onEvent -- Fires raw data when the server send a response (method, response)
roKubernetes.onError -- Fires when the server send a error response (table with errorCode and error)
```

The module has the following functions:

```lua
roKubernetes.init([server]) -- Connects to the master server. Example server: "ws://localhost:9452"
roKubernetes.ping() -- Pings server. It is called automatically every second.
roKubernetes.loadScript([target], [script]) -- If master, forces the target ("all" or the name of any client) to loadstring the script and run it.
roKubernetes.joinGame([target], [placeId]) -- If master, forces the target to telepeport to the place ID
roKubernetes.joinJobId([target], [placeId], [jobId]) -- If master, forces the target to telepeport to the place ID and jobId
roKubernetes.clients() -- Get list of other clients connected to the master server
roKubernetes.localClient() -- Gets the local client connected to the master server. Can be used to see if the client is a master or not using roKubernetes.localClient().isMaster
roKubernetes.broadcast([message]) -- Sends message to every client connected to the master server. Message has to be a string
roKubernetes.sendMessage([target], [message]) -- Sends message to the target. Message has to be a string
```