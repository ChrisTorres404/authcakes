import { User } from '../../users/entities/user.entity';
export declare class WebauthnCredential {
    id: string;
    userId: string;
    credentialId: string;
    publicKey: string;
    counter: number;
    deviceName: string;
    user: User;
    createdAt: Date;
    updatedAt: Date;
}
