import {
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import React from "react";

const MessageAsset = ({ message }: any) => {
  const keys = Object.keys(message.asset);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
        minWidth: "20em",
      }}
    >
      <h4 style={{ marginBottom: "0em" }}>Properties:</h4>
      <Table>
        <TableBody>
          {keys.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row}</TableCell>
              <TableCell>{message.asset[row]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MessageAsset;
