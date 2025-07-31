import net from "net";

interface ProtocolMessage {
  type: "data" | "keepalive" | "ping" | "pong" | "close";
  payload?: any;
  timestamp: number;
  id?: string;
}

class TCPClient {
  private client: net.Socket;
  private host: string;
  private port: number;
  private keepAliveTimeout: number;
  private keepAliveInterval: number;
  private keepAliveTimer?: NodeJS.Timeout;
  private timeoutTimer?: NodeJS.Timeout;
  private lastActivity: number;
  private isConnected: boolean = false;
  private messageId: number = 0;

  constructor(
    host: string = "localhost",
    port: number = 4000,
    keepAliveTimeout: number = 30000,
    keepAliveInterval: number = 10000
  ) {
    this.host = host;
    this.port = port;
    this.keepAliveTimeout = keepAliveTimeout;
    this.keepAliveInterval = keepAliveInterval;
    this.lastActivity = Date.now();
    this.client = new net.Socket();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on("connect", () => {
      console.log("Connected to server");
      this.isConnected = true;
      this.lastActivity = Date.now();
      this.startKeepAlive();
    });

    this.client.on("data", (data) => {
      this.lastActivity = Date.now();

      try {
        const message: ProtocolMessage = JSON.parse(data.toString().trim());
        this.handleMessage(message);
      } catch (error) {
        console.error("Invalid message format:", error);
      }
    });

    this.client.on("error", (err) => {
      console.error("Error:", err);
      this.isConnected = false;
    });

    this.client.on("end", () => {
      console.log("Disconnected from server");
      this.isConnected = false;
      this.stopKeepAlive();
    });

    this.client.on("close", () => {
      console.log("Connection closed");
      this.isConnected = false;
      this.stopKeepAlive();
    });
  }

  private handleMessage(message: ProtocolMessage): void {
    console.log(`Received ${message.type} from server:`, message.payload);

    switch (message.type) {
      case "data":
        console.log("Data received:", message.payload);
        break;

      case "pong":
        console.log("Pong received");
        break;

      case "keepalive":
        console.log("Keep-alive received");
        break;

      case "close":
        console.log("Server requested connection close");
        this.disconnect();
        break;

      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  private sendMessage(message: ProtocolMessage): void {
    if (!this.isConnected) {
      console.error("Not connected to server");
      return;
    }

    this.client.write(JSON.stringify(message) + "\n");
    this.lastActivity = Date.now();
  }

  private startKeepAlive(): void {
    // Send keep-alive messages periodically
    this.keepAliveTimer = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({
          type: "keepalive",
          payload: { message: "keepalive" },
          timestamp: Date.now(),
          id: `keepalive_${++this.messageId}`,
        });
      }
    }, this.keepAliveInterval);

    // Check for timeout
    this.timeoutTimer = setInterval(() => {
      const now = Date.now();
      if (now - this.lastActivity > this.keepAliveTimeout) {
        console.log("Connection timed out");
        this.client.destroy();
      }
    }, this.keepAliveTimeout);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = undefined;
    }
    if (this.timeoutTimer) {
      clearInterval(this.timeoutTimer);
      this.timeoutTimer = undefined;
    }
  }

  public connect(): void {
    this.client.connect(this.port, this.host);
  }

  public send(data: any): void {
    this.sendMessage({
      type: "data",
      payload: data,
      timestamp: Date.now(),
      id: `data_${++this.messageId}`,
    });
  }

  public ping(): void {
    this.sendMessage({
      type: "ping",
      payload: { message: "ping" },
      timestamp: Date.now(),
      id: `ping_${++this.messageId}`,
    });
  }

  public disconnect(): void {
    this.sendMessage({
      type: "close",
      payload: { message: "Client disconnecting" },
      timestamp: Date.now(),
    });

    setTimeout(() => {
      this.client.end();
    }, 100);
  }

  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  public getLastActivity(): number {
    return this.lastActivity;
  }
}

// Create and use the client with custom keep-alive settings
const client = new TCPClient("localhost", 4000, 30000, 10000); // 30s timeout, 10s interval
client.connect();

// Send initial data
setTimeout(() => {
  client.send({
    name: "John",
    age: 30,
    email: "john@example.com",
  });
}, 100);

// Send a ping after 5 seconds
setTimeout(() => {
  client.ping();
}, 5000);

// Send another message after 10 seconds
setTimeout(() => {
  client.send({
    message: "Hello again!",
    timestamp: Date.now(),
  });
}, 10000);

// Keep the connection alive for 30 seconds, then disconnect
setTimeout(() => {
  console.log("Disconnecting after 30 seconds...");
  client.disconnect();
}, 30000);
