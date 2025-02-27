import { StreamingTextResponse, LangChainStream } from "ai";
import { currentUser } from "@clerk/nextjs/server";
import { Replicate } from "@langchain/community/llms/replicate";
import { NextResponse } from "next/server";
import { MemoryManager } from "@/lib/memory";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/db";
import { CallbackManager } from "@langchain/core/callbacks/manager";
import { Readable } from "stream";

export const POST = async (
    request: Request,
    { params }: { params: Promise<{ chatId: string }> }
) => {
    try {
        const { chatId } = await params;
        const { prompt } = await request.json();
        const user = await currentUser();
        if (!user || !user.firstName || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const identifier = request.url + "-" + user.id;
        const { success } = await rateLimit(identifier);
        if (!success) {
            return new NextResponse("Rate Limit Exceeded", { status: 429 });
        }
        const companion = await prismadb.companion.update({
            where: {
                id: chatId,
            },
            data: {
                messages: {
                    create: {
                        role: "user",
                        content: prompt,
                        userId: user.id,
                    },
                },
            },
        });
        if (!companion) {
            return new NextResponse("Companion not found", { status: 404 });
        }
        const name = companion.id;
        const companion_file_name = name + ".txt";
        const companionKey = {
            companionName: name,
            userId: user.id,
            model: "llama2-13b"
        }
        const memoryManager = await MemoryManager.getInstance();
        const records = await memoryManager.readLatestHistory(companionKey);
        if (records.length === 0) {
            await memoryManager.seedChatHistory(companion.seed, "\n\n", companionKey);
        }
        await memoryManager.writeToHistory("User: " + prompt + "\n", companionKey);
        const recentChatHistory = await memoryManager.readLatestHistory(companionKey);
        const similarDocs = await memoryManager.vectorSearch(recentChatHistory, companion_file_name);
        let relevantHistory = "";
        if (similarDocs && similarDocs.length !== 0) {
            relevantHistory = similarDocs.map((doc) => doc.pageContent).join("\n");
        }
        const {handlers} = LangChainStream();
        const model = new Replicate({
            model: "lucataco/llama-2-13b-chat:18f253bfce9f33fe67ba4f659232c509fbdfb5025e5dbe6027f72eeb91c8624b",
            input: {
                length: 2048
            },
            apiKey: process.env.REPLICATE_API_TOKEN,
            callbacks: CallbackManager.fromHandlers(handlers),
        });
        model.verbose = true;
        const res = String(
            await model.invoke(
                `
                    ONLY generate plain sentences without prefix of who is speaking, DO NOT use ${name} : prefix.
                    ${companion.instructions}
                    Below are relevant details about ${name}'s past and the conversation you are in.
                    ${relevantHistory}

                    ${recentChatHistory}\n${name}:
                `
            )
                .catch(console.error)
        );
        const cleaned = res.replaceAll(",", " ");
        const chunks = cleaned.split("\n");
        const response = chunks[0];
        const nodeStream = new Readable({
            read() {
              this.push(response);
              this.push(null);
            }
          });
        if (response != undefined && response.length > 1) {
            memoryManager.writeToHistory("" + response.trim(), companionKey);
            await prismadb.companion.update({
                where: {
                    id: chatId,
                },
                data: {
                    messages: {
                        create: {
                            content: response.trim(),
                            role: "system",
                            userId: user.id,
                        }
                    }
                }
            })
        }
        const webStream = new ReadableStream({
            start(controller) {
              nodeStream.on('data', (chunk) => controller.enqueue(chunk));
              nodeStream.on('end', () => controller.close());
              nodeStream.on('error', (err) => controller.error(err));
            }
          })
        return new StreamingTextResponse(webStream);

    } catch (error) {
        console.log("[CHAT_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
};
