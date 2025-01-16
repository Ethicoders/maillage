FROM ghcr.io/gleam-lang/gleam:v1.7.0-erlang

RUN apt-get update && \
    apt-get install -y build-essential gcc wget git curl inotify-tools

WORKDIR /app

COPY . .

CMD ["gleam", "run"]