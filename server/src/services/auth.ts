import { hash, verify } from 'argon2';
import { insertUser, selectUser, selectUserLogin } from '../repositories/users';
import { IdParams } from '../types';

interface RegisterParams {
  email: string;
  password: string;
  name: string;
}

interface LoginParams {
  email: string;
  password: string;
}

export async function register(params: RegisterParams) {
  const email = params.email.toLowerCase();
  const passwordHash = await hash(params.password);
  const name = params.name;

  return insertUser({email, passwordHash, name});
}

export async function login(params: LoginParams) {
  const email = params.email.toLowerCase();
  const password = params.password

  const result = await selectUserLogin({email});

  if (!result) return null;

  const ok = await verify(result.password_hash, password);
  if (!ok) return null;

  const {password_hash, ...user} = result;

  return user;
}

export async function me(params: IdParams) {
  const user = await selectUser(params);

  if (!user) return null;

  return user;
}