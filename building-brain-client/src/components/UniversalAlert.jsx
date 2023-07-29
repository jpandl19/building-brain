import React, { useEffect, useState } from 'react';
import { Alert as MuiAlert, Snackbar } from '@mui/material';

//external commands (for ctrl)
let showToast = null;
let hideToast = null;
let timeoutId = null;

class UniversalAlertCtrlClass {
  constructor() {
  }

  __checkForInit() {
    if (showToast == null || hideToast == null) {
      throw new Error('UniversalAlertCtrl not initialized. Waiting on element root.');
    }
    //otherwise lets return true;
    return true;
  }

  show(msg = "No Message Specified", passedToastType = 'info', toastTimeout = 2500) {
    //this will make sure the Ctrl is connected to the react component, before we call the show or close func
    if(!this.__checkForInit()) {
      return;
    }

    showToast(msg, passedToastType, toastTimeout);
  }

  close() {
    if(!this.__checkForInit()) {
      return;
    }

    hideToast();
  }
}

//lets init the class so the consumer doens't have too
const UniversalAlertCtrl = new UniversalAlertCtrlClass();


const UniversalAlert = (props) => {
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('No Message Specified');
  const [toastType, setToastType] = useState('info');
  
  //this effect should only run once, to attach it to the ctrl class
  useEffect(() => {
    showToast = (msg = "No Message Specified", passedToastType = 'info', toastTimeout = 2500) => {
      setToastMessage(msg);
      setToastType(passedToastType)
      setToastOpen(true);
      // the time to wait before closing the toast
      timeoutId = setTimeout(() => {
        hideToast();
      }, toastTimeout)
    };
  
    hideToast = () => {
      setToastOpen(false);
    };
  }, [null]);

  const handleToastClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setToastOpen(false);
  };

  // just a little custom alert to use in our snackbar
  const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  return (
    <Snackbar open={toastOpen} autoHideDuration={6000} anchorOrigin={{ vertical: `top`, horizontal: `center` }} onClose={handleToastClose}>
      <Alert onClose={handleToastClose} severity={toastType} sx={{ width: '100%' }}>
        {toastMessage}
      </Alert>
    </Snackbar>
  )
}



export {
  UniversalAlert,
}

export {
  UniversalAlertCtrl,
}