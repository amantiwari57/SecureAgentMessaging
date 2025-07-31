import net from 'node:net';

interface ProtocolMessage {
  type: 'data' | 'keepalive' | 'ping' | 'pong' | 'close';
  payload?: any;
  timestamp: number;
  id?: string;
}

interface ConnectionInfo {
  socket: net.Socket;
  lastActivity: number;
  keepAliveInterval?: NodeJS.Timeout;
  isAlive: boolean;
}

class TCPServer {
  private server: net.Server;
  private port: number;
  private connections: Map<string, ConnectionInfo> = new Map();
  private keepAliveTimeout: number; // milliseconds
  private keepAliveInterval: number; // milliseconds

  constructor(port: number = 4000, keepAliveTimeout: number = 30000, keepAliveInterval: number = 10000) {
    this.port = port;
    this.keepAliveTimeout = keepAliveTimeout;
    this.keepAliveInterval = keepAliveInterval;
    this.server = net.createServer();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.server.on('connection', (socket) => {
      const connectionId = `${socket.remoteAddress}:${socket.remotePort}`;
      console.log(`Client connected: ${connectionId}`);
      
      const connectionInfo: ConnectionInfo = {
        socket,
        lastActivity: Date.now(),
        isAlive: true
      };

      this.connections.set(connectionId, connectionInfo);
      this.setupSocketHandlers(socket, connectionId);
      this.startKeepAlive(connectionId);
    });

    this.server.on('error', (err) => {
      console.error('Server error:', err);
    });
  }

  private setupSocketHandlers(socket: net.Socket, connectionId: string): void {
    socket.on('data', (data) => {
      try {
        const message: ProtocolMessage = JSON.parse(data.toString());
        this.handleMessage(message, connectionId);
      } catch (error) {
        console.error('Invalid message format:', error);
        this.sendMessage(socket, {
          type: 'data',
          payload: { error: 'Invalid message format' },
          timestamp: Date.now()
        });
      }
    });

    socket.on('end', () => {
      console.log(`Client disconnected: ${connectionId}`);
      this.cleanupConnection(connectionId);
    });

    socket.on('error', (err) => {
      console.error(`Socket error for ${connectionId}:`, err);
      this.cleanupConnection(connectionId);
    });

    socket.on('close', () => {
      console.log(`Connection closed: ${connectionId}`);
      this.cleanupConnection(connectionId);
    });
  }

  private handleMessage(message: ProtocolMessage, connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.lastActivity = Date.now();
    connection.isAlive = true;

    console.log(`Received ${message.type} from ${connectionId}:`, message.payload);

    switch (message.type) {
      case 'data':
        // Echo back the data
        this.sendMessage(connection.socket, {
          type: 'data',
          payload: message.payload,
          timestamp: Date.now(),
          id: message.id
        });
        break;

      case 'ping':
        // Respond with pong
        this.sendMessage(connection.socket, {
          type: 'pong',
          payload: { message: 'pong' },
          timestamp: Date.now(),
          id: message.id
        });
        break;

      case 'keepalive':
        // Acknowledge keep-alive
        this.sendMessage(connection.socket, {
          type: 'keepalive',
          payload: { status: 'alive' },
          timestamp: Date.now(),
          id: message.id
        });
        break;

      case 'close':
        // Gracefully close connection
        this.sendMessage(connection.socket, {
          type: 'close',
          payload: { message: 'Connection closed by client' },
          timestamp: Date.now()
        });
        connection.socket.end();
        break;

      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  private sendMessage(socket: net.Socket, message: ProtocolMessage): void {
    socket.write(JSON.stringify(message) + '\n');
  }

  private startKeepAlive(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Send keep-alive messages periodically
    connection.keepAliveInterval = setInterval(() => {
      if (connection.isAlive) {
        this.sendMessage(connection.socket, {
          type: 'keepalive',
          payload: { message: 'keepalive' },
          timestamp: Date.now()
        });
      }
    }, this.keepAliveInterval);

    // Check for timeout
    setInterval(() => {
      const now = Date.now();
      if (now - connection.lastActivity > this.keepAliveTimeout) {
        console.log(`Connection ${connectionId} timed out`);
        connection.socket.destroy();
        this.cleanupConnection(connectionId);
      }
    }, this.keepAliveTimeout);
  }

  private cleanupConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      if (connection.keepAliveInterval) {
        clearInterval(connection.keepAliveInterval);
      }
      this.connections.delete(connectionId);
    }
  }

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`TCP server listening on port ${this.port}`);
      console.log(`Keep-alive timeout: ${this.keepAliveTimeout}ms`);
      console.log(`Keep-alive interval: ${this.keepAliveInterval}ms`);
    });
  }

  public stop(): void {
    // Clean up all connections
    for (const [connectionId, connection] of this.connections) {
      if (connection.keepAliveInterval) {
        clearInterval(connection.keepAliveInterval);
      }
      connection.socket.destroy();
    }
    this.connections.clear();

    this.server.close(() => {
      console.log('Server stopped');
    });
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }

  public getConnections(): string[] {
    return Array.from(this.connections.keys());
  }
}

// Create and start the server with custom keep-alive settings
const server = new TCPServer(4000, 30000, 10000); // 30s timeout, 10s interval
server.start();










