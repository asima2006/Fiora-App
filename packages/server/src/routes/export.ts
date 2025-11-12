import assert from 'assert';
import { Types } from '@fiora/database/mongoose';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

import logger from '@fiora/utils/logger';
import User from '@fiora/database/mongoose/models/user';
import Group from '@fiora/database/mongoose/models/group';
import Message from '@fiora/database/mongoose/models/message';
import Friend from '@fiora/database/mongoose/models/friend';
import { Redis } from '@fiora/database/redis/initRedis';

const { isValid } = Types.ObjectId;

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Bulk export all conversations for a user
 * @param ctx Context
 */
export async function exportAllConversations(
    ctx: Context<{ format?: 'json' | 'txt' | 'html' }>,
) {
    const { format = 'json' } = ctx.data;
    const userId = ctx.socket.user.toString();

    // Get all groups the user is a member of
    const groups = await Group.find({ members: userId }, { _id: 1, name: 1 });

    // Get all friends
    const friends = await Friend.find({ from: userId }).populate('to', {
        username: 1,
    });

    const exports: any[] = [];

    // Export group messages (run queries concurrently)
    {
        const groupExports = await Promise.all(
            groups.map(async (group) => {
                try {
                    const messages = await Message.find(
                        { to: group._id },
                        {
                            type: 1,
                            content: 1,
                            from: 1,
                            createTime: 1,
                            deleted: 1,
                        },
                    )
                        .populate('from', { username: 1, avatar: 1, tag: 1 })
                        .sort({ createTime: 1 });

                    if (messages.length > 0) {
                        return {
                            linkman: {
                                id: group._id,
                                name: group.name,
                                type: 'group',
                            },
                            messageCount: messages.length,
                            messages: messages.map((msg: any) => ({
                                id: msg._id,
                                from: msg.from,
                                type: msg.type,
                                content: msg.content,
                                createTime: msg.createTime,
                                deleted: msg.deleted,
                            })),
                        };
                    }
                    return null;
                } catch (error) {
                    logger.error(
                        `[exportAllConversations] Error exporting group ${
                            group._id
                        }: ${(error as Error).message}`,
                    );
                    return null;
                }
            }),
        );

        groupExports.filter(Boolean).forEach((g) => exports.push(g as any));
    }

    // Export friend messages (run queries concurrently)
    {
        const friendExports = await Promise.all(
            friends.map(async (friend) => {
                try {
                    const friendUserId = (friend.to as any)._id.toString();
                    const linkmanId =
                        userId < friendUserId
                            ? userId + friendUserId
                            : friendUserId + userId;

                    const messages = await Message.find(
                        { to: linkmanId },
                        {
                            type: 1,
                            content: 1,
                            from: 1,
                            createTime: 1,
                            deleted: 1,
                        },
                    )
                        .populate('from', { username: 1, avatar: 1, tag: 1 })
                        .sort({ createTime: 1 });

                    if (messages.length > 0) {
                        return {
                            linkman: {
                                id: friendUserId,
                                name: (friend.to as any).username,
                                type: 'friend',
                            },
                            messageCount: messages.length,
                            messages: messages.map((msg: any) => ({
                                id: msg._id,
                                from: msg.from,
                                type: msg.type,
                                content: msg.content,
                                createTime: msg.createTime,
                                deleted: msg.deleted,
                            })),
                        };
                    }
                    return null;
                } catch (error) {
                    logger.error(
                        `[exportAllConversations] Error exporting friend messages: ${
                            (error as Error).message
                        }`,
                    );
                    return null;
                }
            }),
        );

        friendExports.filter(Boolean).forEach((f) => exports.push(f as any));
    }

    const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        conversationCount: exports.length,
        totalMessages: exports.reduce((sum, exp) => sum + exp.messageCount, 0),
        conversations: exports,
    };

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `all_conversations_export_${timestamp}.${format}`;

    logger.info(
        `[exportAllConversations] User ${userId} exported ${exports.length} conversations with ${exportData.totalMessages} total messages`,
    );

    return {
        filename,
        conversationCount: exports.length,
        totalMessages: exportData.totalMessages,
        exportData: JSON.stringify(exportData, null, 2),
        mimeType: 'application/json',
    };
}

/**
 * Save a draft message (not yet sent)
 * @param ctx Context
 */
