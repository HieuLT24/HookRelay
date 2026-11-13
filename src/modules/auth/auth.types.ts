export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
