import { v4 } from 'uuid';
import { rooms, users } from '../state/store';
import type { BotDifficultyType, ServerRoomType, UserType } from '../domain/contracts';
import { upsertPlayer } from '../data/repos/playersRepo';
import { upsertRoomMember, removeRoomMember } from '../data/repos/roomMembersRepo';
import { upsertRoomReadyStates } from '../data/repos/roomReadyStateRepo';
import { getBotProfileIdByName } from '../data/repos/botProfilesRepo';
import speciesDataUntyped from '../../data/tag-data-species.json';

type SpeciesEntry = { name: string };
const speciesData = speciesDataUntyped as SpeciesEntry[];

const BOT_DIFFICULTY_PROFILE_MAP: Record<BotDifficultyType, string> = {
    Saint: 'saint',
    Sinner: 'sinner',
    Succubus: 'succubus',
};

const getBotProfileNameForDifficulty = (difficulty?: BotDifficultyType) => {
    return BOT_DIFFICULTY_PROFILE_MAP[difficulty ?? 'Sinner'];
};

const buildProfileNamesForDifficulties = (difficulties: BotDifficultyType[]) => {
    return difficulties.map(difficulty => getBotProfileNameForDifficulty(difficulty));
};

const randomBetween = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const normalizeSpeciesName = (name: string) => {
    return name
        .replace(/\(.*?\)/g, '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const generateBotNames = (count: number, existingNames: Set<string>) => {
    const names: string[] = [];
    let attempts = 0;
    while (names.length < count && attempts < count * 10) {
        attempts += 1;
        const species = speciesData[Math.floor(Math.random() * speciesData.length)];
        const base = normalizeSpeciesName(species?.name ?? 'Species');
        const suffix = randomBetween(1, 999);
        const candidate = `${base} ${suffix}`.trim();
        if (!existingNames.has(candidate)) {
            existingNames.add(candidate);
            names.push(candidate);
        }
    }
    return names;
};

const calculateMaxBots = (humanCount: number) => {
    const scaledCap = Math.min(humanCount * 3, 9);
    if (humanCount > 4) {
        return Math.min(scaledCap, 3);
    }
    return scaledCap;
};

const createBotsForRoom = async (roomID: string, botNames: string[], botProfileNames?: (string | undefined)[]) => {
    const room = rooms.get(roomID);
    if (!room) return [];
    if (botNames.length === 0) return [];

    const createdBots: UserType[] = [];
    for (const [index, botName] of botNames.entries()) {
        const botProfileName = botProfileNames?.[index];
        const botProfileId = botProfileName ? await getBotProfileIdByName(botProfileName) : null;
        let newBotID = v4();
        while (users.get(newBotID)) {
            newBotID = v4();
        }
        const bot: UserType = {
            id: newBotID,
            username: botName,
            score: 0,
            roomID,
            isBot: true,
            botProfileId: botProfileId ?? undefined,
        };
        users.set(newBotID, bot);
        room.members.push(bot);
        room.allUsersReady.set(newBotID, true);
        createdBots.push(bot);
    }

    if (createdBots.length === 0) return [];
    rooms.set(roomID, room);

    for (const bot of createdBots) {
        await upsertPlayer(bot);
        await upsertRoomMember(roomID, bot);
    }
    await upsertRoomReadyStates(room);

    return createdBots;
};

const ensureBotCountForRoom = async (room: ServerRoomType, botCount: number, botDifficulties: BotDifficultyType[]) => {
    const currentBots = room.members.filter(member => member.isBot);
    const currentBotCount = currentBots.length;
    const desiredCount = Math.max(0, botCount);
    const desiredProfiles = buildProfileNamesForDifficulties(botDifficulties);
    const profilesToApply = desiredProfiles.slice(0, Math.min(currentBotCount, desiredCount));
    for (const [index, bot] of currentBots.entries()) {
        if (index >= profilesToApply.length) break;
        const desiredProfileName = profilesToApply[index];
        const desiredProfileId = desiredProfileName ? await getBotProfileIdByName(desiredProfileName) : null;
        if (desiredProfileId && bot.botProfileId !== desiredProfileId) {
            const updatedBot = { ...bot, botProfileId: desiredProfileId };
            users.set(updatedBot.id, updatedBot);
            room.members = room.members.map(member => (member.id === updatedBot.id ? updatedBot : member));
            await upsertPlayer(updatedBot);
        }
    }
    rooms.set(room.id, room);

    if (desiredCount === currentBotCount) {
        return { added: [], removed: [] };
    }

    const existingNames = new Set(room.members.map(member => member.username));
    if (desiredCount > currentBotCount) {
        const botsToAdd = desiredCount - currentBotCount;
        const botNames = generateBotNames(botsToAdd, existingNames);
        const profileNames = desiredProfiles.slice(currentBotCount, currentBotCount + botsToAdd);
        const added = await createBotsForRoom(room.id, botNames, profileNames);
        return { added, removed: [] };
    }

    const botsToRemove = currentBots.slice(desiredCount);
    for (const bot of botsToRemove) {
        room.members = room.members.filter(member => member.id !== bot.id);
        room.allUsersReady.delete(bot.id);
        users.delete(bot.id);
        await removeRoomMember(room.id, bot.id);
    }
    rooms.set(room.id, room);
    await upsertRoomReadyStates(room);
    return { added: [], removed: botsToRemove };
};

export {
    calculateMaxBots,
    createBotsForRoom,
    ensureBotCountForRoom,
    getBotProfileNameForDifficulty,
    buildProfileNamesForDifficulties,
};
