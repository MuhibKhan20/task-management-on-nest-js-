import type { User } from '@prisma/client';

export interface OmitUser extends Omit<User, 'password'> {}
