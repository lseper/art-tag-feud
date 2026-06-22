type Config = {
    url: string
}

const production : Config = {
    url: "wss://e621-tag-feud-server.fly.dev"
}

const development : Config = {
    url: "ws://localhost:8080"
} 

const config = process.env.NODE_ENV === 'development' ? development : production;

export default config;