import { PrismaClient } from "@nosana-agent/db";
export class ResourceService {
    constructor(db) {
        this.db = db;
    }
    static initializer(db) {
        return new ResourceService(db);
    }
    async create(filename, content) {
        const resource = await this.db.resource.create({
            data: {
                filename,
                content
            }
        });
    }
}
//# sourceMappingURL=resources.service.js.map