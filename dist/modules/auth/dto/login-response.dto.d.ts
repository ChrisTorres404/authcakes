export declare class LoginUserDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
    emailVerified: boolean;
}
export declare class LoginResponseDto {
    user: LoginUserDto;
    sessionId: string;
    accessToken: string;
    refreshToken: string;
    verificationToken?: string;
}
