import config from '@fiora/config/server';
import getRandomAvatar from '@fiora/utils/getRandomAvatar';
import { doctor } from '@fiora/bin/scripts/doctor';
import logger from '@fiora/utils/logger';
import initMongoDB from '@fiora/database/mongoose/initMongoDB';
import Socket from '@fiora/database/mongoose/models/socket';
import Group, { GroupDocument } from '@fiora/database/mongoose/models/group';
import app from './app';

(async () => {
    if (process.argv.find((argv) => argv === '--doctor')) {
        await doctor();
    }

    await initMongoDB();

    const group = await Group.findOne({ isDefault: true });
    if (!group) {
        const defaultGroup = await Group.create({
            name: 'fiora',
            avatar: getRandomAvatar(),
            isDefault: true,
        } as GroupDocument);

        if (!defaultGroup) {
            logger.error('[defaultGroup]', 'create default group fail');
            return process.exit(1);
        }
    }

    app.listen(config.port, async () => {
        await Socket.deleteMany({});
        logger.info(`>>> server listen on http://localhost:${config.port}`);
    });

    return null;
})();
