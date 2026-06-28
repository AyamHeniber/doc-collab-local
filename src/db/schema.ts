import { pgTable, text, timestamp, uuid, pgEnum, primaryKey } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('user_role', ['owner', 'editor', 'viewer']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  image: text('image'),
  role: roleEnum('role').default('viewer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull().default('Untitled Document'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const documentCollaborators = pgTable('document_collaborators', {
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: roleEnum('role').default('editor').notNull(),
}, (table) => [
  primaryKey({ columns: [table.documentId, table.userId] })
]);

export const documentVersions = pgTable('document_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  snapshot: text('snapshot').notNull(), // Base64 encoded Yjs update state binary
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentCollaborator = typeof documentCollaborators.$inferSelect;
export type DocumentVersion = typeof documentVersions.$inferSelect;
