// Client-side JavaScript for WebSocket physics integration
class PhysicsClient {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.canvas = null;
    this.ctx = null;
    this.physicsObjects = new Map();
    this.gravity = { x: 0, y: 9.81 };
    this.worldBounds = { width: 800, height: 600 };
    this.animationId = null;
    this.lastTime = 0;

    this.init();
  }

  init() {
    this.setupWebSocket();
    this.setupCanvas();
    this.startPhysicsSimulation();
    // Initialize gravity button after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.updateGravityButton();
    }, 500);
  }

  setupWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.connected = true;
      this.updateConnectionStatus(true);
      this.sendMessage({ type: 'client_ready' });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handlePhysicsUpdate(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.connected = false;
      this.updateConnectionStatus(false);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.connected = false;
      this.updateConnectionStatus(false);
    };
  }

  setupCanvas() {
    this.canvas = document.getElementById('physics-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      if (this.ctx) {
        this.canvas.width = this.worldBounds.width;
        this.canvas.height = this.worldBounds.height;
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

  startPhysicsSimulation() {
    this.animate(performance.now());
  }

  animate(currentTime) {
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
    }

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.updatePhysics(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame((time) => this.animate(time));
  }

  updatePhysics(deltaTime) {
    // Debug gravity value more frequently for testing
    if (Math.random() < 0.01) { // Log about 1% of the time
      console.log('Physics update using gravity.y:', this.gravity.y);
    }

    this.physicsObjects.forEach((obj) => {
      // Apply gravity to vertical velocity
      const gravityEffect = this.gravity.y * deltaTime;
      obj.velocity.y += gravityEffect;

      // Update position based on velocity
      obj.x += obj.velocity.x * deltaTime * 60;
      obj.y += obj.velocity.y * deltaTime * 60;

      if (obj.type === 'circle' && obj.radius) {
        if (obj.x - obj.radius < 0) {
          obj.x = obj.radius;
          obj.velocity.x = -obj.velocity.x * 0.8;
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

  render() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.physicsObjects.forEach((obj) => {
      this.ctx.save();
      if (obj.type === 'circle' && obj.radius) {
        this.ctx.beginPath();
        this.ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fill();
        this.ctx.strokeStyle = '#2E7D32';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
      this.ctx.restore();
    });

    // Draw world boundaries
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw gravity indicator
    this.ctx.save();
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = this.gravity.y === 0 ? '#dc3545' : '#28a745';
    this.ctx.fillText(`Gravity: ${this.gravity.y === 0 ? 'OFF' : 'ON'}`, 10, 30);
    this.ctx.restore();
  }

  addPhysicsObject(obj) {
    this.physicsObjects.set(obj.id, obj);
    this.updatePhysicsDisplay({ action: 'object_added', object: obj });
  }

  updatePhysicsDisplay(data) {
    const display = document.getElementById('physics-display');
    if (display) {
      let content = '';

      if (data.action === 'object_added') {
        content = `Added object: ${data.object.id} at (${Math.round(data.object.x)}, ${Math.round(data.object.y)})`;
      } else if (data.action === 'simulation_reset') {
        content = 'Simulation reset';
      } else if (data.action === 'gravity_toggled') {
        content = `Gravity: ${data.gravity.y === 0 ? 'OFF' : 'ON'} (${data.gravity.y.toFixed(2)} m/s²)`;
      } else {
        // Always show current gravity state prominently
        const gravityStatus = this.gravity.y === 0 ? 'OFF' : 'ON';
        const gravityColor = this.gravity.y === 0 ? '#dc3545' : '#28a745';
        content = `Objects: ${this.physicsObjects.size} | Gravity: <span style="color: ${gravityColor}; font-weight: bold;">${gravityStatus}</span> (${this.gravity.y.toFixed(2)} m/s²) | World: ${this.worldBounds.width}x${this.worldBounds.height}`;
      }

      display.innerHTML = content;
    }
  }

  refreshPhysicsDisplay() {
    // Force update the display with current physics state
    this.updatePhysicsDisplay({ action: 'refresh' });
  }

  handlePhysicsUpdate(data) {
    if (data.type === 'physics_update') {
      this.updatePhysicsDisplay(data.data);
    }
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  updateConnectionStatus(connected) {
    const statusDisplay = document.getElementById('connection-status');
    if (statusDisplay) {
      statusDisplay.textContent = connected ? 'Connected' : 'Disconnected';
      statusDisplay.className = connected ? 'status connected' : 'status disconnected';
    }

    const addBallBtn = document.getElementById('add-ball');
    const resetBtn = document.getElementById('reset-simulation');
    const gravityBtn = document.getElementById('toggle-gravity');
    const addRandomBallBtn = document.getElementById('add-random-ball');

    if (connected) {
      if (addBallBtn) addBallBtn.disabled = false;
      if (resetBtn) resetBtn.disabled = false;
      if (gravityBtn) gravityBtn.disabled = false;
      if (addRandomBallBtn) addRandomBallBtn.disabled = false;
    } else {
      if (addBallBtn) addBallBtn.disabled = true;
      if (resetBtn) resetBtn.disabled = true;
      if (gravityBtn) gravityBtn.disabled = true;
      if (addRandomBallBtn) addRandomBallBtn.disabled = true;
    }
  }

  resetSimulation() {
    this.physicsObjects.clear();
    this.setupCanvas();
    this.updatePhysicsDisplay({ action: 'simulation_reset' });
  }

  toggleGravity() {
    console.log('=== GRAVITY TOGGLE CALLED ===');
    console.log('Current gravity.y:', this.gravity.y);

    // Toggle gravity between 0 and 9.81
    const oldGravity = this.gravity.y;
    this.gravity.y = oldGravity === 0 ? 9.81 : 0;

    console.log('Gravity changed from', oldGravity, 'to', this.gravity.y);

    // Update the button immediately
    this.updateGravityButton();

    // Update the display
    this.updatePhysicsDisplay({
      action: 'gravity_toggled',
      gravity: this.gravity
    });

    // Force refresh the physics display to show current state
    this.refreshPhysicsDisplay();

    // Send to server
    this.sendMessage({
      type: 'physics_update',
      data: {
        action: 'gravity_changed',
        gravity: this.gravity
      }
    });

    console.log('=== GRAVITY TOGGLE COMPLETE ===');
  }

  updateGravityButton() {
    const gravityBtn = document.getElementById('toggle-gravity');

    if (!gravityBtn) {
      console.error('Gravity button not found!');
      return;
    }

    const isGravityOn = this.gravity.y !== 0;

    // Update button text
    if (isGravityOn) {
      gravityBtn.textContent = 'Disable Gravity';
      gravityBtn.style.backgroundColor = '#28a745'; // Green
      gravityBtn.style.color = 'white';
      gravityBtn.style.borderColor = '#28a745';
      console.log('Button set to: Disable Gravity (GREEN)');
    } else {
      gravityBtn.textContent = 'Enable Gravity';
      gravityBtn.style.backgroundColor = '#dc3545'; // Red
      gravityBtn.style.color = 'white';
      gravityBtn.style.borderColor = '#dc3545';
      console.log('Button set to: Enable Gravity (RED)');
    }

    console.log('Button updated successfully. Gravity.y =', this.gravity.y);
  }

  addRandomBall() {
    const newBall = {
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
  window.physicsClient = client;

  // Add global functions to add balls programmatically
  window.addBall = () => {
    client.addRandomBall();
  };

  window.addMultipleBalls = (count = 5) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => client.addRandomBall(), i * 100);
    }
  };

  // Add global function to test gravity toggle
  window.toggleGravity = () => {
    client.toggleGravity();
  };

  // Add global function to check current gravity state
  window.getGravityState = () => {
    console.log('Current gravity:', client.gravity.y);
    return client.gravity.y;
  };

  // Add global function to test gravity toggle with logging
  window.testGravityToggle = () => {
    console.log('=== Testing Gravity Toggle ===');
    console.log('Before toggle - gravity.y:', client.gravity.y);
    client.toggleGravity();
    console.log('After toggle - gravity.y:', client.gravity.y);
    console.log('Button text should now be:', client.gravity.y === 0 ? 'Enable Gravity' : 'Disable Gravity');
    console.log('=== Test Complete ===');
  };

  // Add global function to manually update the gravity button
  window.updateGravityButton = () => {
    console.log('Manually updating gravity button...');
    client.updateGravityButton();
  };

  // Add global function to check button state
  window.checkGravityButton = () => {
    const btn = document.getElementById('toggle-gravity');
    if (btn) {
      console.log('Button found:', {
        text: btn.textContent,
        backgroundColor: btn.style.backgroundColor,
        color: btn.style.color,
        gravityValue: client.gravity.y
      });
    } else {
      console.error('Gravity button not found in DOM');
    }
  };

  // Add global function to demonstrate gravity effect
  window.demonstrateGravity = () => {
    console.log('=== Demonstrating Gravity Effect ===');

    // Add a ball at the top
    const demoBall = {
      id: 'demo-ball',
      x: 400,
      y: 50,
      velocity: { x: 0, y: 0 },
      mass: 1,
      type: 'circle',
      radius: 20
    };

    client.addPhysicsObject(demoBall);

    // Toggle gravity to show effect
    setTimeout(() => {
      console.log('Toggling gravity ON...');
      client.toggleGravity();
    }, 1000);

    // Toggle gravity off after 3 seconds
    setTimeout(() => {
      console.log('Toggling gravity OFF...');
      client.toggleGravity();
    }, 4000);

    console.log('Demo ball added. Watch it fall when gravity is ON!');
  };

  // Add event listeners for buttons
  const addBallBtn = document.getElementById('add-ball');
  const resetBtn = document.getElementById('reset-simulation');
  const gravityBtn = document.getElementById('toggle-gravity');
  const addRandomBallBtn = document.getElementById('add-random-ball');

  if (addBallBtn) {
    addBallBtn.addEventListener('click', () => {
      if (window.physicsClient) {
        window.physicsClient.addRandomBall();
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (window.physicsClient) {
        window.physicsClient.resetSimulation();
      }
    });
  }

  if (gravityBtn) {
    gravityBtn.addEventListener('click', () => {
      if (window.physicsClient) {
        window.physicsClient.toggleGravity();
      }
    });
  }

  if (addRandomBallBtn) {
    addRandomBallBtn.addEventListener('click', () => {
      if (window.physicsClient) {
        window.physicsClient.addRandomBall();
      }
    });
  }
}); 