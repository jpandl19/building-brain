import React from "react";
import logo from "./logo.svg";
import "./App.css";

import { pdfjs } from "react-pdf";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import MainToolbar from "./components/MainToolbar";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

function App() {
  return (
    <div className="App">
      <MainToolbar />
    </div>
  );
}

export default App;
