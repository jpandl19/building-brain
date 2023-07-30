import React from "react";
import logo from "./logo.svg";
import "./App.css";

import { pdfjs } from "react-pdf";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import { Box, Drawer, Stack } from "@mui/material";
import ChatInterface from "./components/ChatInterface";
import MainToolbar from "./components/MainToolbar";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

function App() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="App">
      <Box sx={{ boxShadow: 3 }} height="100vh">
        <MainToolbar />

        <Drawer
          anchor="left"
          open={open}
          onClose={() => setOpen(false)}
        ></Drawer>
        <Box padding={0}>
          <Stack spacing={1} direction="column">
            <Stack spacing={2} direction="column">
              <ChatInterface />
            </Stack>
          </Stack>
        </Box>
      </Box>
    </div>
  );
}

export default App;
