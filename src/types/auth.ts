export interface User {
    username: string;
    profile: any | null; // null หรือ object
    firstname: string;
    lastname: string;
    nickname: string;
    position: string;
    role: string;
  }
  
  // Tokens type
  export interface Tokens {
    accessToken: string;
    refreshToken: string;
  }
  
  // Payload สำหรับ login
  export interface LoginPayload {
    username: string;
    password: string;
  }
  
  // Payload สำหรับ refresh
  export interface RefreshPayload {
    refreshToken: string;
  }
  
  // Response type สำหรับ login (return data part เท่านั้น)
  export interface LoginResponseData {
    user: User;
    tokens: Tokens;
  }