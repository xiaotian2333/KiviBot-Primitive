FROM alpine AS builder

RUN apk add --no-cache --update nodejs npm

WORKDIR /bot

COPY "package*.json" "./"

RUN npm i --production

COPY . .

FROM alpine AS runner

COPY --from=builder /bot /bot

ENV TZ=Asia/Shanghai

RUN apk add --no-cache --update nodejs npm

WORKDIR /bot

CMD ["node", "app.js"]
