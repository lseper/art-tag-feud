type Config = {
    url: string
}

const production : Config = {
    url: "wss://e621-tag-feud.fly.dev/"
}

const development : Config = {
    url: "ws://192.168.1.57:8080"
} 

const config = process.env.NODE_ENV === 'development' ? development : production;
//test
export default config;
