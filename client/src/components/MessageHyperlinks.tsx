import { Link } from "@mui/material";
import React from "react";

const MessageHyperlinks = ({ message }: any) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
      <h4 style={{ marginBottom: "0em" }}>Manuals:</h4>
      {message.hyperlinks?.map((h: any) => (
        <Link href={h.href}>{h.text}</Link>
      ))}
    </div>
  );
};

export default MessageHyperlinks;
