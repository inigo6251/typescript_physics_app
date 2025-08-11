// Client-side TypeScript for WebSocket physics integration with Sopiro Physics Engine
interface PhysicsState {
  gravity: { x: number; y: number };
  worldBounds: { width: number; height: number };
}

interface PhysicsUpdate {
  type: string;
  data: any;
  timestamp: number;
}

interface PhysicsObject {
  id: string;
  x: number;
  y: number;
  velocity: { x: number; y: number };
  mass: number;
  type: 'circle' | 'rectangle';
  radius?: number;
  width?: number;
  height?: number;
}

class PhysicsClient {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  // Physics engine properties
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private physicsObjects: Map<string, PhysicsObject> = new Map();
  private gravity = { x: 0, y: 9.81 };
  private worldBounds = { width: 800, height: 600 };
  private animationId: number | null = null;
  private lastTime = 0;

  constructor() {
    this.init();
  }

  private init() {
    this.setupCanvas();
    this.connect();
    this.startPhysicsSimulation();
  }

  private setupCanvas() {
    this.canvas = document.getElementById('physics-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      if (this.ctx) {
        this.canvas.width = this.worldBounds.width;
        this.canvas.height = this.worldBounds.height;
        
        // Add some initial physics objects
        this.addPhysicsObject({
          id: 'ball1',
          x: 100,
          y: 100,
          velocity: { x: 2, y: 0 },
          mass: 1,
          type: 'circle',
          radius: 20
        });
        
        this.addPhysicsObject({
          id: 'ball2',
          x: 200,
          y: 150,
          velocity: { x: -1, y: 0 },
          mass: 1.5,
          type: 'circle',
          radius: 25
        });
        
        console.log('Canvas setup complete with', this.physicsObjects.size, 'objects');
      } else {
        console.error('Failed to get canvas context');
      }
    } else {
      console.error('Canvas element not found');
    }
  }



  private startPhysicsSimulation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.lastTime = performance.now();
    this.animate();
  }

  private animate(currentTime = performance.now()) {
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    this.updatePhysics(deltaTime);
    this.render();
    
    this.animationId = requestAnimationFrame(this.animate.bind(this));
  }

  private connect() {
    try {
      this.socket = new WebSocket('ws://localhost:8000/ws');
      
      this.socket.onopen = () => {
        console.log('Connected to WebSocket server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.sendMessage({ type: 'client_ready' });
      };

      this.socket.onmessage = (event) => {
        try {
          const data: PhysicsUpdate = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('Disconnected from WebSocket server');
        this.isConnected = false;
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
      };

    } catch (error) {
      console.error('Failed to connect:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, 1000 * this.reconnectAttempts); // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleMessage(message: PhysicsUpdate) {
    switch (message.type) {
      case 'physics_init':
        console.log('Received physics initialization:', message.data);
        this.initializePhysics(message.data as PhysicsState);
        break;
        
      case 'physics_update':
        console.log('Received physics update:', message.data);
        this.handlePhysicsUpdate(message.data);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private handlePhysicsUpdate(data: any) {
    // Handle physics updates from WebSocket
    if (data.action === 'add_object' && data.object) {
      this.addPhysicsObject(data.object);
    } else if (data.action === 'remove_object' && data.id) {
      this.physicsObjects.delete(data.id);
    } else if (data.action === 'update_gravity' && data.gravity) {
      this.gravity = data.gravity;
    } else if (data.action === 'reset') {
      this.physicsObjects.clear();
      this.setupCanvas(); // Re-add initial objects
    }
    
    // Update the display
    this.updatePhysicsDisplay(data);
  }

  private initializePhysics(state: PhysicsState) {
    // Initialize physics engine with received state
    console.log('Initializing physics with:', state);
    
    // Here you would integrate with the Sopiro Physics engine
    // For now, we'll just log the state
    this.updatePhysicsDisplay(state);
  }

    private updatePhysics(deltaTime: number) {
    // Update physics simulation with delta time
    this.physicsObjects.forEach((obj, id) => {
      // Apply gravity
      obj.velocity.y += this.gravity.y * deltaTime;
      
      // Update position
      obj.x += obj.velocity.x * deltaTime * 60; // Scale for 60fps
      obj.y += obj.velocity.y * deltaTime * 60;
      
      // Basic collision with world bounds
      if (obj.type === 'circle' && obj.radius) {
        if (obj.x - obj.radius < 0) {
          obj.x = obj.radius;
          obj.velocity.x = -obj.velocity.x * 0.8; // Bounce with energy loss
        }
        if (obj.x + obj.radius > this.worldBounds.width) {
          obj.x = this.worldBounds.width - obj.radius;
          obj.velocity.x = -obj.velocity.x * 0.8;
        }
        if (obj.y + obj.radius > this.worldBounds.height) {
          obj.y = this.worldBounds.height - obj.radius;
          obj.velocity.y = -obj.velocity.y * 0.8;
        }
        if (obj.y - obj.radius < 0) {
          obj.y = obj.radius;
          obj.velocity.y = -obj.velocity.y * 0.8;
        }
      }
    });
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw physics objects
    this.physicsObjects.forEach((obj) => {
      this.ctx!.save();
      
      if (obj.type === 'circle' && obj.radius) {
        this.ctx!.beginPath();
        this.ctx!.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
        this.ctx!.fillStyle = '#4CAF50';
        this.ctx!.fill();
        this.ctx!.strokeStyle = '#2E7D32';
        this.ctx!.lineWidth = 2;
        this.ctx!.stroke();
      }
      
      this.ctx!.restore();
    });
    
    // Draw world bounds
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private updatePhysicsDisplay(data: any) {
    // Update the visual display
    const display = document.getElementById('physics-display');
    if (display) {
      const objects = Array.from(this.physicsObjects.values());
      display.innerHTML = `
        <h3>Physics State</h3>
        <p><strong>Objects:</strong> ${objects.length}</p>
        <p><strong>Gravity:</strong> (${this.gravity.x.toFixed(2)}, ${this.gravity.y.toFixed(2)})</p>
        <p><strong>World:</strong> ${this.worldBounds.width} × ${this.worldBounds.height}</p>
        <h4>Objects:</h4>
        <pre>${JSON.stringify(objects, null, 2)}</pre>
        <p>Last update: ${new Date().toLocaleTimeString()}</p>
      `;
    }
  }

  public sendMessage(message: any) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: not connected');
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }

  public addPhysicsObject(obj: PhysicsObject) {
    this.physicsObjects.set(obj.id, obj);
    this.updatePhysicsDisplay({ action: 'object_added', object: obj });
  }

  public resetSimulation() {
    this.physicsObjects.clear();
    this.setupCanvas();
    this.updatePhysicsDisplay({ action: 'simulation_reset' });
  }

  public toggleGravity() {
    this.gravity.y = this.gravity.y === 0 ? 9.81 : 0;
    this.updatePhysicsDisplay({ action: 'gravity_toggled', gravity: this.gravity });
  }

  public addRandomBall() {
    const newBall: PhysicsObject = {
      id: `ball${Date.now()}`,
      x: Math.random() * (this.worldBounds.width - 100) + 50,
      y: Math.random() * 100 + 50,
      velocity: { 
        x: (Math.random() - 0.5) * 6 - 1, 
        y: 0 
      },
      mass: Math.random() * 2 + 0.5,
      type: 'circle',
      radius: Math.random() * 25 + 15
    };
    
    this.addPhysicsObject(newBall);
    console.log('Added new ball:', newBall);
    
    // Send physics update to server
    this.sendMessage({
      type: 'physics_update',
      data: {
        action: 'add_object',
        object: newBall
      }
    });
  }
}

        // Initialize the client when the page loads
        document.addEventListener('DOMContentLoaded', () => {
          const client = new PhysicsClient();

          // Make client available globally for debugging
          (window as any).physicsClient = client;
          
          // Add a global function to add balls programmatically
          (window as any).addBall = () => {
            client.addRandomBall();
          };
          
          // Add a global function to add multiple balls
          (window as any).addMultipleBalls = (count: number = 5) => {
            for (let i = 0; i < count; i++) {
              setTimeout(() => client.addRandomBall(), i * 100);
            }
          };
  
  // Add some test buttons
  const testButton = document.getElementById('test-button');
  if (testButton) {
    testButton.addEventListener('click', () => {
      client.sendMessage({
        type: 'physics_update',
        data: {
          action: 'test',
          timestamp: Date.now()
        }
      });
    });
  }
}); 