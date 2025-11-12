import React from 'react';
import Tooltip from './Tooltip';
import Style from './MessageStatus.less';

interface MessageStatusProps {
    delivered?: boolean;
    read?: boolean;
    deliveredCount?: number;
    readCount?: number;
    totalRecipients?: number;
}

function MessageStatus({
    delivered = false,
    read = false,
    deliveredCount = 0,
    readCount = 0,
    totalRecipients = 1,
}: MessageStatusProps) {
    if (read) {
        const tooltip =
            totalRecipients > 1
                ? `Read by ${readCount}/${totalRecipients}`
                : 'Read';
        return (
            <Tooltip overlay={<span>{tooltip}</span>} placement="top">
                <div className={`${Style.messageStatus} ${Style.read}`}>
                    <svg viewBox="0 0 16 15" width="16" height="15">
                        <path
                            fill="currentColor"
                            d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"
                        />
                    </svg>
                </div>
            </Tooltip>
        );
    }

    if (delivered) {
        const tooltip =
            totalRecipients > 1
                ? `Delivered to ${deliveredCount}/${totalRecipients}`
                : 'Delivered';
        return (
            <Tooltip overlay={<span>{tooltip}</span>} placement="top">
                <div className={`${Style.messageStatus} ${Style.delivered}`}>
                    <svg viewBox="0 0 16 15" width="16" height="15">
                        <path
                            fill="currentColor"
                            d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512z"
                        />
                    </svg>
                </div>
            </Tooltip>
        );
    }

    return (
        <Tooltip overlay={<span>Sent</span>} placement="top">
            <div className={`${Style.messageStatus} ${Style.sent}`}>
                <svg viewBox="0 0 16 15" width="16" height="15">
                    <path
                        fill="currentColor"
                        d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"
                    />
                </svg>
            </div>
        </Tooltip>
    );
}

export default MessageStatus;
