# Physics Simulation with WebSocket Integration

This project now includes a real-time physics simulation that runs in the browser with WebSocket communication capabilities.

## Features

### Real-time Physics Simulation
- **Canvas-based rendering** with smooth 60fps animation
- **Gravity simulation** with configurable parameters
- **Collision detection** with world boundaries
- **Multiple physics objects** (circles with mass, velocity, and position)
- **Energy loss** on collisions for realistic bouncing

### Interactive Controls
- **Add Ball**: Create new physics objects with random properties
- **Reset Simulation**: Clear all objects and restart with initial setup
- **Toggle Gravity**: Switch between normal gravity and zero gravity
- **Real-time object manipulation** through the WebSocket interface

### WebSocket Integration
- **Real-time communication** between client and server
- **Physics state synchronization** across multiple clients
- **Remote physics control** through WebSocket messages
- **Automatic reconnection** with exponential backoff

## How to Use

### 1. Start the WebSocket Server
```bash
deno run --allow-all websocket-server.ts
```

### 2. Open the Client
Navigate to `http://localhost:8000` in your browser.

### 3. Interact with the Simulation
- **Connect** to the WebSocket server
- **Add balls** to see them fall and bounce
- **Reset** the simulation to start over
- **Toggle gravity** to see objects float or fall

## Physics Engine Details

### Object Properties
Each physics object has:
- **Position**: `x`, `y` coordinates
- **Velocity**: `vx`, `vy` components
- **Mass**: Affects gravity and collision response
- **Type**: Currently supports circles with radius
- **Unique ID**: For tracking and manipulation

### Physics Calculations
- **Gravity**: Applied as acceleration to velocity
- **Position Update**: Based on velocity and delta time
- **Collision Detection**: Boundary checking with bounce response
- **Energy Loss**: 20% velocity reduction on collisions

### Rendering
- **Canvas Context**: 2D rendering with smooth animations
- **Visual Style**: Green circles with darker borders
- **World Bounds**: Gray border showing simulation area
- **Real-time Updates**: 60fps animation loop

## WebSocket Message Types

### Client to Server
- `client_ready`: Indicates client is ready for physics data
- `physics_update`: Sends physics state changes

### Server to Client
- `physics_init`: Initial physics configuration
- `physics_update`: Real-time physics state updates

## Development

### Adding New Physics Objects
```typescript
const newBall = {
  id: `ball${Date.now()}`,
  x: Math.random() * 700 + 50,
  y: Math.random() * 100 + 50,
  velocity: { x: (Math.random() - 0.5) * 4, y: 0 },
  mass: Math.random() * 2 + 0.5,
  type: 'circle',
  radius: Math.random() * 20 + 15
};
physicsClient.addPhysicsObject(newBall);
```

### Customizing Physics Parameters
```typescript
// Change gravity
physicsClient.gravity = { x: 0, y: 5.0 };

// Modify world bounds
physicsClient.worldBounds = { width: 1000, height: 800 };
```

## Next Steps

### Potential Enhancements
1. **Advanced Collision Detection**: Object-to-object collisions
2. **Different Shapes**: Rectangles, polygons, compound objects
3. **Forces and Constraints**: Springs, joints, motors
4. **Particle Systems**: Multiple small objects for effects
5. **3D Rendering**: WebGL-based 3D physics visualization
6. **Physics Engine Integration**: Full Sopiro Physics engine integration

### Performance Optimization
- **Object pooling** for frequently created/destroyed objects
- **Spatial partitioning** for collision detection
- **Web Workers** for physics calculations
- **GPU acceleration** for rendering

## Troubleshooting

### Common Issues
1. **Canvas not rendering**: Check browser console for errors
2. **WebSocket connection failed**: Ensure server is running on port 8000
3. **Physics objects not moving**: Verify gravity is enabled and objects have mass
4. **Performance issues**: Reduce number of objects or check browser performance

### Debug Mode
Enable detailed logging by checking the browser console and the connection log on the page.

## Architecture

The physics simulation uses a modular design:
- **PhysicsClient**: Main class managing simulation and WebSocket communication
- **Canvas Rendering**: Real-time visual updates
- **Physics Engine**: Simple physics calculations (expandable)
- **WebSocket Layer**: Real-time communication infrastructure

This design allows for easy extension and integration with more sophisticated physics engines like the Sopiro Physics engine. 