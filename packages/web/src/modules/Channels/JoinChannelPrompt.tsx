import React from 'react';
import { css } from 'linaria';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import { subscribeChannel, getLinkmanHistoryMessages } from '../../service';
import useAction from '../../hooks/useAction';
import Message from '../../components/Message';

const styles = {
    container: css`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 40px;
        background: var(--background-color);
    `,
    avatar: css`
        margin-bottom: 24px;
    `,
    title: css`
        font-size: 28px;
        font-weight: 600;
        color: var(--primary-text-color);
        margin-bottom: 12px;
        text-align: center;
    `,
    description: css`
        font-size: 16px;
        color: var(--primary-text-color-5);
        margin-bottom: 8px;
        text-align: center;
        max-width: 500px;
    `,
    subscriberCount: css`
        font-size: 14px;
        color: var(--primary-text-color-4);
        margin-bottom: 32px;
    `,
    button: css`
        min-width: 180px;
        height: 44px;
        font-size: 16px;
    `,
};

interface JoinChannelPromptProps {
    channelId: string;
    channelName: string;
    channelAvatar: string;
    channelDescription?: string;
    subscriberCount?: number;
}

function JoinChannelPrompt({
    channelId,
    channelName,
    channelAvatar,
    channelDescription,
    subscriberCount = 0,
}: JoinChannelPromptProps) {
    const action = useAction();

    async function handleSubscribeChannel() {
        const channelRes = await subscribeChannel(channelId);
        if (channelRes) {
            // Update the channels state to include the new subscriber
            action.updateChannel(channelId, {
                subscribers: channelRes.subscribers,
                creator: channelRes.creator,
            });
            
            // Ensure the channel has all required properties for linkman
            const channelLinkman = {
                ...channelRes,
                type: 'channel',
                subscribers: channelRes.subscribers || [],
                messages: {},
                unread: 0,
            };
            
            // Remove the old linkman and add the updated one to trigger re-render
            action.removeLinkman(channelId);
            action.addLinkman(channelLinkman, true);

            const messages = await getLinkmanHistoryMessages(channelId, 0);
            if (messages) {
                action.addLinkmanHistoryMessages(channelId, messages);
            }
            
            Message.success('Successfully subscribed to channel!');
        }
    }

    return (
        <div className={styles.container}>
            <Avatar
                className={styles.avatar}
                size={120}
                src={channelAvatar}
                name={channelName}
                type="group"
            />
            <h1 className={styles.title}>{channelName}</h1>
            {channelDescription && (
                <p className={styles.description}>{channelDescription}</p>
            )}
            <p className={styles.subscriberCount}>
                {subscriberCount} {subscriberCount === 1 ? 'subscriber' : 'subscribers'}
            </p>
            <Button
                className={styles.button}
                onClick={handleSubscribeChannel}
            >
                Subscribe to Channel
            </Button>
        </div>
    );
}

export default JoinChannelPrompt;
