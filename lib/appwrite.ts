// Appwrite SDK configuration and client setup
import { Client, Account, Databases, Storage, Functions } from 'appwrite';

const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export { client };

// Database and Collection IDs
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;
export const POLLS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_POLLS_COLLECTION_ID!;
export const RESPONSES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID!;
export const SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID!;
export const STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!;
