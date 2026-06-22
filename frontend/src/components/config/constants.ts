type Config = {
    url: string
    httpUrl: string
}

const envUrl = import.meta.env.VITE_WS_URL as string | undefined;
const envHttpUrl = import.meta.env.VITE_HTTP_URL as string | undefined;

const production : Config = {
    url: "wss://e621-tag-feud.fly.dev/",
    httpUrl: "https://e621-tag-feud.fly.dev"
}

const development : Config = {
    url: envUrl ?? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8080`,
    httpUrl: envHttpUrl ?? `${window.location.protocol === 'https:' ? 'https' : 'http'}://${window.location.hostname}:3010`
}

const config = process.env.NODE_ENV === 'development' ? development : production;
//test
export default config;
