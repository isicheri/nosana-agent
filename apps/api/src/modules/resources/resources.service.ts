import { PrismaClient, type Resource } from "@nosana-agent/db";



export class ResourceService {

    private db:PrismaClient;
    constructor(db:PrismaClient) {
        this.db = db;
    }

    static initializer(db: PrismaClient) : ResourceService {
        return new ResourceService(db);
    }

    async create(filename:string,content: string,chunks: string[],sessionId: string): Promise<Resource> {
     const resource = await this.db.resource.create({
        data: {
            filename,
            content,
            chunks,   
            sessions: {
                connect: {
                    id: sessionId
                }
            }
        }
     });
     return resource;
    }

}