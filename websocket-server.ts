// WebSocket server for physics engine integration
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const clients = new Set<WebSocket>();

// WebSocket upgrade handler
function handleWebSocket(req: Request): Response {
  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() != "websocket") {
    return new Response("Expected websocket", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  // Add client to our set
  clients.add(socket);
  console.log(`Client connected. Total clients: ${clients.size}`);

  // Handle incoming messages
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Received:", data);
      
      // Handle different message types
      switch (data.type) {
        case "physics_update":
          // Broadcast physics updates to all clients
          broadcastToAll({
            type: "physics_update",
            data: data.data,
            timestamp: Date.now()
          });
          break;
          
        case "client_ready":
          // Send initial physics state
          socket.send(JSON.stringify({
            type: "physics_init",
            data: {
              gravity: { x: 0, y: 9.81 },
              worldBounds: { width: 800, height: 600 }
            }
          }));
          break;
          
        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  };

  // Handle client disconnect
  socket.onclose = () => {
    clients.delete(socket);
    console.log(`Client disconnected. Total clients: ${clients.size}`);
  };

  // Handle errors
  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    clients.delete(socket);
  };

  return response;
}

// Broadcast message to all connected clients
function broadcastToAll(message: any) {
  const messageStr = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  }
}

// HTTP server with WebSocket support
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  if (url.pathname === "/ws") {
    return handleWebSocket(req);
  }
  
  if (url.pathname === "/") {
    // Serve the main HTML page
    const html = await Deno.readTextFile("./index.html");
    return new Response(html, {
      headers: { "content-type": "text/html" }
    });
  }
  
        if (url.pathname === "/client.js") {
          // Serve the compiled JavaScript file
          try {
            const js = await Deno.readTextFile("./client.js");
            return new Response(js, {
              headers: { "content-type": "application/javascript" }
            });
          } catch (error) {
            console.error("File read error:", error);
            return new Response("File not found", { status: 404 });
          }
        }
  
  return new Response("Not found", { status: 404 });
}

// Start the server
const port = 8000;
console.log(`WebSocket server running on ws://localhost:${port}/ws`);
console.log(`HTTP server running on http://localhost:${port}`);
console.log(`Open http://localhost:${port} in your browser`);

await serve(handler, { port }); 