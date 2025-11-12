import { Schema, model, Document } from 'mongoose';
import { NAME_REGEXP } from '@fiora/utils/const';

const UserSchema = new Schema({
    createTime: { type: Date, default: Date.now },
    lastLoginTime: { type: Date, default: Date.now },

    username: {
        type: String,
        trim: true,
        unique: true,
        match: NAME_REGEXP,
        index: true,
    },
    salt: String,
    password: String,
    avatar: String,
    tag: {
        type: String,
        default: '',
        trim: true,
        match: NAME_REGEXP,
    },
    expressions: [
        {
            type: String,
        },
    ],
    lastLoginIp: String,
});

export interface UserDocument extends Document {
    /** Username */
    username: string;
    /** Password salt */
    salt: string;
    /** Encrypted password */
    password: string;
    /** Avatar */
    avatar: string;
    /** User tag */
    tag: string;
    /** Expression collection */
    expressions: string[];
    /** Create time */
    createTime: Date;
    /** Last login time */
    lastLoginTime: Date;
    /** Last login IP */
    lastLoginIp: string;
}

/**
 * User Model
 * User information
 */
const User = model<UserDocument>('User', UserSchema);

export default User;
