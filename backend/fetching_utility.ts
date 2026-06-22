import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';

import general_tag_data from './data/tag-data-general.json';
import species_tag_data from './data/tag-data-species.json';
import type { PostType, PreferlistTagType, TagTypeType } from './types';
import { PostTagType, TagType } from './types';

dotenv.config({ path: path.join(__dirname, '.env') });

const username = process.env.E621_USERNAME ?? '';
const api_key = process.env.E621_API_KEY ?? '';

const BASE_URL = 'https://e621.net/';
const POSTS_BASE = 'posts.json';
// currently not used
//const TAGS_BASE = 'tags.json';
// copied the tags here from the ones on furbot, as well as filtering out animated media files 
const DEFAULT_BLACKLIST_LOCAL = ['animated', 'flash'];
const DEFAULT_BLACKLIST_PROD = ['gore', 'scat', 'feral', 'cub', 'loli', 'young', 'forced', 'animated', 'diaper', 'flash'];
const DEFAULT_BLACKLIST = process.env.NODE_ENV === 'production' ? DEFAULT_BLACKLIST_PROD : DEFAULT_BLACKLIST_LOCAL;
const META_MODIFIERS = ['score:>=25', 'gentags:>=10', 'rating:explicit', 'order:random'];

const ARTIST_TAG_SCORE = 150;
const CHARACTER_TAG_SCORE = 300;

const TAG_MEAN_SCORE = 75;
const TAG_STD = 25;
const BASE_TAG_SCORE = 1;
const MOST_TAG_INCLUDE_CHANCE = 0.6;

const normalizeTag = (tag: string): string => {
    return tag.trim().toLowerCase().replace(/\s+/g, '_');
}

// fetches and formats 10 random posts from e621
export async function getPosts(additionalBlacklist: string[] = [], preferlist: PreferlistTagType[] = []): Promise<PostType[]> {
    if (!username || !api_key) {
        throw new Error('Missing E621_USERNAME or E621_API_KEY in backend/.env');
    }
    const mergedBlacklist = [...new Set([...DEFAULT_BLACKLIST, ...additionalBlacklist.map(tag => normalizeTag(tag)).filter(Boolean)])];
    const blacklistSet = new Set(mergedBlacklist);
    const allTimeTags = preferlist
        .filter(entry => entry.frequency === 'all')
        .map(entry => normalizeTag(entry.tag))
        .filter(tag => tag && !blacklistSet.has(tag));
    const mostTimeTags = preferlist
        .filter(entry => entry.frequency === 'most')
        .map(entry => normalizeTag(entry.tag))
        .filter(tag => tag && !blacklistSet.has(tag));
    const selectedMostTimeTags = mostTimeTags.filter(() => Math.random() < MOST_TAG_INCLUDE_CHANCE);
    const includeTags = [...new Set([...allTimeTags, ...selectedMostTimeTags])];
    const tagParts = includeTags.concat(mergedBlacklist.map(tag => `-${tag}`)).concat(META_MODIFIERS);
    const URL = `${BASE_URL}${POSTS_BASE}?limit=${10}&tags=${tagParts.join('+')}`;
    // get the response - currently HTTP 403 - Forbidden
    const data = await axios.get(URL, {
        headers: {
            'User-Agent': `e621-tag-feud/1.1 - by ${username}`,
            'Authorization': "Basic " + Buffer.from(`${username}:${api_key}`).toString('base64')
        }
    }).then((response) => {
        return response.data;
    }).catch(err => {
        console.error(err.message);
    });
    const posts = data?.posts ?? [];
    const result = data.posts.map((post: any): PostType => {
        // return a list of objects containing only the URL and id of the post
        const url : string = post.file.url;
        const id : number = post.id;
        // get all the tags
        const generalTags : PostTagType[] = post.tags.general.map((tag_name: string) : PostTagType =>  { return { name: tag_name, type: TagType.enum.general, score: getInitialTagScore(tag_name, TagType.enum.general)} });
        const artistTags : PostTagType[] = post.tags.artist.map((tag_name: string) : PostTagType =>  { return { name: tag_name, type: TagType.enum.artist, score: ARTIST_TAG_SCORE} });
        const speciesTags : PostTagType[] = post.tags.species.map((tag_name: string) : PostTagType =>  { return { name: tag_name, type: TagType.enum.species, score: getInitialTagScore(tag_name, TagType.enum.species) } });
        const characterTags : PostTagType[] = post.tags.character.map((tag_name: string) : PostTagType =>  { return { name: tag_name, type: TagType.enum.character, score: CHARACTER_TAG_SCORE} });

        const allTags = scaleScores(generalTags.concat(artistTags).concat(speciesTags).concat(characterTags).filter((tag) => tag.score !== 0));

        console.log(url)

        return { url: url, id: id, tags: allTags };
    });
    return result;
};

// Computes the score a player would get when guessing this tag
function getInitialTagScore(tag_name : string, tag_type : TagTypeType) : number {
    if(tag_type === TagType.enum.general){
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
function scaleScores(tags : PostTagType[]) : PostTagType[] {
    // transforming tag scores to be a local normal-distribution localized to be only this post's tags)
    const tagsMean = tags.reduce((prev, curr) => prev + curr.score, 0) / tags.length;
    const tagsStd = Math.sqrt(tags.map((tag) => (tag.score - tagsMean) ** 2).reduce((prev, curr) => prev + curr, 0) / tags.length);
    const zScores = tags.map(tag => -1 * (tag.score - tagsMean) / tagsStd);
    const newScores = zScores.map(score => Math.round((score * TAG_STD) + TAG_MEAN_SCORE));
    // if the score is negative, set it to 1 (shouldn't happen often, but sometimes with extremely frequent tags like "anthro")
    return tags.map((tag, i) => ({...tag, score: newScores[i] > 0 ? newScores[i] : BASE_TAG_SCORE}));
}
