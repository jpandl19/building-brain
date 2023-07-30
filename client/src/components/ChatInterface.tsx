import React from "react";
import InputBox from "./InputBox";
import MessagesList from "./MessagesList";
import axios from "axios";

const ChatInterface = () => {
  const [messages, setMessages] = React.useState([]);

  React.useEffect(() => {
    axios.get(`http://localhost:5001/api/chat`).then((res) => {
      setMessages([
        {
          sender: "system",
          text: res.data.message,
        },
      ] as any);
    });
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1em",
        margin: "2em",
      }}
    >
      <MessagesList messages={messages} />
      <InputBox
        onMessageAdd={(myMessage: any, systemMessage: any) => {
          setMessages([
            ...messages,
            { text: myMessage, sender: "user" },
            { text: systemMessage, sender: "system" },
          ] as any);
        }}
      />
    </div>
  );
};

export default ChatInterface;
