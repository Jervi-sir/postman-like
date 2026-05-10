import { pgTable, text, integer, serial, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const requests = pgTable('requests', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  groupName: text('group_name').notNull().default(''),
  subGroupName: text('sub_group_name').notNull().default(''),
  method: text('method').notNull(),
  url: text('url').notNull(),
  headersJson: text('headers_json').notNull().default('{}'),
  queryJson: text('query_json').notNull().default('{}'),
  bodyText: text('body_text').notNull().default(''),
  useGlobalBearer: integer('use_global_bearer').notNull().default(0),
  responseStatus: integer('response_status'),
  responseStatusText: text('response_status_text').notNull().default(''),
  responseDurationMs: integer('response_duration_ms'),
  responseHeadersJson: text('response_headers_json').notNull().default('{}'),
  responseBodyText: text('response_body_text').notNull().default(''),
  responseUrl: text('response_url').notNull().default(''),
  responseErrorText: text('response_error_text'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  isIntegrated: boolean('is_integrated').notNull().default(false),
  integratedAt: text('integrated_at'),
  description: text('description').notNull().default(''),
});

export const history = pgTable('history', {
  id: serial('id').primaryKey(),
  requestId: text('request_id').references(() => requests.id, { onDelete: 'set null' }),
  method: text('method').notNull(),
  url: text('url').notNull(),
  statusCode: integer('status_code'),
  durationMs: integer('duration_ms').notNull(),
  responseHeadersJson: text('response_headers_json').notNull().default('{}'),
  responseBodyText: text('response_body_text').notNull().default(''),
  errorText: text('error_text'),
  createdAt: text('created_at').notNull(),
});

export const requestComments = pgTable('request_comments', {
  id: serial('id').primaryKey(),
  requestId: text('request_id').notNull().references(() => requests.id, { onDelete: 'cascade' }),
  bodyText: text('body_text').notNull(),
  createdAt: text('created_at').notNull(),
});

export const globalVariables = pgTable('global_variables', {
  id: integer('id').primaryKey().default(1),
  variablesText: text('variables_text').notNull().default('{}'),
  updatedAt: text('updated_at').notNull(),
});

// Relations
export const requestsRelations = relations(requests, ({ many }) => ({
  history: many(history),
  comments: many(requestComments),
}));

export const historyRelations = relations(history, ({ one }) => ({
  request: one(requests, {
    fields: [history.requestId],
    references: [requests.id],
  }),
}));

export const requestCommentsRelations = relations(requestComments, ({ one }) => ({
  request: one(requests, {
    fields: [requestComments.requestId],
    references: [requests.id],
  }),
}));

export const notes = pgTable('notes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(), // Yoopta JSON content
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const diagrams = pgTable('diagrams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nodes: text('nodes').notNull(), // JSON string
  edges: text('edges').notNull(), // JSON string
  viewport: text('viewport').notNull().default('{"x":0,"y":0,"zoom":1}'), // JSON string
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