export async function saveDraft(
    ctx: Context<{
        linkmanId: string;
        content: string;
    }>,
) {
    const { linkmanId, content } = ctx.data;
    assert(linkmanId, 'LinkmanId cannot be empty');
    assert(content !== undefined, 'Content cannot be empty');

    const userId = ctx.socket.user.toString();
    const draftKey = `${userId}:${linkmanId}`;

    // Store draft in Redis with 7 days expiration
    await Redis.set(draftKey, content, Redis.Day * 7);

    return {
        msg: 'ok',
        linkmanId,
    };
}

/**
 * Get saved draft message
 * @param ctx Context
 */
export async function getDraft(ctx: Context<{ linkmanId: string }>) {
    const { linkmanId } = ctx.data;
    assert(linkmanId, 'LinkmanId cannot be empty');

    const userId = ctx.socket.user.toString();
    const draftKey = `draft:${userId}:${linkmanId}`;

    const content = await Redis.get(draftKey);

    return {
        linkmanId,
        content: content || '',
    };
}

/**
 * Delete a draft message
 * @param ctx Context
 */
export async function deleteDraft(ctx: Context<{ linkmanId: string }>) {
    const { linkmanId } = ctx.data;
    assert(linkmanId, 'LinkmanId cannot be empty');

    const userId = ctx.socket.user.toString();
    const draftKey = `draft:${userId}:${linkmanId}`;

    await Redis.del(draftKey);

    return {
        msg: 'ok',
        linkmanId,
    };
}

/**
 * Format messages as plain text
 */
function formatMessagesAsTxt(messages: any[], linkmanInfo: any): string {
    let txt = `Chat Export: ${linkmanInfo.name}\n`;
    txt += `Type: ${linkmanInfo.type}\n`;
    txt += `Export Date: ${new Date().toISOString()}\n`;
    txt += `Total Messages: ${messages.length}\n`;
    txt += `${'='.repeat(60)}\n\n`;

    messages.forEach((msg) => {
        const date = new Date(msg.createTime).toLocaleString();
        const username = msg.from?.username || 'Unknown';
        const deleted = msg.deleted ? ' [DELETED]' : '';

        txt += `[${date}] ${username}${deleted}\n`;

        if (msg.type === 'text') {
            txt += `${msg.content}\n`;
        } else if (msg.type === 'system') {
            try {
                const systemMsg = JSON.parse(msg.content);
                txt += `[System: ${systemMsg.command}] ${JSON.stringify(
                    systemMsg,
                )}\n`;
            } catch {
                txt += `[${msg.type}] ${msg.content}\n`;
            }
        } else {
            txt += `[${msg.type}]\n`;
        }
        txt += '\n';
    });

    return txt;
}

/**
 * Format messages as HTML
 */
