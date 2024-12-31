declare module '@nlpjs/basic' {
    export class NlpManager {
        constructor(options: { languages: string[] });
        addDocument(language: string, phrase: string, intent: string): void;
        train(): Promise<void>;
        process(language: string, text: string): Promise<{ sentiment: { score: number } }>;
    }
}
