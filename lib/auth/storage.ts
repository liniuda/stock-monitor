import { promises as fs } from "fs";
import path from "path";
import { User } from "./types";

const USERS_FILE = path.join(process.cwd(), "data", "auth", "users.json");

export async function readUsers(): Promise<User[]> {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf-8");
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

async function writeUsers(users: User[]): Promise<void> {
  const dir = path.dirname(USERS_FILE);
  await fs.mkdir(dir, { recursive: true });
  const tmp = USERS_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(users, null, 2), "utf-8");
  await fs.rename(tmp, USERS_FILE);
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const users = await readUsers();
  return users.find((u) => u.username === username) ?? null;
}

export async function addUser(user: User): Promise<void> {
  const users = await readUsers();
  users.push(user);
  await writeUsers(users);
}
