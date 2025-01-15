FROM denoland/deno:alpine

RUN apk update && apk add --virtual build-dependencies build-base gcc wget git curl inotify-tools

WORKDIR /app

COPY . .

RUN mv ./gleam /usr/local/bin

CMD ["gleam", "run"]
