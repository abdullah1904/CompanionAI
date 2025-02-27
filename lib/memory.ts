import { Redis } from "@upstash/redis";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";

export type CompanionKey = {
    companionName: string,
    model: string,
    userId: string
}

export class MemoryManager {
    private static instance: MemoryManager;
    private history: Redis;
    private vectorDBClient: PineconeClient
    public constructor() {
        this.history = Redis.fromEnv();
        this.vectorDBClient = new PineconeClient();
    }
    public async vectorSearch(recentChatHistory: string, companionFileName: string) {
        const pincconeClient = <PineconeClient>this.vectorDBClient;
        const pineconeIndex = pincconeClient.Index(process.env.PINECONE_INDEX! || "");
        const vectorStore = await PineconeStore.fromExistingIndex(
            new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY }),
            { pineconeIndex }
        );
        const similarDocs = await vectorStore
            .similaritySearch(recentChatHistory, 3, { fileName: companionFileName })
            .catch((e) => {
                console.log("Error in vector search", e);
            });
        return similarDocs;
    }
    public static async getInstance(): Promise<MemoryManager> {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();

        }
        return MemoryManager.instance;
    }
    private generateRedisCompanionKey(companionKey: CompanionKey): string {
        return `${companionKey.companionName}-${companionKey.model}-${companionKey.userId}`;
    }
    public async writeToHistory(text: string, companionKey: CompanionKey) {
        if (!companionKey || typeof companionKey.userId == 'undefined') {
            console.log("Companion key set incorrectly");
            return "";
        }
        const key = this.generateRedisCompanionKey(companionKey);
        const result = await this.history.zadd(key, {
            score: Date.now(),
            member: text,
        });
        return result;
    }
    public async readLatestHistory(companionKey: CompanionKey): Promise<string> {
        if (!companionKey || typeof companionKey.userId == 'undefined') {
            console.log("Companion key set incorrectly");
            return "";
        }
        const key = this.generateRedisCompanionKey(companionKey);
        let result = await this.history.zrange(key, 0, Date.now(), {
            byScore: true,
        });
        result = result.slice(-30).reverse();
        const recentChats = result.reverse().join("\n");
        return recentChats;
    }
    public async seedChatHistory(seedContent: string, delimiter: string = "\n", companionKey: CompanionKey) {
        const key = this.generateRedisCompanionKey(companionKey);
        if (await this.history.exists(key)) {
            console.log("User already has chat history");
            return;
        }
        const content = seedContent.split(delimiter);
        let counter = 0;
        for (const line of content) {
            await this.history.zadd(key, {
                score: counter,
                member: line,
            });
            counter+=1;
        }
    }
}