import { io } from "socket.io-client";
/**
 * Create a socket.io client for testing
 */
export function createSocketClient(port = 3000, token?: string) {
    const options: any = {
        transports: ['websocket'],
        forceNew: true,
    };

    if (token) {
        options.auth = { token };
    }

    return io(`http://localhost:${port}`, options);
}

/**
 * Wait for socket event
 */
export function waitForSocketEvent(
    socket: any,
    eventName: string,
    timeout = 5000,
): Promise<any> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timeout waiting for event: ${eventName}`));
        }, timeout);

        socket.once(eventName, (data: any) => {
            clearTimeout(timer);
            resolve(data);
        });
    });
}

/**
 * Disconnect socket client
 */
export function disconnectSocket(socket: any) {
    if (socket.connected) {
        socket.disconnect();
    }
}
