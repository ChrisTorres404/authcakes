import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';
declare const LocalStrategy_base: new (...args: [] | [options: import("passport-local").IStrategyOptionsWithRequest] | [options: import("passport-local").IStrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class LocalStrategy extends LocalStrategy_base {
    private readonly authService;
    private readonly usersService;
    constructor(authService: AuthService, usersService: UsersService);
    validate(req: any, email: string, password: string): Promise<any>;
}
export {};
