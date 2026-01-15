type Config = {
    url: string
}

const production : Config = {
    url: "wss://e621-tag-feud.fly.dev/"
}

const development : Config = {
    url: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8080`
}

const config = process.env.NODE_ENV === 'development' ? development : production;
//test
export default config;
