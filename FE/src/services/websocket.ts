import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

const SOCKET_URL = 'http://localhost:8080/ws';

export const createStompClient = (onConnect: () => void, onMessage: (msg: any) => void, userId: string) => {
  const socket = new SockJS(SOCKET_URL);
  const client = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      onConnect();
      
      // Subscribe to private notifications (Topic-based)
      client.subscribe(`/topic/user-${userId}`, (message) => {
        if (message.body) {
          onMessage(JSON.parse(message.body));
        }
      });

      // Subscribe to public tour requests (for guides)
      client.subscribe(`/topic/requests`, (message) => {
        if (message.body) {
          onMessage(JSON.parse(message.body));
        }
      });
    },
    onStompError: (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    },
  });

  return client;
};
