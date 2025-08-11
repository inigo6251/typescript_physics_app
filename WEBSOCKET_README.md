# WebSocket Physics Integration

This project now includes a local WebSocket server that allows you to run the physics engine in a browser environment, overcoming the Node.js/Deno compatibility limitations.

## Quick Start

### 1. Start the WebSocket Server

```bash
# Start the server
deno run --allow-all websocket-server.ts

# Or use the npm script
npm run websocket
```

The server will start on port 8000 and provide:
- WebSocket endpoint: `ws://localhost:8000/ws`
- HTTP server: `http://localhost:8000`
- Automatic serving of HTML and JavaScript files

### 2. Open the Browser Client

Open your browser and navigate to:
```
http://localhost:8000
```

You should see the physics WebSocket client interface with:
- Connection status display
- Control buttons (Connect, Disconnect, Test)
- Physics data display
- Connection log

### 3. Test the Connection

1. Click "Connect" to establish WebSocket connection
2. Click "Send Test Message" to test communication
3. Watch the physics display and log for updates

## Architecture

### Server (`websocket-server.ts`)
- WebSocket server handling multiple client connections
- HTTP server serving static files
- Message broadcasting to all connected clients
- Physics state initialization and updates

### Client (`client.ts` / `client.js`)
- Browser-based WebSocket client
- Automatic reconnection with exponential backoff
- Physics engine integration ready
- Real-time display updates

### HTML Interface (`index.html`)
- Modern, responsive UI
- Real-time connection status
- Interactive controls
- Live log display

## Physics Engine Integration

The client is designed to integrate with the Sopiro Physics engine:

1. **Browser Environment**: The physics engine runs in the browser where DOM APIs are available
2. **WebSocket Communication**: Real-time updates between server and client
3. **State Management**: Physics state synchronized across all connected clients
4. **Extensible**: Easy to add new physics features and interactions

## Development

### Watch Mode
```bash
# Auto-restart server on file changes
npm run dev:websocket
```

### Adding New Features
1. **Server**: Add new message types in `websocket-server.ts`
2. **Client**: Handle new messages in `client.ts`
3. **UI**: Update the HTML interface as needed

### Testing
- Open multiple browser tabs to test multi-client scenarios
- Use browser dev tools to inspect WebSocket traffic
- Check server console for connection logs

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 8000
   lsof -ti:8000 | xargs kill -9
   ```

2. **WebSocket Connection Failed**
   - Ensure server is running
   - Check firewall settings
   - Verify port 8000 is accessible

3. **TypeScript Compilation**
   - The client.js is a copy of client.ts
   - For production, use a proper TypeScript compiler
   - Consider using esbuild or similar for better compilation

### Debug Mode
- Open browser console to see detailed logs
- Server logs appear in the terminal
- WebSocket traffic can be inspected in browser dev tools

## Next Steps

1. **Integrate Physics Engine**: Add actual physics simulation using the Sopiro engine
2. **Real-time Rendering**: Implement canvas-based physics visualization
3. **Multi-player**: Add user identification and physics object ownership
4. **Performance**: Optimize for high-frequency physics updates
5. **Security**: Add authentication and validation for physics updates

## Dependencies

- **Deno**: Runtime environment
- **WebSocket**: Real-time communication
- **HTML5**: Browser interface
- **TypeScript**: Type-safe development

The setup provides a solid foundation for building real-time physics applications that can run in any modern browser! 