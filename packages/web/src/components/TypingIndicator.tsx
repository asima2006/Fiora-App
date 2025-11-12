import React from 'react';
import Style from './TypingIndicator.less';

interface TypingIndicatorProps {
    usernames: string[];
}

function TypingIndicator({ usernames }: TypingIndicatorProps) {
    if (usernames.length === 0) {
        return null;
    }

    let text = '';
    if (usernames.length === 1) {
        text = `${usernames[0]} is typing`;
    } else if (usernames.length === 2) {
        text = `${usernames[0]} and ${usernames[1]} are typing`;
    } else {
        text = `${usernames[0]} and ${usernames.length - 1} others are typing`;
    }

    return (
        <div className={Style.typingIndicator}>
            <div className={Style.dots}>
                <span />
                <span />
                <span />
            </div>
            <span className={Style.text}>{text}...</span>
        </div>
    );
}

export default TypingIndicator;
