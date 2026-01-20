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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPosts = void 0;
const axios_1 = __importDefault(require("axios"));
const contracts_1 = require("../domain/contracts");
const tagUtils_1 = require("../domain/tagUtils");
const tag_data_general_json_1 = __importDefault(require("../../data/tag-data-general.json"));
const tag_data_species_json_1 = __importDefault(require("../../data/tag-data-species.json"));
const username = (_a = process.env.E621_USERNAME) !== null && _a !== void 0 ? _a : '';
const api_key = (_b = process.env.E621_API_KEY) !== null && _b !== void 0 ? _b : '';
const BASE_URL = 'https://e621.net/';
const POSTS_BASE = 'posts.json';
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
const getPosts = (additionalBlacklist = [], preferlist = []) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    if (!username || !api_key) {
        throw new Error('Missing E621_USERNAME or E621_API_KEY in backend/.env');
    }
    const mergedBlacklist = [...new Set([...DEFAULT_BLACKLIST, ...additionalBlacklist.map(tag => (0, tagUtils_1.normalizeTag)(tag)).filter(Boolean)])];
    const blacklistSet = new Set(mergedBlacklist);
    const allTimeTags = preferlist
        .filter(entry => entry.frequency === 'all')
        .map(entry => (0, tagUtils_1.normalizeTag)(entry.tag))
        .filter(tag => tag && !blacklistSet.has(tag));
    const mostTimeTags = preferlist
        .filter(entry => entry.frequency === 'most')
        .map(entry => (0, tagUtils_1.normalizeTag)(entry.tag))
        .filter(tag => tag && !blacklistSet.has(tag));
    const selectedMostTimeTags = mostTimeTags.filter(() => Math.random() < MOST_TAG_INCLUDE_CHANCE);
    const includeTags = [...new Set([...allTimeTags, ...selectedMostTimeTags])];
    const tagParts = includeTags.concat(mergedBlacklist.map(tag => `-${tag}`)).concat(META_MODIFIERS);
    const URL = `${BASE_URL}${POSTS_BASE}?limit=${10}&tags=${tagParts.join('+')}`;
    const data = yield axios_1.default.get(URL, {
        headers: {
            'User-Agent': `e621-tag-feud/1.1 - by ${username}`,
            'Authorization': "Basic " + Buffer.from(`${username}:${api_key}`).toString('base64'),
        }
    }).then((response) => {
        return response.data;
    }).catch(err => {
        console.error(err.message);
    });
    const posts = (_c = data === null || data === void 0 ? void 0 : data.posts) !== null && _c !== void 0 ? _c : [];
    const result = posts.map((post) => {
        const url = post.file.url;
        const id = post.id;
        const generalTags = post.tags.general.map((tag_name) => {
            return { name: tag_name, type: contracts_1.TagType.enum.general, score: getInitialTagScore(tag_name, contracts_1.TagType.enum.general) };
        });
        const artistTags = post.tags.artist.map((tag_name) => {
            return { name: tag_name, type: contracts_1.TagType.enum.artist, score: ARTIST_TAG_SCORE };
        });
        const speciesTags = post.tags.species.map((tag_name) => {
            return { name: tag_name, type: contracts_1.TagType.enum.species, score: getInitialTagScore(tag_name, contracts_1.TagType.enum.species) };
        });
        const characterTags = post.tags.character.map((tag_name) => {
            return { name: tag_name, type: contracts_1.TagType.enum.character, score: CHARACTER_TAG_SCORE };
        });
        const allTags = scaleScores(generalTags.concat(artistTags).concat(speciesTags).concat(characterTags).filter((tag) => tag.score !== 0));
        return { url, id, tags: allTags };
    });
    return result;
});
exports.getPosts = getPosts;
const getInitialTagScore = (tag_name, tag_type) => {
    if (tag_type === contracts_1.TagType.enum.general) {
        const result = tag_data_general_json_1.default.find((e) => e.name === tag_name);
        if (result) {
            return result.count;
        }
    }
    else {
        const result = tag_data_species_json_1.default.find((e) => e.name === tag_name);
        if (result) {
            return result.count;
        }
    }
    return 0;
};
const scaleScores = (tags) => {
    const tagsMean = tags.reduce((prev, curr) => prev + curr.score, 0) / tags.length;
    const tagsStd = Math.sqrt(tags.map((tag) => Math.pow((tag.score - tagsMean), 2)).reduce((prev, curr) => prev + curr, 0) / tags.length);
    const zScores = tags.map(tag => -1 * (tag.score - tagsMean) / tagsStd);
    const newScores = zScores.map(score => Math.round((score * TAG_STD) + TAG_MEAN_SCORE));
    return tags.map((tag, i) => (Object.assign(Object.assign({}, tag), { score: newScores[i] > 0 ? newScores[i] : BASE_TAG_SCORE })));
};
//# sourceMappingURL=e621Client.js.map