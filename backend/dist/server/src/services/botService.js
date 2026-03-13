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
exports.buildProfileNamesForDifficulties = exports.getBotProfileNameForDifficulty = exports.ensureBotCountForRoom = exports.createBotsForRoom = exports.calculateMaxBots = void 0;
const uuid_1 = require("uuid");
const store_1 = require("../state/store");
const playersRepo_1 = require("../data/repos/playersRepo");
const roomMembersRepo_1 = require("../data/repos/roomMembersRepo");
const roomReadyStateRepo_1 = require("../data/repos/roomReadyStateRepo");
const botProfilesRepo_1 = require("../data/repos/botProfilesRepo");
const tag_data_species_json_1 = __importDefault(require("../../data/tag-data-species.json"));
const speciesData = tag_data_species_json_1.default;
const BOT_DIFFICULTY_PROFILE_MAP = {
    Saint: 'saint',
    Sinner: 'sinner',
    Succubus: 'succubus',
};
const getBotProfileNameForDifficulty = (difficulty) => {
    return BOT_DIFFICULTY_PROFILE_MAP[difficulty !== null && difficulty !== void 0 ? difficulty : 'Sinner'];
};
exports.getBotProfileNameForDifficulty = getBotProfileNameForDifficulty;
const buildProfileNamesForDifficulties = (difficulties) => {
    return difficulties.map(difficulty => getBotProfileNameForDifficulty(difficulty));
};
exports.buildProfileNamesForDifficulties = buildProfileNamesForDifficulties;
const randomBetween = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
const normalizeSpeciesName = (name) => {
    return name
        .replace(/\(.*?\)/g, '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};
const generateBotNames = (count, existingNames) => {
    var _a;
    const names = [];
    let attempts = 0;
    while (names.length < count && attempts < count * 10) {
        attempts += 1;
        const species = speciesData[Math.floor(Math.random() * speciesData.length)];
        const base = normalizeSpeciesName((_a = species === null || species === void 0 ? void 0 : species.name) !== null && _a !== void 0 ? _a : 'Species');
        const suffix = randomBetween(1, 999);
        const candidate = `${base} ${suffix}`.trim();
        if (!existingNames.has(candidate)) {
            existingNames.add(candidate);
            names.push(candidate);
        }
    }
    return names;
};
const calculateMaxBots = (humanCount) => {
    const scaledCap = Math.min(humanCount * 3, 9);
    if (humanCount > 4) {
        return Math.min(scaledCap, 3);
    }
    return scaledCap;
};
exports.calculateMaxBots = calculateMaxBots;
const createBotsForRoom = (roomID, botNames, botProfileNames) => __awaiter(void 0, void 0, void 0, function* () {
    const room = store_1.rooms.get(roomID);
    if (!room)
        return [];
    if (botNames.length === 0)
        return [];
    const createdBots = [];
    for (const [index, botName] of botNames.entries()) {
        const botProfileName = botProfileNames === null || botProfileNames === void 0 ? void 0 : botProfileNames[index];
        const botProfileId = botProfileName ? yield (0, botProfilesRepo_1.getBotProfileIdByName)(botProfileName) : null;
        let newBotID = (0, uuid_1.v4)();
        while (store_1.users.get(newBotID)) {
            newBotID = (0, uuid_1.v4)();
        }
        const bot = {
            id: newBotID,
            username: botName,
            score: 0,
            roomID,
            isBot: true,
            botProfileId: botProfileId !== null && botProfileId !== void 0 ? botProfileId : undefined,
        };
        store_1.users.set(newBotID, bot);
        room.members.push(bot);
        room.allUsersReady.set(newBotID, true);
        createdBots.push(bot);
    }
    if (createdBots.length === 0)
        return [];
    store_1.rooms.set(roomID, room);
    for (const bot of createdBots) {
        yield (0, playersRepo_1.upsertPlayer)(bot);
        yield (0, roomMembersRepo_1.upsertRoomMember)(roomID, bot);
    }
    yield (0, roomReadyStateRepo_1.upsertRoomReadyStates)(room);
    return createdBots;
});
exports.createBotsForRoom = createBotsForRoom;
const ensureBotCountForRoom = (room, botCount, botDifficulties) => __awaiter(void 0, void 0, void 0, function* () {
    const currentBots = room.members.filter(member => member.isBot);
    const currentBotCount = currentBots.length;
    const desiredCount = Math.max(0, botCount);
    const desiredProfiles = buildProfileNamesForDifficulties(botDifficulties);
    const profilesToApply = desiredProfiles.slice(0, Math.min(currentBotCount, desiredCount));
    for (const [index, bot] of currentBots.entries()) {
        if (index >= profilesToApply.length)
            break;
        const desiredProfileName = profilesToApply[index];
        const desiredProfileId = desiredProfileName ? yield (0, botProfilesRepo_1.getBotProfileIdByName)(desiredProfileName) : null;
        if (desiredProfileId && bot.botProfileId !== desiredProfileId) {
            const updatedBot = Object.assign(Object.assign({}, bot), { botProfileId: desiredProfileId });
            store_1.users.set(updatedBot.id, updatedBot);
            room.members = room.members.map(member => (member.id === updatedBot.id ? updatedBot : member));
            yield (0, playersRepo_1.upsertPlayer)(updatedBot);
        }
    }
    store_1.rooms.set(room.id, room);
    if (desiredCount === currentBotCount) {
        return { added: [], removed: [] };
    }
    const existingNames = new Set(room.members.map(member => member.username));
    if (desiredCount > currentBotCount) {
        const botsToAdd = desiredCount - currentBotCount;
        const botNames = generateBotNames(botsToAdd, existingNames);
        const profileNames = desiredProfiles.slice(currentBotCount, currentBotCount + botsToAdd);
        const added = yield createBotsForRoom(room.id, botNames, profileNames);
        return { added, removed: [] };
    }
    const botsToRemove = currentBots.slice(desiredCount);
    for (const bot of botsToRemove) {
        room.members = room.members.filter(member => member.id !== bot.id);
        room.allUsersReady.delete(bot.id);
        store_1.users.delete(bot.id);
        yield (0, roomMembersRepo_1.removeRoomMember)(room.id, bot.id);
    }
    store_1.rooms.set(room.id, room);
    yield (0, roomReadyStateRepo_1.upsertRoomReadyStates)(room);
    return { added: [], removed: botsToRemove };
});
exports.ensureBotCountForRoom = ensureBotCountForRoom;
//# sourceMappingURL=botService.js.map