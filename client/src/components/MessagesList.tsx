import { Stack, Box, Grid, Typography } from "@mui/material";
import axios from "axios";
import React from "react";
import MessageHyperlinks from "./MessageHyperlinks";
import MessageAsset from "./MessageAsset";

let messageEnd = null;

const MessagesList = ({ messages = [] }: any) => {
  return (
    <div>
      <Stack
        sx={{ flexGrow: 1, height: `75vh`, overflowY: "auto", p: 2 }}
        spacing={1}
      >
        {messages.map((message: any, index: number) => (
          <Box
            key={index}
            sx={{
              border: "solid grey",
              padding: "0.5em",
              textAlign: "left",
              borderRadius: "0.5em",
              alignSelf: message.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: message.text }} />
            {!!message?.hyperlinks?.length && (
              <MessageHyperlinks message={message} />
            )}
            {message?.asset != null && <MessageAsset message={message} />}
          </Box>
        ))}
        <div
          style={{ float: "left", clear: "both" }}
          ref={(el) => {
            messageEnd = el;
          }}
        ></div>
      </Stack>
    </div>
  );
};

export default MessagesList;
