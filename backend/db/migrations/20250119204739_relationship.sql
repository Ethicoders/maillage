-- migrate:up
CREATE TABLE relationship (
  follower_id INTEGER NOT NULL,
  followed_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, followed_id),
  FOREIGN KEY (follower_id) REFERENCES "user"(id),
  FOREIGN KEY (followed_id) REFERENCES "user"(id),
  UNIQUE (follower_id, followed_id)
);

CREATE INDEX index_relationships_on_followed_id ON relationship (followed_id);

-- migrate:down
DROP TABLE relationships;
