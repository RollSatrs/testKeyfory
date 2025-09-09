import { WebSocketServer as WSServer, WebSocket } from 'ws';

class WebSocketServer {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  initialize(server) {
    this.wss = new WSServer({ server });

    this.wss.on('connection', (ws, request) => {
      console.log('🔌 Новое WebSocket соединение установлено');

      this.clients.add(ws);

      // Отправляем приветственное сообщение
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'WebSocket соединение установлено',
        timestamp: new Date().toISOString()
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('📨 Получено сообщение от клиента:', data);

          // Обработка ping/pong для поддержания соединения
          if (data.type === 'ping') {
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
          }
        } catch (error) {
          console.error('❌ Ошибка обработки WebSocket сообщения:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket соединение закрыто');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket ошибка:', error);
        this.clients.delete(ws);
      });
    });

    console.log('🔌 WebSocket сервер инициализирован');
  }

  // Отправка обновления всем подключенным клиентам
  broadcast(data) {
    const message = JSON.stringify({
      ...data,
      timestamp: new Date().toISOString()
    });

    console.log(`📡 Отправляем broadcast сообщение ${this.clients.size} клиентам:`, data);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('❌ Ошибка отправки сообщения клиенту:', error);
          this.clients.delete(client);
        }
      } else {
        // Удаляем неактивные соединения
        this.clients.delete(client);
      }
    });
  }

  // Уведомления о различных событиях
  notifyExecuterUpdate(executerId, data) {
    this.broadcast({
      type: 'executer_update',
      executerId,
      data
    });
  }

  notifyOrderUpdate(orderId, data) {
    this.broadcast({
      type: 'order_update',
      orderId,
      data
    });
  }

  notifyServiceUpdate(serviceId, data) {
    this.broadcast({
      type: 'service_update',
      serviceId,
      data
    });
  }

  notifyServiceAssignment(executerId, serviceId, action) {
    this.broadcast({
      type: 'service_assignment',
      executerId,
      serviceId,
      action // 'assigned' или 'unassigned'
    });
  }

  notifyOrderStatusChange(orderId, oldStatus, newStatus, executerId) {
    this.broadcast({
      type: 'order_status_change',
      orderId,
      oldStatus,
      newStatus,
      executerId
    });
  }

  getConnectedClientsCount() {
    return this.clients.size;
  }
}

// Создаем единственный экземпляр
const websocketServer = new WebSocketServer();

export default websocketServer;
