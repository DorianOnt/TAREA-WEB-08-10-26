import express, { Application } from "express";
import router from "./routes";

export class Server {
  private app: Application;

  constructor(private port: number) {
    this.app = express();
    this.app.use(express.json());
    this.app.use("/api/v1", router);
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(`Servidor corriendo en http://localhost:${this.port}`);
    });
  }
}