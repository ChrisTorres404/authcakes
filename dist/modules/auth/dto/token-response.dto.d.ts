import { LoginUserDto } from './login-response.dto';
export declare class TokenResponseDto {
    success: boolean;
    user: LoginUserDto;
    accessToken: string;
    refreshToken: string;
}
