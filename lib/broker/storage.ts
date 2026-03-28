import { promises as fs } from "fs";
import path from "path";
import type { BrokerAccount } from "./types";

const ACCOUNTS_FILE = path.join(
  process.cwd(),
  "data",
  "broker",
  "accounts.json"
);

export async function readAccounts(): Promise<BrokerAccount[]> {
  try {
    const raw = await fs.readFile(ACCOUNTS_FILE, "utf-8");
    return JSON.parse(raw) as BrokerAccount[];
  } catch {
    return [];
  }
}

export async function writeAccounts(accounts: BrokerAccount[]): Promise<void> {
  const dir = path.dirname(ACCOUNTS_FILE);
  await fs.mkdir(dir, { recursive: true });
  const tmp = ACCOUNTS_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(accounts, null, 2), "utf-8");
  await fs.rename(tmp, ACCOUNTS_FILE);
}

export async function addAccount(
  account: BrokerAccount
): Promise<BrokerAccount[]> {
  const accounts = await readAccounts();
  accounts.push(account);
  await writeAccounts(accounts);
  return accounts;
}

export async function updateAccount(
  id: string,
  patch: Partial<BrokerAccount>
): Promise<BrokerAccount[]> {
  const accounts = await readAccounts();
  const idx = accounts.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error(`账户不存在: ${id}`);
  accounts[idx] = { ...accounts[idx], ...patch };
  await writeAccounts(accounts);
  return accounts;
}

export async function deleteAccount(id: string): Promise<BrokerAccount[]> {
  let accounts = await readAccounts();
  accounts = accounts.filter((a) => a.id !== id);
  await writeAccounts(accounts);
  return accounts;
}
