export function getSocketIp(socket: any) {
    return (
        (socket.handshake.headers['x-real-ip'] as string) ||
        socket.request.connection.remoteAddress ||
        ''
    );
}
