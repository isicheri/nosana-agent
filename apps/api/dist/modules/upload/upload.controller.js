import { PrismaClient } from "@nosana-agent/db";
import { ResourceService } from "../resources/resources.service";
function uploadRouterController() {
    const prisma = new PrismaClient();
    const resourceService = ResourceService.initializer(prisma);
    // resourceService.create()
    return {
        uploadResource: async () => { }
    };
}
//# sourceMappingURL=upload.controller.js.map