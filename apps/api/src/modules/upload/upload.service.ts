import { PrismaClient } from "@nosana-agent/db"
import { ResourceService } from "../resources/resources.service";


export class UploadService  {

    private db: PrismaClient;

    constructor() {this.db = new PrismaClient()}

    static default() : UploadService {
        return new UploadService()
    }
    
    upload() {
        const resourceService:ResourceService = ResourceService.initializer(this.db);
        
    }


}