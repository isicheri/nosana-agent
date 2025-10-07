
import { PrismaClient, type Session } from "@nosana-agent/db"


export class SessionsService  {
    private db: PrismaClient;

    constructor() {this.db = new PrismaClient()}

    static default() : SessionsService {
        return new SessionsService()
    }
    
  async create(userId: string) {
       return await this.db.session.create({
        data: {
            userId: userId
        }
       })
    }

    async createGuestSession() {
    return this.db.session.create({
      data: {
        // no userId = guest session
      },
    });
  }


}