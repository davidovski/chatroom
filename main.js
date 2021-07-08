const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const websocket = require("ws");

const static_content = __dirname + "/dist/";

// Create an array to store messages in
var log = []

// Initialise a simple http server to serve any static files
http.createServer((req, res) => {

	// normalise path name to stay within a normal directory
	var requestUrl = url.parse(req.url);
	var fsPath = static_content + path.normalize(requestUrl.pathname);
	
	// automatically return the index of a directory, if its been selected
	if (fs.statSync(fsPath).isDirectory()) 
		fsPath += fsPath.endsWith("/") ? "index.html" : "/index.html";
	
	// read and send the file
	fs.readFile(fsPath, (err, data) => {
		if (err) {
			res.writeHead(404);
			res.end(JSON.stringify(err))
		} else {
			res.writeHead(200);
			res.end(data);
		}
	});
}).listen(8080);

// create websocket: client tracking allows us to get a set of clients so that we can send messages to each client once they appear
const wss = new websocket.Server({port : 8081, clientTracking: true});

wss.on("connection", ws => {
	// predefine a user nickname
	var nick = "anon" + wss.clients.size

	ws.on("message", msg => {
		var data = JSON.parse(msg);

		// Ensure that nickname requirements are met before setting client's nick
		if (data.nickname && data.nickname.length < 24 && data.nickname.length > 0) nick = data.nickname;

		switch (data.event) {
			case "join":
				// send the client the requested number of messages before joining
				if (data.lines) log.slice(0-data.lines).forEach(l => ws.send(l))
				break;
			case "message":
				// ensure that the message length requirements are met correctly
				if (data.content.length < 128 && data.content.length > 0) {
					
					// recreate the message object to be sent
					message = JSON.stringify({
						event: "message",
						content: data.content,
						nickname: nick
					});

					// send the message to the log array first
					log.push(message);

					// propogate the message to all connected clients
					wss.clients.forEach(c => {
						c.send(message);
					})
				}
				break;
		}

	});
})
