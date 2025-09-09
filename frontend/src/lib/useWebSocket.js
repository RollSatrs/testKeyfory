import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (onMessage) => {
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeout = useRef(null);
  const shouldReconnect = useRef(true);

  const connect = () => {
    try {
      // Определяем WebSocket URL на основе текущего хоста
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = process.env.REACT_APP_BACKEND_PORT || '3000';
      const wsUrl = `${protocol}//${host}:${port}`;

      console.log(`🔌 Подключение к WebSocket: ${wsUrl}`);

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('🔌 WebSocket подключение установлено');
        setIsConnected(true);

        // Очищаем таймер переподключения
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket сообщение получено:', data);

          if (onMessage) {
            onMessage(data);
          }
        } catch (error) {
          console.error('❌ Ошибка парсинга WebSocket сообщения:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('🔌 WebSocket соединение закрыто:', event.code, event.reason);
        setIsConnected(false);

        // Переподключение если это не было намеренное закрытие
        if (shouldReconnect.current && !reconnectTimeout.current) {
          console.log('🔄 Переподключение через 3 секунды...');
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket ошибка:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('❌ Ошибка создания WebSocket подключения:', error);

      // Попытка переподключения при ошибке
      if (shouldReconnect.current && !reconnectTimeout.current) {
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, 5000);
      }
    }
  };

  const disconnect = () => {
    shouldReconnect.current = false;

    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    setIsConnected(false);
  };

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('⚠️ WebSocket не подключен, сообщение не отправлено');
      return false;
    }
  };

  // Подключение при монтировании компонента
  useEffect(() => {
    shouldReconnect.current = true;
    connect();

    // Ping каждые 30 секунд для поддержания соединения
    const pingInterval = setInterval(() => {
      if (isConnected) {
        sendMessage({ type: 'ping' });
      }
    }, 30000);

    // Очистка при размонтировании
    return () => {
      clearInterval(pingInterval);
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isConnected,
    sendMessage,
    disconnect
  };
};
