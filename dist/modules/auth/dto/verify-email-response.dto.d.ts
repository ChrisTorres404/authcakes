export declare class VerifyEmailUserDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    emailVerified: boolean;
}
export declare class VerifyEmailResponseDto {
    user: VerifyEmailUserDto;
}
