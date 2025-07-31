# SecureAgentMessaging

A robust, production-ready TCP communication protocol implementation with dynamic keep-alive functionality, designed to serve as the foundation for secure communication systems.

## 🎯 Project Goals

This project aims to develop a **secure communication protocol** that provides:

- **Reliable Connection Management**: Dynamic keep-alive mechanisms with configurable timeouts
- **Protocol Standardization**: Structured message types for different communication needs
- **Connection Health Monitoring**: Built-in ping/pong and keep-alive functionality
- **Scalable Architecture**: Class-based design for easy extension and customization
- **Production Readiness**: Error handling, connection cleanup, and graceful shutdown

## 🏗️ Architecture

### Protocol Message Types

The protocol supports several message types for different communication scenarios:

| Message Type | Purpose | Payload |
|-------------|---------|---------|
| `data` | Regular data transmission | Any JSON-serializable data |
| `ping` | Connection health check | Optional metadata |
| `pong` | Response to ping | Status information |
| `keepalive` | Connection maintenance | Heartbeat data |
| `close` | Graceful disconnection | Disconnect reason |

### Message Structure

```typescript
interface ProtocolMessage {
  type: 'data' | 'keepalive' | 'ping' | 'pong' | 'close';
  payload?: any;
  timestamp: number;
  id?: string;
}
```

## 🚀 Features

### Server (`index.ts`)
- **Multi-Connection Support**: Tracks multiple client connections with unique IDs
- **Dynamic Keep-Alive**: Configurable timeout and interval settings
- **Automatic Cleanup**: Removes stale connections and manages resources
- **Message Echo**: Responds to data messages with the same payload
- **Health Monitoring**: Responds to pings and manages keep-alive messages
- **Connection Statistics**: Provides connection count and active connection list

### Client (`client/index.ts`)
- **Automatic Reconnection**: Built-in connection management
- **Keep-Alive Participation**: Sends periodic keep-alive messages
- **Timeout Detection**: Automatically detects and handles connection timeouts
- **Message Queuing**: Structured message sending with unique IDs
- **Connection Status**: Real-time connection state tracking

## 📦 Installation

```bash
# Install dependencies
bun install

# Or with npm
npm install
```

## 🏃‍♂️ Usage

### Starting the Server

```bash
# Start the TCP server
bun index.ts

# Or with Node.js
node index.ts
```

The server will start listening on port 4000 with default settings:
- Keep-alive timeout: 30 seconds
- Keep-alive interval: 10 seconds

### Starting the Client

```bash
# Start the TCP client
bun client/index.ts

# Or with Node.js
node client/index.ts
```

The client will:
1. Connect to the server
2. Send initial data message
3. Send ping after 5 seconds
4. Send another data message after 10 seconds
5. Gracefully disconnect after 30 seconds

## ⚙️ Configuration

### Server Configuration

```typescript
// Custom server with different keep-alive settings
const server = new TCPServer(
  4000,        // Port
  60000,       // Keep-alive timeout (60 seconds)
  15000        // Keep-alive interval (15 seconds)
);
```

### Client Configuration

```typescript
// Custom client with different keep-alive settings
const client = new TCPClient(
  'localhost',  // Host
  4000,         // Port
  60000,        // Keep-alive timeout (60 seconds)
  15000         // Keep-alive interval (15 seconds)
);
```

## 🔧 API Reference

### TCPServer Class

```typescript
class TCPServer {
  constructor(port: number, keepAliveTimeout: number, keepAliveInterval: number)
  
  // Start the server
  start(): void
  
  // Stop the server and cleanup connections
  stop(): void
  
  // Get current connection count
  getConnectionCount(): number
  
  // Get list of active connection IDs
  getConnections(): string[]
}
```

### TCPClient Class

```typescript
class TCPClient {
  constructor(host: string, port: number, keepAliveTimeout: number, keepAliveInterval: number)
  
  // Connect to server
  connect(): void
  
  // Send data message
  send(data: any): void
  
  // Send ping message
  ping(): void
  
  // Gracefully disconnect
  disconnect(): void
  
  // Check connection status
  isConnectedToServer(): boolean
  
  // Get last activity timestamp
  getLastActivity(): number
}
```

## 🔒 Security Considerations

This protocol serves as the foundation for secure communication. Future enhancements will include:

- **Encryption**: TLS/SSL integration for data encryption
- **Authentication**: Client-server authentication mechanisms
- **Message Signing**: Digital signatures for message integrity
- **Access Control**: Role-based permissions and authorization
- **Audit Logging**: Comprehensive logging for security monitoring

## 🧪 Testing

### Manual Testing

1. Start the server in one terminal:
   ```bash
   bun index.ts
   ```

2. Start the client in another terminal:
   ```bash
   bun client/index.ts
   ```

3. Observe the communication logs in both terminals

### Expected Behavior

**Server Output:**
```
TCP server listening on port 4000
Keep-alive timeout: 30000ms
Keep-alive interval: 10000ms
Client connected: 127.0.0.1:12345
Received data from 127.0.0.1:12345: { name: 'John', age: 30, email: 'john@example.com' }
Received ping from 127.0.0.1:12345: { message: 'ping' }
Received data from 127.0.0.1:12345: { message: 'Hello again!', timestamp: 1234567890 }
Client disconnected: 127.0.0.1:12345
```

**Client Output:**
```
Connected to server
Data received: { name: 'John', age: 30, email: 'john@example.com' }
Pong received
Data received: { message: 'Hello again!', timestamp: 1234567890 }
Keep-alive received
Disconnecting after 30 seconds...
Disconnected from server
```

## 🚧 Future Enhancements

- [ ] **TLS/SSL Integration**: Add encryption layer
- [ ] **Message Compression**: Implement data compression
- [ ] **Connection Pooling**: Support for connection reuse
- [ ] **Load Balancing**: Multiple server support
- [ ] **Metrics Collection**: Performance monitoring
- [ ] **Configuration Files**: External configuration support
- [ ] **Logging Framework**: Structured logging implementation
- [ ] **Unit Tests**: Comprehensive test coverage

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

**Built with ❤️ using TypeScript and Node.js**
