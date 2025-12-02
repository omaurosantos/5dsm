import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import routes from "./routes.js";
import { loadOpenApi } from "./swagger.js";
import "dotenv/config";

import path from "path";
import { fileURLToPath } from "url";
import { usePassport } from "./auth.js";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(usePassport);
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/auth", authRoutes);
app.use("/api", routes);
app.use('/api/users', userRoutes);

const openapiDoc = loadOpenApi();
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));

const publicPath = path.join(__dirname, "..", "public");
app.use(express.static(publicPath));

app.get(["/", "/index.html"], (_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

export { app };
