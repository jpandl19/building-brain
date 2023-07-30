import React, { useState } from "react";
import { Document, Page } from "react-pdf";

import Dialog from '@mui/material/Dialog';
import CloseIcon from '@mui/icons-material/Close';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';
import { IconButton } from "@mui/material";


import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

const PDFViewer = ({openFile = "https://building-brain-custom-files.s3.amazonaws.com/00858c57-3215-428b-8f35-2c5aa556e05a?AWSAccessKeyId=AKIA5YP5ZZUIDRNFVIMM&Signature=5rZwaXbEJssyUreAi7s4Z3QI9YA%3D&Expires=1690709538", onFileClose}) => {

  const pageRefs = React.useRef([]);
  const [numPages, setNumPages] = React.useState();
  const [pageNumber, setPageNumber] = React.useState(2);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <Dialog open maxWidth="md" onClose={()=> {onFileClose()}}>
      <div style={{display: "flex", justifyContent: "flex-end"}}>
        <IconButton onClick={() => {
          onFileClose()
        }}><CloseIcon/></IconButton>
      </div>
      <DialogContent>
        <Document file={{ url: openFile }} onLoadSuccess={onDocumentLoadSuccess}>
          {Array(numPages).fill().map((p, i) => (
            <>
            <div className={`page-${i}`}/>
            <Page pageNumber={i + 1}/></>
          ))}
        </Document>
        <p>
          Page {pageNumber} of {numPages}
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;