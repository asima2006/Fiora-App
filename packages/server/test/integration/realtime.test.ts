import User from '@fiora/database/mongoose/models/user';
import Group from '@fiora/database/mongoose/models/group';
import Message from '@fiora/database/mongoose/models/message';
import {
    createSocketClient,
    waitForSocketEvent,
    disconnectSocket,
} from '../helpers/socket';
import { connectDatabase, closeDatabase, clearDatabase } from '../helpers/database';

describe('Real-time Features Integration Tests', () => {
    let socket1: any;
    let socket2: any;
    let user1Id: string;
    let user2Id: string;
    let groupId: string;

    beforeAll(async () => {
        await connectDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    beforeEach(async () => {
        await clearDatabase();

        // Create test users
        const user1 = await User.create({
            username: 'user1',
            password: 'password123',
            avatar: 'avatar1.png',
        });
        user1Id = user1._id.toString();

        const user2 = await User.create({
            username: 'user2',
            password: 'password123',
            avatar: 'avatar2.png',
        });
        user2Id = user2._id.toString();

        // Create test group
        const group = await Group.create({
            name: 'Test Group',
            avatar: 'group.png',
            creator: user1Id,
            members: [user1Id, user2Id],
        });
        groupId = group._id.toString();

        // Connect socket clients
        socket1 = createSocketClient();
        socket2 = createSocketClient();

        await Promise.all([
            waitForSocketEvent(socket1, 'connect'),
            waitForSocketEvent(socket2, 'connect'),
        ]);
    });

    afterEach(() => {
        disconnectSocket(socket1);
        disconnectSocket(socket2);
    });

    describe('Typing Indicators', () => {
        it('should broadcast typing indicator to other users', async () => {
            const typingPromise = waitForSocketEvent(socket2, 'typing');

            socket1.emit('sendTypingIndicator', {
                to: groupId,
                isTyping: true,
            });

            const typingData = await typingPromise;
            expect(typingData.userId).toBe(user1Id);
            expect(typingData.linkmanId).toBe(groupId);
            expect(typingData.isTyping).toBe(true);
        });

        it('should stop typing indicator when user stops typing', async () => {
            socket1.emit('sendTypingIndicator', {
                to: groupId,
                isTyping: true,
            });

            const stopTypingPromise = waitForSocketEvent(socket2, 'typing');

            socket1.emit('sendTypingIndicator', {
                to: groupId,
                isTyping: false,
            });

            const typingData = await stopTypingPromise;
            expect(typingData.isTyping).toBe(false);
        });
    });

    describe('Read Receipts', () => {
        it('should send read receipt when message is read', async () => {
            // Create a test message
            const message = await Message.create({
                from: user1Id,
                to: groupId,
                type: 'text',
                content: 'Test message',
            });
            const messageId = message._id.toString();

            const receiptPromise = waitForSocketEvent(socket1, 'readReceipt');

            socket2.emit('sendReadReceipt', {
                messageId,
                linkmanId: groupId,
            });

            const receiptData = await receiptPromise;
            expect(receiptData.messageId).toBe(messageId);
            expect(receiptData.userId).toBe(user2Id);

            // Verify message was updated
            const updatedMessage = await Message.findById(messageId);
            expect(updatedMessage?.readBy).toContain(user2Id);
        });
    });

    describe('Delivery Receipts', () => {
        it('should send delivery receipt when message is delivered', async () => {
            // Create a test message
            const message = await Message.create({
                from: user1Id,
                to: groupId,
                type: 'text',
                content: 'Test message',
            });
            const messageId = message._id.toString();

            const receiptPromise = waitForSocketEvent(socket1, 'deliveryReceipt');

            socket2.emit('sendDeliveryReceipt', {
                messageId,
                linkmanId: groupId,
            });

            const receiptData = await receiptPromise;
            expect(receiptData.messageId).toBe(messageId);
            expect(receiptData.userId).toBe(user2Id);

            // Verify message was updated
            const updatedMessage = await Message.findById(messageId);
            expect(updatedMessage?.deliveredTo).toContain(user2Id);
        });
    });

    describe('Group Member Role Updates', () => {
        it('should broadcast role update to all group members', async () => {
            const roleUpdatePromise = waitForSocketEvent(
                socket2,
                'groupMemberRoleUpdated',
            );

            socket1.emit('updateGroupMemberRole', {
                groupId,
                userId: user2Id,
                role: 'admin',
            });

            const roleData = await roleUpdatePromise;
            expect(roleData.groupId).toBe(groupId);
            expect(roleData.userId).toBe(user2Id);
            expect(roleData.role).toBe('admin');
        });

        it('should broadcast member kick to all group members', async () => {
            const kickPromise = waitForSocketEvent(socket2, 'memberKicked');

            socket1.emit('kickGroupMember', {
                groupId,
                userId: user2Id,
            });

            const kickData = await kickPromise;
            expect(kickData.groupId).toBe(groupId);
            expect(kickData.userId).toBe(user2Id);
            expect(kickData.kickedBy).toBe(user1Id);
        });
    });
});
