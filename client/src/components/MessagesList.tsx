import { Stack, Box, Grid, Typography } from "@mui/material";
import axios from "axios";
import React from "react";

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
              borderRadius: "0.5em",
              alignSelf: message.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: message.text }} />
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
