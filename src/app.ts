require("dotenv").config();
const express = require("express");
const path = require("path");
const axios = require("axios");
const cors = require("cors");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const PORT = process.env.PORT || 2001;

//Access-Control-Allow-Origin
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  next();
});

app.use(cors());
app.use(express.static("public"));

const { Configuration, OpenAIApi } = require("openai");
const { createInterface } = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

const readline = createInterface({
  input: stdin,
  output: stdout,
});

const configuration = new Configuration({
  apiKey: "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",
});

const openai = new OpenAIApi(configuration);

io.on("connection", async (socket) => {
  console.log("a user connected via socket!");

  io.emit("chat", {
    userId: socket.id,
    userType: "system",
    content: "",
  });

  socket.on("disconnect", () => {
    console.log("a user disconnected!");
  });

  let messages: any = [];

  socket.on(`chat`, async (msg) => {
    if (msg.content.indexOf("initiate : ") >= 0) {

      let prompt: string = `I want you to act like you are my personal chatbot. Please anser my question as per your knowledge. Please stick the topic. You can start by greeting me.`;

      const response: any = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 2048,
        temperature: 0,
        n: 5,
        frequency_penalty: 2,
        user: socket.id,
      });

      messages.push({ role: "user", content: prompt });
      messages.push({ role: "system", content: response.data.choices[0].text });
      io.emit("chat", {
        userId: socket.id,
        userType: "system",
        content: response.data.choices[0].text,
      });
    } else {
      io.emit(`chat`, {
        userId: msg.userId,
        userType: msg.userType,
        content: msg.content,
      });

      messages.push({ role: "user", content: msg.content });
      try {
        const response: any = await openai.createChatCompletion({
          messages,
          model: "gpt-3.5-turbo",
        });

        const botMessage = response.data.choices[0].message;
        if (botMessage) {
            messages.push({ role: "system", content: botMessage.content });
            io.emit(`chat`, {
              userId: msg.userId,
              userType: "system",
              content: botMessage.content,
            });
        } else {
          io.emit(`chat`, {
            userId: msg.userId,
            userType: "system",
            content: "No response, try asking again",
          });
        }
      } catch (error: any) {
        console.log(error.message);
        io.emit(`chat`, {
          userId: msg.userId,
          userType: "system",
          content: "Something went wrong, try asking again",
        });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log("Server listening on port " + PORT + "!");
});
