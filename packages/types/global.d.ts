declare module 'os-locale' {
	const osLocale: any;
	export default osLocale;
}

declare module 'log4js' {
	export function getLogger(name?: string): any;
	export default getLogger;
}

declare module 'socket.io' {
	// Minimal Socket type for server code/tests to compile; consider installing real types
	export type Socket = any;
	export class Server {
		constructor(server?: any, opts?: any);
		on(event: 'connection', cb: (socket: Socket) => void): this;
	}
}

declare module 'xss' {
	const xss: any;
	export default xss;
}
