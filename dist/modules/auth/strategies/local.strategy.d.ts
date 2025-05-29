import { Strategy } from 'passport-local';
import { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';
import { User } from '../../users/entities/user.entity';
interface AuthRequest extends Request {
    body: {
        email: string;
        password: string;
        mfaCode?: string;
    };
    headers: {
        'x-mfa-code'?: string;
    } & Request['headers'];
}
declare const LocalStrategy_base: new (...args: [] | [options: import("passport-local").IStrategyOptionsWithRequest] | [options: import("passport-local").IStrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class LocalStrategy extends LocalStrategy_base {
    private readonly authService;
    private readonly usersService;
    constructor(authService: AuthService, usersService: UsersService);
    validate(req: AuthRequest, email: string, password: string): Promise<User>;
}
export {};
