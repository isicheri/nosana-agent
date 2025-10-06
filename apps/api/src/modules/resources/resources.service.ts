import { PrismaClient } from "@nosana-agent/db";



export class ResourceService {

    private db:PrismaClient;
    constructor(db:PrismaClient) {
        this.db = db;
    }

    static initializer(db: PrismaClient) : ResourceService {
        return new ResourceService(db);
    }

    async create(filename:string,content: string): Promise<void> {
     const resource = await this.db.resource.create({
        data: {
            filename,
            content
        }
     })
    }

}