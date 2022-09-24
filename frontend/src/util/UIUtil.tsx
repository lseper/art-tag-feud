export type IconData = {
    character: string,
    file: string,
    source: string,
    artist: string
}

export const icons : IconData[] = [
    {
        character: "Anubis",
        file: 'anubis.jpg',
        source: "https://e621.net/posts/1929467",
        artist: "lollipopcon",
    },
    {
        character: "Asriel",
        file: 'asriel.jpg',
        source: "https://e621.net/posts/2462955",
        artist: "desertkaiju",
    },
    {
        character: "Bowser",
        file: 'bowser.jpg',
        source: "https://e621.net/posts/3120493",
        artist: "poppin",
    },
    {
        character: "Charizard",
        file: 'charizard.jpg',
        source: "https://e621.net/posts/3120493",
        artist: "zackary911",
    },
    {
        character: "Falco Lombardi",
        file: 'falco.jpg',
        source: "https://e621.net/posts/1927518",
        artist: "zackary911",
    },
    {
        character: "Fox Mccloud",
        file: 'fox.jpg',
        source: "https://e621.net/posts/1985010",
        artist: "braeburned",
    },
    {
        character: "Isabelle",
        file: 'isabelle.jpg',
        source: "https://e621.net/posts/3057593",
        artist: "ooomaybeitscake",
    },
    {
        character: "Judy Hops",
        file: 'judy hops.jpg',
        source: "https://e621.net/posts/2513092",
        artist: "fluff-kevlar",
    },
    {
        character: "Krystal",
        file: 'krystal.jpg',
        source: "https://e621.net/posts/2672616",
        artist: "cervina7",
    },
    {
        character: "Legosi",
        file: 'legosi.png',
        source: "https://e621.net/posts/2926191",
        artist: "mytigertail",
    },
    {
        character: "Loona",
        file: 'loona.jpg',
        source: "https://e621.net/posts/2620915",
        artist: "whisperingfornothing",
    },
    {
        character: "Louis",
        file: 'louis.jpg',
        source: "https://e621.net/posts/2862902",
        artist: "meesh",
    },
    {
        character: "Lucario",
        file: 'lucario.jpg',
        source: "https://e621.net/posts/3324889",
        artist: "kaffii",
    },
    {
        character: "Nick Wilde",
        file: 'nick wilde.jpg',
        source: "https://e621.net/posts/2735733",
        artist: "zaush",
    },
    {
        character: "Renamon",
        file: 'renamon.jpg',
        source: "https://e621.net/posts/2656960",
        artist: "fluff-kevlar",
    },
    {
        character: "Rocket Raccoon",
        file: 'rocket.jpg',
        source: "https://e621.net/posts/2131319",
        artist: "brunchpup",
    },
    {
        character: "Spyro",
        file: 'spyro.jpg',
        source: "https://e621.net/posts/2354865",
        artist: "xnirox",
    },
    {
        character: "Toriel",
        file: 'toriel.jpg',
        source: "https://e621.net/posts/2279623",
        artist: "r-mk",
    },
    {
        character: "Umbreon",
        file: 'umbreon.jpg',
        source: "https://e621.net/posts/2046797",
        artist: "zackary911",
    },
    {
        character: 'Wolf O\'Donnel',
        file: 'wolf.jpg',
        source: "https://e621.net/posts/1807318",
        artist: "glitter trap boy",
    },
]

export const buildUIIconImg = (path: string, icon: string, className?: string) => {
    return <img src={`${path}${icon}`} alt={`${icon}`} className={className ?? ''} />;
}