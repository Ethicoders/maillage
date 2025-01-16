FROM denoland/deno:debian

RUN apt-get update && \
    apt-get install -y build-essential gcc wget git curl inotify-tools && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN mv ./gleam /usr/local/bin

CMD ["gleam", "run"]

