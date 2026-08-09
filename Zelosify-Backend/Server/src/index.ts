import dotenv from "dotenv";
import { createApp } from "./frameworks/express/app.js";

dotenv.config();

async function startServer() {
  try {
    const app = await createApp();
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}...`);
    });
  } catch (error) {
    console.error("Error during server initialization:", error);
    process.exit(1);
  }
}

await startServer();
