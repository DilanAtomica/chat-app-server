const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require('express-rate-limit')

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: true,
  credentials: true,
};

app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter);

const userRouter = require("./routes/users");
const showsRouter = require("./routes/shows");
const chatsRouter = require("./routes/chats");

app.use("/users", userRouter);
app.use("/shows", showsRouter);
app.use("/chats", chatsRouter);

app.listen(3001, () => {
    console.log("Server running on port 3001");
});