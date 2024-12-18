import express from 'express';
import cors from 'cors';
import cookies from 'cookie-parser';

// Rutas
import benefitRoutes from './routes/benefitRoutes.js';
import loginRoutes from './routes/loginRoutes.js';
import universityRoutes from './routes/universityRoutes.js';
import lodgingRoutes from './routes/lodgingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import contactsRoutes from './routes/contactsRoutes.js'
import messageRoutes from './routes/chatRoutes.js';

const app = express();

// Configurar CORS para permitir el acceso desde tu dominio de Cloudflare
const allowedOrigins = [
  "https://proyecto-ing-soft.pages.dev",
  "https://studenthubweb.me",
  "http://localhost:3000",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "100mb" }));
app.use(cookies());

app.get("/", (req, res) => {
  res.send("StudentHub API working");
});

// Tus rutas
app.use("/benefits", benefitRoutes);
app.use("/users", loginRoutes);
app.use("/universities", universityRoutes);
app.use("/lodging", lodgingRoutes);
app.use("/user", userRoutes);
app.use("/contacts", contactsRoutes)
app.use("/messages", messageRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});

export default app;
