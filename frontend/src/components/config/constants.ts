type Config = {
    url: string
}

const envUrl = import.meta.env.VITE_WS_URL as string | undefined;

const production : Config = {
    url: envUrl ?? "wss://e621-tag-feud.fly.dev/"
}

const development : Config = {
    url: envUrl ?? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8080`
}

const config = process.env.NODE_ENV === 'development' ? development : production;
//test
export default config;
