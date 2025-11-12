import supertest from 'supertest';

import User from '@fiora/database/mongoose/models/user';
import Group from '@fiora/database/mongoose/models/group';
import app from '../../src/app';
import { connectDatabase, closeDatabase } from '../helpers/database';

const request = supertest(app);

describe('Group Management API Integration Tests', () => {
    let authToken: string;
    let userId: string;
    let groupId: string;
    let memberId: string;

    beforeAll(async () => {
        await connectDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    beforeEach(async () => {
        // Create test user (owner)
        const owner = await User.create({
            username: 'testowner',
            password: 'password123',
            avatar: 'avatar.png',
        });
        userId = owner._id.toString();

        // Create test member
        const member = await User.create({
            username: 'testmember',
            password: 'password123',
            avatar: 'avatar.png',
        });
        memberId = member._id.toString();

        // Create test group
        const group = await Group.create({
            name: 'Test Group',
            avatar: 'group-avatar.png',
            creator: userId,
            members: [userId, memberId],
            memberRoles: [
                { userId, role: 'owner', joinedAt: new Date() },
                { userId: memberId, role: 'member', joinedAt: new Date() },
            ],
        });
        groupId = group._id.toString();

        // Mock authentication token
        authToken = 'mock-auth-token';
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Group.deleteMany({});
    });

    describe('POST /updateGroupMemberRole', () => {
        it('should allow owner to promote member to admin', async () => {
            const response = await request
                .post('/updateGroupMemberRole')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    groupId,
                    userId: memberId,
                    role: 'admin',
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Member role successfully updated');

            const updatedGroup = await Group.findById(groupId);
            const memberRole = updatedGroup?.memberRoles?.find(
                (mr) => mr.userId.toString() === memberId,
            );
            expect(memberRole?.role).toBe('admin');
        });

        it('should not allow member to update roles', async () => {
            const response = await request
                .post('/updateGroupMemberRole')
                .set('Authorization', `Bearer mock-member-token`)
                .send({
                    groupId,
                    userId: memberId,
                    role: 'admin',
                });

            expect(response.status).toBe(403);
        });

        it('should not allow promoting to owner without proper permissions', async () => {
            // Create an admin
            const admin = await User.create({
                username: 'testadmin',
                password: 'password123',
                avatar: 'avatar.png',
            });
            const adminId = admin._id.toString();

            const group = await Group.findById(groupId);
            group?.memberRoles?.push({
                userId: adminId,
                role: 'admin',
                joinedAt: new Date(),
            });
            await group?.save();

            const response = await request
                .post('/updateGroupMemberRole')
                .set('Authorization', `Bearer mock-admin-token`)
                .send({
                    groupId,
                    userId: memberId,
                    role: 'owner',
                });

            expect(response.status).toBe(403);
        });
    });

    describe('POST /kickGroupMember', () => {
        it('should allow owner to kick member', async () => {
            const response = await request
                .post('/kickGroupMember')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    groupId,
                    userId: memberId,
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Member successfully kicked from group');

            const updatedGroup = await Group.findById(groupId);
            expect(updatedGroup?.members).not.toContain(memberId);
        });

        it('should not allow kicking group owner', async () => {
            const response = await request
                .post('/kickGroupMember')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    groupId,
                    userId,
                });

            expect(response.status).toBe(400);
        });

        it('should not allow member to kick others', async () => {
            const response = await request
                .post('/kickGroupMember')
                .set('Authorization', `Bearer mock-member-token`)
                .send({
                    groupId,
                    userId,
                });

            expect(response.status).toBe(403);
        });
    });

    describe('GET /getGroupMembersWithRoles', () => {
        it('should return group members with their roles', async () => {
            const response = await request
                .get('/getGroupMembersWithRoles')
                .query({ groupId })
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.members).toHaveLength(2);
            
            const ownerRole = response.body.members.find(
                (m: any) => m.userId === userId,
            );
            expect(ownerRole.role).toBe('owner');

            const memberRole = response.body.members.find(
                (m: any) => m.userId === memberId,
            );
            expect(memberRole.role).toBe('member');
        });

        it('should return 404 for non-existent group', async () => {
            const response = await request
                .get('/getGroupMembersWithRoles')
                .query({ groupId: '507f1f77bcf86cd799439011' })
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });
});
