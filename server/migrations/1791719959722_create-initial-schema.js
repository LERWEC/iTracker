/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`
      CREATE TABLE users (
        id bigserial PRIMARY KEY,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE projects (
        id bigserial PRIMARY KEY,
        key text NOT NULL UNIQUE,
        name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE issues (
        id bigserial PRIMARY KEY,
        project_id bigint NOT NULL REFERENCES projects(id),
        author_id bigint NOT NULL REFERENCES users(id),
        assignee_id bigint REFERENCES users(id),
        number integer NOT NULL,
        title text NOT NULL,
        description text,
        status text NOT NULL CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')),
        priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (project_id, number)
      );

      CREATE INDEX issues_project_id_status_idx ON issues(project_id, status);
      CREATE INDEX issues_assignee_id_idx ON issues(assignee_id);

      CREATE TABLE comments (
        id bigserial PRIMARY KEY,
        issue_id bigint NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
        author_id bigint NOT NULL REFERENCES users(id),
        body text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE INDEX comments_issue_id_created_at_idx ON comments(issue_id, created_at);

      CREATE TABLE issue_events (
        id bigserial PRIMARY KEY,
        issue_id bigint NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
        actor_id bigint NOT NULL REFERENCES users(id),
        field text NOT NULL CHECK (field IN ('title', 'description', 'status', 'priority', 'assignee_id')),
        old_value text,
        new_value text,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE INDEX issue_events_issue_id_created_at_idx ON issue_events(issue_id, created_at);
    `);
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
      DROP TABLE issue_events;
      DROP TABLE comments;
      DROP TABLE issues;
      DROP TABLE projects;
      DROP TABLE users;
    `);
};
