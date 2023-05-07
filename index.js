const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
    origin: "https://chat-app-ta3s.onrender.com/",
    credentials: true,
  optionSuccessStatus: 200,
  Headers: true,
  exposedHeaders: 'Set-Cookie',
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Access-Control-Allow-Origin',
    'Content-Type',
    'Authorization'
  ]
};
app.use(cors(corsOptions));

const userRouter = require("./routes/users");
const showsRouter = require("./routes/shows");
const chatsRouter = require("./routes/chats");

app.use("/users", userRouter);
app.use("/shows", showsRouter);
app.use("/chats", chatsRouter);

app.listen(3001, () => {
    console.log("Server running on port 3001");
});