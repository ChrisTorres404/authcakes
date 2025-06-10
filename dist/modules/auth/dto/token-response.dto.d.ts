import { LoginUserDto } from './login-response.dto';
export declare class TokenResponseDto {
    user: LoginUserDto;
    accessToken: string;
    refreshToken: string;
}
