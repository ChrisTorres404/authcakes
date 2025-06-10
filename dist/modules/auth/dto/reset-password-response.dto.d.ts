export declare class ResetPasswordUserDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    emailVerified: boolean;
}
export declare class ResetPasswordResponseDto {
    user: ResetPasswordUserDto;
}