function formatMessagesAsHtml(messages: any[], linkmanInfo: any): string {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Export - ${linkmanInfo.name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .header .info {
            color: #666;
            font-size: 14px;
        }
        .messages {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .message {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }
        .message:last-child {
            border-bottom: none;
        }
        .message-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .username {
            font-weight: bold;
            color: #1890ff;
        }
        .timestamp {
            color: #999;
            font-size: 12px;
        }
        .message-content {
            color: #333;
            line-height: 1.6;
            word-wrap: break-word;
        }
        .deleted {
            opacity: 0.5;
            text-decoration: line-through;
        }
        .system-message {
            background: #f0f0f0;
            padding: 8px 12px;
            border-radius: 4px;
            font-style: italic;
        }
        .media-message {
            background: #e6f7ff;
            padding: 8px 12px;
            border-radius: 4px;
            color: #0050b3;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Chat Export: ${linkmanInfo.name}</h1>
        <div class="info">
            <div>Type: ${linkmanInfo.type}</div>
            <div>Export Date: ${new Date().toLocaleString()}</div>
            <div>Total Messages: ${messages.length}</div>
        </div>
    </div>
    <div class="messages">
        ${messages
        .map((msg) => {
            const date = new Date(msg.createTime).toLocaleString();
            const username = msg.from?.username || 'Unknown';
            const deletedClass = msg.deleted ? 'deleted' : '';

            let contentHtml = '';
            if (msg.type === 'text') {
                contentHtml = `<div class="message-content ${deletedClass}">${escapeHtml(
                    msg.content,
                )}</div>`;
            } else if (msg.type === 'system') {
                try {
                    const systemMsg = JSON.parse(msg.content);
                    contentHtml = `<div class="system-message">${
                        systemMsg.command
                    }: ${JSON.stringify(systemMsg)}</div>`;
                } catch {
                    contentHtml = `<div class="system-message">${escapeHtml(
                        msg.content,
                    )}</div>`;
                }
            } else {
                contentHtml = `<div class="media-message">[${msg.type}]</div>`;
            }

            return `
                <div class="message">
                    <div class="message-header">
                        <span class="username">${escapeHtml(
        username,
    )}</span>
                        <span class="timestamp">${date}</span>
                    </div>
                    ${contentHtml}
                </div>
            `;
        })
        .join('')}
    </div>
</body>
</html>`;

    return html;
}

/**
 * Export chat messages to JSON format
 * @param ctx Context
 */
export async function exportMessages(
    ctx: Context<{
        linkmanId: string;
        format?: 'json' | 'txt' | 'html';
        startDate?: string;
        endDate?: string;
    }>,
) {
    const { linkmanId, format = 'json', startDate, endDate } = ctx.data;
    assert(linkmanId, 'LinkmanId cannot be empty');
    assert(isValid(linkmanId) || linkmanId.length === 24, 'Invalid contact ID');

    // Build query filter
    const query: any = { to: linkmanId };
    if (startDate || endDate) {
        query.createTime = {};
        if (startDate) {
            query.createTime.$gte = new Date(startDate);
        }
        if (endDate) {
            query.createTime.$lte = new Date(endDate);
        }
    }

    // Fetch messages
    const messages = await Message.find(query, {
        type: 1,
        content: 1,
        from: 1,
        createTime: 1,
        deleted: 1,
    })
        .populate('from', { username: 1, avatar: 1, tag: 1 })
        .sort({ createTime: 1 });

    assert(messages.length > 0, 'No messages found');

    // Get linkman info (group or user)
    let linkmanInfo: any = null;
    let linkmanType = 'unknown';

    if (isValid(linkmanId)) {
        const group = await Group.findOne({ _id: linkmanId });
        if (group) {
            linkmanInfo = {
                id: group._id,
                name: group.name,
                type: 'group',
            };
            linkmanType = 'group';
        }
    } else {
        // It's a friend conversation
        const userId = ctx.socket.user.toString();
        const friendId = linkmanId.replace(userId, '');
        const friend = await User.findOne({ _id: friendId });
        if (friend) {
            linkmanInfo = {
                id: friendId,
                name: friend.username,
                type: 'friend',
            };
            linkmanType = 'friend';
        }
    }

    assert(linkmanInfo, 'Contact does not exist');

    // Format messages based on requested format
    let exportData: string;
    let fileExtension: string;
    let mimeType: string;

    switch (format) {
        case 'txt':
            exportData = formatMessagesAsTxt(messages, linkmanInfo);
            fileExtension = 'txt';
            mimeType = 'text/plain';
            break;
        case 'html':
            exportData = formatMessagesAsHtml(messages, linkmanInfo);
            fileExtension = 'html';
            mimeType = 'text/html';
            break;
        case 'json':
        default:
            exportData = JSON.stringify(
                {
                    linkman: linkmanInfo,
                    exportDate: new Date().toISOString(),
                    messageCount: messages.length,
                    messages: messages.map((msg) => ({
                        id: msg._id,
                        from: msg.from,
                        type: msg.type,
                        content: msg.content,
                        createTime: msg.createTime,
                        deleted: msg.deleted,
                    })),
                },
                null,
                2,
            );
            fileExtension = 'json';
            mimeType = 'application/json';
            break;
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `chat_export_${linkmanInfo.name}_${timestamp}.${fileExtension}`;

    // Save file to server (optional - can be disabled for production)
    const exportDir = path.resolve(process.cwd(), 'exports');
    const dirExists = await exists(exportDir);
    if (!dirExists) {
        await mkdir(exportDir, { recursive: true });
    }

    const filePath = path.join(exportDir, filename);
    await writeFile(filePath, exportData, 'utf8');

    logger.info(
        `[exportMessages] User ${ctx.socket.user} exported ${messages.length} messages to ${filename}`,
    );

    return {
        filename,
        messageCount: messages.length,
        linkmanType,
        linkmanName: linkmanInfo.name,
        exportData, // Return data for client-side download
        mimeType,
    };
}

