declare const _default: (() => {
    default: {
        ttl: number;
        limit: number;
    };
    auth: {
        login: {
            ttl: number;
            limit: number;
        };
        register: {
            ttl: number;
            limit: number;
        };
        passwordReset: {
            ttl: number;
            limit: number;
        };
        refresh: {
            ttl: number;
            limit: number;
        };
    };
    api: {
        read: {
            ttl: number;
            limit: number;
        };
        write: {
            ttl: number;
            limit: number;
        };
    };
    admin: {
        ttl: number;
        limit: number;
    };
    skipIf: {
        ips: string[];
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    default: {
        ttl: number;
        limit: number;
    };
    auth: {
        login: {
            ttl: number;
            limit: number;
        };
        register: {
            ttl: number;
            limit: number;
        };
        passwordReset: {
            ttl: number;
            limit: number;
        };
        refresh: {
            ttl: number;
            limit: number;
        };
    };
    api: {
        read: {
            ttl: number;
            limit: number;
        };
        write: {
            ttl: number;
            limit: number;
        };
    };
    admin: {
        ttl: number;
        limit: number;
    };
    skipIf: {
        ips: string[];
    };
}>;
export default _default;
