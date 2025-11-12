import Message from '../components/Message';
import socket from '../socket';

import { SEAL_TEXT, SEAL_USER_TIMEOUT } from '../../../utils/const';

/** Whether the user is banned */
let isSeal = false;

export default function fetch<T = any>(
    event: string,
    data = {},
    { toast = true } = {},
): Promise<[string | null, T | null]> {
    if (isSeal) {
        Message.error(SEAL_TEXT);
        return Promise.resolve([SEAL_TEXT, null]);
    }
    return new Promise((resolve) => {
        socket.emit(event, data, (res: any) => {
            if (typeof res === 'string') {
                if (toast) {
                    Message.error(res);
                }
                /**
                 * After the server returns the ban status, store the status locally
                 * When the user triggers interface requests again, directly reject
                 */
                if (res === SEAL_TEXT) {
                    isSeal = true;
                    // User ban and IP ban have different durations, here uses short time
                    setTimeout(() => {
                        isSeal = false;
                    }, SEAL_USER_TIMEOUT);
                }
                resolve([res, null]);
            } else {
                resolve([null, res]);
            }
        });
    });
}
