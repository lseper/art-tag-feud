"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPosts = void 0;
const axios_1 = __importDefault(require("axios"));
const tag_data_general_json_1 = __importDefault(require("./data/tag-data-general.json"));
const tag_data_species_json_1 = __importDefault(require("./data/tag-data-species.json"));
const types_1 = require("./types");
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
function getPosts() {
    return __awaiter(this, void 0, void 0, function* () {
        const URL = `${BASE_URL}${POSTS_BASE}?limit=${10}&tags=+-${BLACKLIST.join('+-')}+${META_MODIFIERS.join('+')}`;
        // get the response - currently HTTP 403 - Forbidden
        const data = yield axios_1.default.get(URL, {
            headers: { 'User-Agent': 'e621-tag-feud/1.1 - by Zaverose' }
        }).then((response) => {
            return response.data;
        }).catch(err => console.log(err.message));
        const result = data.posts.map((post) => {
            // return a list of objects containing only the URL and id of the post
            const url = post.file.url;
            const id = post.id;
            // get all the tags
            const generalTags = post.tags.general.map((tag_name) => { return { name: tag_name, type: types_1.TagType.enum.general, score: getInitialTagScore(tag_name, types_1.TagType.enum.general) }; });
            const artistTags = post.tags.artist.map((tag_name) => { return { name: tag_name, type: types_1.TagType.enum.artist, score: ARTIST_TAG_SCORE }; });
            const speciesTags = post.tags.species.map((tag_name) => { return { name: tag_name, type: types_1.TagType.enum.species, score: getInitialTagScore(tag_name, types_1.TagType.enum.species) }; });
            const characterTags = post.tags.character.map((tag_name) => { return { name: tag_name, type: types_1.TagType.enum.character, score: CHARACTER_TAG_SCORE }; });
            const allTags = scaleScores(generalTags.concat(artistTags).concat(speciesTags).concat(characterTags).filter((tag) => tag.score !== 0));
            return { url: url, id: id, tags: allTags };
        });
        return result;
    });
}
exports.getPosts = getPosts;
;
// Computes the score a player would get when guessing this tag
function getInitialTagScore(tag_name, tag_type) {
    if (tag_type === types_1.TagType.enum.general) {
        const result = tag_data_general_json_1.default.find((e) => e.name === tag_name);
        if (result) {
            // set to this before we normalize scores
            return result.count;
        }
    }
    else {
        const result = tag_data_species_json_1.default.find((e) => e.name === tag_name);
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
function scaleScores(tags) {
    // transforming tag scores to be a local normal-distribution localized to be only this post's tags)
    const tagsMean = tags.reduce((prev, curr) => prev + curr.score, 0) / tags.length;
    const tagsStd = Math.sqrt(tags.map((tag) => Math.pow((tag.score - tagsMean), 2)).reduce((prev, curr) => prev + curr, 0) / tags.length);
    const zScores = tags.map(tag => -1 * (tag.score - tagsMean) / tagsStd);
    const newScores = zScores.map(score => Math.round((score * TAG_STD) + TAG_MEAN_SCORE));
    // if the score is negative, set it to 1 (shouldn't happen often, but sometimes with extremely frequent tags like "anthro")
    return tags.map((tag, i) => (Object.assign(Object.assign({}, tag), { score: newScores[i] > 0 ? newScores[i] : BASE_TAG_SCORE })));
}
//# sourceMappingURL=fetching_utility.js.map