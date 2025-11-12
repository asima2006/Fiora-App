import React from 'react';
import { getRandomColor } from '@fiora/utils/getRandomColor';

export const avatarFailback = '/avatar/0.jpg';

type Props = {
    /** Avatar link (used for generating color seed) */
    src: string;
    /** Display size */
    size?: number;
    /** Extra class name */
    className?: string;
    /** Click event */
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    /** Name for displaying initials */
    name?: string;
    /** Type: 'user' shows initials, 'group' shows image */
    type?: 'user' | 'group';
};

function Avatar({
    src,
    size = 60,
    className = '',
    onClick,
    onMouseEnter,
    onMouseLeave,
    name,
    type = 'user',
}: Props) {
    // For groups, show the image
    if (type === 'group') {
        return (
            <img
                className={`Avatar ${className}`}
                style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    objectFit: 'cover',
                    cursor: onClick ? 'pointer' : 'default',
                    flexShrink: 0,
                }}
                src={src}
                alt="avatar"
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            />
        );
    }

    // For users, show initials with theme color
    const getInitial = () => {
        if (name && name.length > 0) {
            return name.charAt(0).toUpperCase();
        }
        // Try to extract from src if it's a URL with username
        const urlMatch = src.match(/\/([^/]+)\.(jpg|png|jpeg|gif)/);
        if (urlMatch && urlMatch[1]) {
            return urlMatch[1].charAt(0).toUpperCase();
        }
        return '?';
    };

    const initial = getInitial();
    const backgroundColor = getRandomColor(src, 'bright');

    const commonProps = {
        className: `Avatar ${className}`,
        style: {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: size * 0.4,
            fontWeight: 600,
            cursor: onClick ? 'pointer' : 'default',
            userSelect: 'none',
            flexShrink: 0,
        } as React.CSSProperties,
        ...(onClick && { onClick }),
        ...(onMouseEnter && { onMouseEnter }),
        ...(onMouseLeave && { onMouseLeave }),
    };

    return (
        <div
            {...commonProps}
            role="img"
            aria-label={name || 'avatar'}
        >
            {initial}
        </div>
    );
}

export default Avatar;
