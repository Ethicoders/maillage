-- migrate:up
CREATE TABLE post (
  id SERIAL PRIMARY KEY,
  content VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES "user"(id)
);
CREATE UNIQUE INDEX index_posts_on_user_id_and_created_at ON post(user_id, created_at)

-- migrate:down
DROP TABLE post;
DROP INDEX index_posts_on_user_id_and_created_at;