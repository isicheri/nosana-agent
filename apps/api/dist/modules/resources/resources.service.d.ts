import { PrismaClient } from "@nosana-agent/db";
export declare class ResourceService {
    private db;
    constructor(db: PrismaClient);
    static initializer(db: PrismaClient): ResourceService;
    create(filename: string, content: string): Promise<void>;
}
//# sourceMappingURL=resources.service.d.ts.map