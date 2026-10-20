import { selectUsers } from '../repositories/users';

export async function listUsers() {
  return selectUsers();
}
