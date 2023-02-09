const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

const userRouter = require("./routes/users");
const showsRouter = require("./routes/shows");
const chatsRouter = require("./routes/chats");

app.use("/users", userRouter);
app.use("/shows", showsRouter);
app.use("/chats", chatsRouter);

app.listen(3001, () => {
    console.log("Server running on port 3001");
});