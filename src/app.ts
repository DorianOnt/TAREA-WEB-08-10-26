import "dotenv/config";
import { Server } from "./server";

new Server(Number(process.env.PORT) || 3000).listen();