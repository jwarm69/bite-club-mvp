import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
declare const io: Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare function getPrisma(): Promise<PrismaClient>;
export declare let prisma: any;
export { io };
//# sourceMappingURL=index.d.ts.map