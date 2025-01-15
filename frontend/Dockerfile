FROM ghcr.io/gleam-lang/gleam:v1.7.0-erlang-alpine

RUN apk update && apk add inotify-tools

WORKDIR /app

COPY . .

CMD ["gleam", "run"]