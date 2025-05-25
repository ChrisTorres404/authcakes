export declare const ThrottleLogin: () => MethodDecorator & ClassDecorator;
export declare const ThrottleRegister: () => MethodDecorator & ClassDecorator;
export declare const ThrottlePasswordReset: () => MethodDecorator & ClassDecorator;
export declare const ThrottleRefresh: () => MethodDecorator & ClassDecorator;
export declare const ThrottleApiRead: () => MethodDecorator & ClassDecorator;
export declare const ThrottleApiWrite: () => MethodDecorator & ClassDecorator;
export declare const SkipThrottle: () => import("@nestjs/common").CustomDecorator<string>;
