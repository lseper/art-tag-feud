export const icons = [
    'anubis.jpg', 'asriel.jpg', 'bowser.jpg', 
    'charizard.jpg', 'falco.jpg', 'fox.jpg', 
    'isabelle.jpg', 'judy hops.jpg', 'krystal.jpg', 
    'legosi.png', 'loona.jpg', 'louis.jpg', 
    'lucario.jpg', 'nick wilde.jpg', 'renamon.jpg', 
    'rocket.jpg', 'spyro.jpg', 'toriel.jpg', 
    'umbreon.jpg', 'wolf.jpg'
];

export const buildUIIconImg = (path: string, icon: string, className?: string) => {
    return <img src={`${path}${icon}`} alt={`${icon}`} className={className ?? ''} />;
}