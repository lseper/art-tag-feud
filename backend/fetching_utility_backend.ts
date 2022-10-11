import { Post, ITag, TagType } from './MetaData';
import general_tag_data from './data/tag-data-general.json';
import species_tag_data from './data/tag-data-species.json';

const BASE_URL = 'https://e621.net/';
const POSTS_BASE = 'posts.json';
// currently not used
//const TAGS_BASE = 'tags.json';
// copied the tags here from the ones on furbot, as well as filtering out animated media files 
const BLACKLIST = ['gore', 'scat', 'feral', 'cub', 'loli', 'young', 'forced', 'animated', 'flash'];
const META_MODIFIERS = ['score:>=25', 'gentags:>=10', 'rating:explicit', 'order:random'];

const ARTIST_TAG_SCORE = 150;
const CHARACTER_TAG_SCORE = 300;

const TAG_MEAN_SCORE = 75;
const TAG_STD = 25;
const BASE_TAG_SCORE = 1;
// fetches and formats 10 random posts from e621
export async function getPosts() {
    const URL = `${BASE_URL}${POSTS_BASE}?limit=${10}&tags=+-${BLACKLIST.join('+-')}+${META_MODIFIERS.join('+')}`;
    // get the response
    const response = await fetch(URL);
    const data = await response.json();
    const result = data.posts.map((post: any): Post => {
        // return a list of objects containing only the URL and id of the post
        const url : string = post.file.url;
        const id : number = post.id;
        // get all the tags
        const generalTags : ITag[] = post.tags.general.map((tag_name: string) : ITag =>  { return { name: tag_name, type: TagType.General, score: getInitialTagScore(tag_name, TagType.General)} });
        const artistTags : ITag[] = post.tags.artist.map((tag_name: string) : ITag =>  { return { name: tag_name, type: TagType.Artist, score: ARTIST_TAG_SCORE} });
        const speciesTags : ITag[] = post.tags.species.map((tag_name: string) : ITag =>  { return { name: tag_name, type: TagType.Species, score: getInitialTagScore(tag_name, TagType.Species) } });
        const characterTags : ITag[] = post.tags.character.map((tag_name: string) : ITag =>  { return { name: tag_name, type: TagType.Character, score: CHARACTER_TAG_SCORE} });

        const allTags = scaleScores(generalTags.concat(artistTags).concat(speciesTags).concat(characterTags).filter((tag) => tag.score !== 0));

        return { url: url, id: id, tags: allTags };
    });
    return result;
};

// Computes the score a player would get when guessing this tag
function getInitialTagScore(tag_name : string, tag_type : TagType) : number {
    if(tag_type === TagType.General){
        const result = general_tag_data.find((e) => e.name === tag_name);
        if (result){
            // set to this before we normalize scores
            return result.count;
        }
    } else {
        const result = species_tag_data.find((e) => e.name === tag_name);
        if (result) {
            // set to this before we normalize scores
            return result.count;
        }
    }
    // This really shouldn't ever happen?
    return 0;
}

// scale the scores so there's an even spread (scale the distance between scores down by X factor)
// convert to normal distribution but only for this post
function scaleScores(tags : ITag[]) : ITag[] {
    // transforming tag scores to be a local normal-distribution localized to be only this post's tags)
    const tagsMean = tags.reduce((prev, curr) => prev + curr.score, 0) / tags.length;
    const tagsStd = Math.sqrt(tags.map((tag) => (tag.score - tagsMean) ** 2).reduce((prev, curr) => prev + curr, 0) / tags.length);
    const zScores = tags.map(tag => -1 * (tag.score - tagsMean) / tagsStd);
    const newScores = zScores.map(score => Math.round((score * TAG_STD) + TAG_MEAN_SCORE));
    // if the score is negative, set it to 1 (shouldn't happen often, but sometimes with extremely frequent tags like "anthro")
    return tags.map((tag, i) => ({...tag, score: newScores[i] > 0 ? newScores[i] : BASE_TAG_SCORE}));
}