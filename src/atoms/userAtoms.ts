import { atom } from "jotai";

export type User = {
  id: string;
  email: string;
  storage_all: number;
  storage_expired_at: number;
  balance_total: number;
  balance_left: number;
  data_used: number;
  parser_count: number;
  deleted: boolean;
  role: string;
  created_at: string;
  updated_at: string | null;
  last_login_at: string;
  original_urls?: Array<{
    url: string;
    created_at: string;
  }>;
  parsed_urls?: Array<{
    url: string;
    created_at: string;
  }>;
};

export const userAtom = atom<User | null>(null);
export const tokenAtom = atom<string | null>(null);
