import { PrismaClient } from "@nosana-agent/db"
import { ResourceService } from "../resources/resources.service";


export class UploadService  {

    private db: PrismaClient;

    constructor() {this.db = new PrismaClient()}

    static default() : UploadService {
        return new UploadService()
    }
    
   async upload(filename: string,content: string,sessionId: string,chunks: string[]) {
        const resourceService:ResourceService = ResourceService.initializer(this.db);
      return await  resourceService.create(filename,content,chunks,sessionId)
    }


}