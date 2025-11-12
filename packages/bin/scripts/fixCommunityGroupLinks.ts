/**
 * Fix existing groups in communities to have proper communityId links
 * This script sets the communityId field for all groups that are listed in a community's groups array
 */

import Community from '@fiora/database/mongoose/models/community';
import Group from '@fiora/database/mongoose/models/group';

async function fixCommunityGroupLinks() {
    console.log('Starting to fix community-group links...');

    try {
        // Get all communities
        const communities = await Community.find({});
        console.log(`Found ${communities.length} communities`);

        let totalUpdated = 0;

        for (const community of communities) {
            console.log(`\nProcessing community: ${community.name} (${community._id})`);
            console.log(`  Groups in community: ${community.groups.length}`);

            for (const groupId of community.groups) {
                const group = await Group.findOne({ _id: groupId });
                
                if (!group) {
                    console.log(`  ⚠️  Group ${groupId} not found`);
                    continue;
                }

                // Check if group already has communityId set
                if (group.communityId && group.communityId.toString() === community._id.toString()) {
                    console.log(`  ✓ Group "${group.name}" already linked`);
                    continue;
                }

                // Set the communityId
                group.communityId = community._id;
                await group.save();
                
                console.log(`  ✅ Updated group "${group.name}" with communityId`);
                totalUpdated++;
            }
        }

        console.log(`\n✅ Fix complete! Updated ${totalUpdated} groups`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing community-group links:', error);
        process.exit(1);
    }
}

export default fixCommunityGroupLinks;
