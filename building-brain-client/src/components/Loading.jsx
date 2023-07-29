import {
    Box, Grid, Stack, Typography, CircularProgress, Avatar,
  } from '@mui/material';



const Loading = (props) => {
    const { message, offset=0, size=`15vh`, messageSize=25 } = props;
    const titleProp = (message == null) ? {} : {title: { value: message, size: messageSize }};
    return (
      <Grid
        container
        direction="column"
        alignItems="center"
        justifyContent="center"
        style={{ minHeight: (offset) ? `calc(100vh - ${offset})` : `100vh` }}
      >
        <CircularProgress size={size}  />
      </Grid>
    );
  }

  export default Loading;