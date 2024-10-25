const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files (HTML, CSS, JS) from the 'public' directory
app.use(express.static("public"));

// To store text for each public IP
const ipSessions = {};

// Broadcast message to all connected clients with the same IP
function broadcastToIP(ip, message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.ip === ip) {
      client.send(message);
      console.log(`Broadcasting message to IP ${ip}: ${message}`);
    }
  });
}

wss.on("connection", (ws, req) => {
  const clientIP =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  ws.ip = clientIP;
  console.log(`New connection from IP: ${clientIP}`);

  // Send the current text to newly connected clients
  if (ipSessions[clientIP]) {
    ws.send(ipSessions[clientIP]);
    console.log(
      `Sent saved text to new client at IP ${clientIP}: ${ipSessions[clientIP]}`
    );
  }

  // Handle incoming messages from clients
  ws.on("message", (message) => {
    console.log(`Received message from IP ${clientIP}: ${message}`);
    ipSessions[clientIP] = message; // Update the text for this IP
    broadcastToIP(clientIP, message); // Sync across all devices with the same IP
  });

  // Handle connection close events
  ws.on("close", () => {
    console.log(`Connection closed for IP: ${clientIP}`);
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error(`Error occurred on connection with IP ${clientIP}:`, error);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
