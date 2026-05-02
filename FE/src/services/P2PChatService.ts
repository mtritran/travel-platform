import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface P2PMessage {
    id?: string;
    senderEmail: string;
    recipientId: string;
    content: string;
    createdAt?: string;
    user?: { fullName: string; email: string; };
}

class P2PChatService {
    private client: Client | null = null;
    public isConnected = false;
    // Hàng đợi tin nhắn nếu gửi trước khi kết nối xong
    private pendingMessages: Array<{ senderEmail: string; recipientId: string; content: string }> = [];

    connect(userEmail: string, onMessageReceived: (msg: any) => void, onConnected?: () => void) {
        // Nếu đã kết nối rồi thì không tạo lại
        if (this.isConnected && this.client?.connected) {
            console.log('[STOMP] Already connected, skipping reconnect');
            onConnected?.(); // Thông báo ngay nếu đã sẵn sàng
            return;
        }

        // Cleanup kết nối cũ nếu có
        if (this.client) {
            this.client.deactivate();
            this.client = null;
        }

        const token = localStorage.getItem('token');

        this.client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
            debug: (str) => console.log('[STOMP] ' + str),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('[STOMP] Connected as', userEmail);
                this.isConnected = true;
                onConnected?.(); // Thông báo component đã sẵn sàng

                // Subscribe vào topic cá nhân theo email
                this.client?.subscribe(`/topic/messages/${userEmail}`, (message: IMessage) => {
                    try {
                        onMessageReceived(JSON.parse(message.body));
                    } catch (e) {
                        console.error('[STOMP] Failed to parse message', e);
                    }
                });

                // Gửi các tin nhắn đang chờ (nếu có)
                if (this.pendingMessages.length > 0) {
                    console.log(`[STOMP] Flushing ${this.pendingMessages.length} pending messages`);
                    this.pendingMessages.forEach(msg => this.publish(msg));
                    this.pendingMessages = [];
                }
            },
            onDisconnect: () => {
                console.log('[STOMP] Disconnected');
                this.isConnected = false;
            },
            onStompError: (frame) => {
                console.error('[STOMP] Broker error:', frame.headers['message']);
                this.isConnected = false;
            }
        });

        this.client.activate();
    }

    private publish(msg: { senderEmail: string; recipientId: string; content: string }) {
        this.client?.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(msg)
        });
    }

    sendMessage(senderEmail: string, recipientId: string, content: string) {
        const msg = { senderEmail, recipientId, content };
        if (this.client && this.isConnected) {
            // Kết nối sẵn sàng → gửi ngay
            this.publish(msg);
        } else {
            // Chưa kết nối → đưa vào hàng đợi
            console.warn('[STOMP] Not connected yet, queuing message');
            this.pendingMessages.push(msg);
        }
    }

    disconnect() {
        this.isConnected = false;
        this.pendingMessages = [];
        if (this.client) {
            this.client.deactivate();
            this.client = null;
        }
    }
}

export const p2pChatService = new P2PChatService();
