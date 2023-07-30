import React, { useState, useEffect } from 'react';
import _ from 'lodash'
import { Box, Button, Grid, TextField, Typography, IconButton, Stack, CircularProgress, Link, Accordion, AccordionSummary, AccordionDetails, useTheme, } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LinkIcon from '@mui/icons-material/Link';
import InputBox from "./components/InputBox";

import { getFileLink } from "./utils/ServiceGPTClient";
import { getServiceGPTClient, getAccessToken } from './utils/ServiceGPTClient';
import { extractPlatformId, getRolesFromToken, checkRoles } from './utils/utils'
import ThumbUpOffAltOutlinedIcon from '@mui/icons-material/ThumbUpOffAltOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';

import OpenFileDialog from "./components/OpenFileDialog"
const DEFAULT_RESPONSE_LENGTH = 1000;
let messageEnd = null;


// lets check for and load the URL params
const staticPlatformId = parseInt(extractPlatformId(window.location.href));

const ChatInterface = (props) => {
  const accessToken = getAccessToken()
  const theme = useTheme()


  const [openFile, setOpenFile] = React.useState();
  const [messages, setMessages] = useState([]);
  const [allowedToChat, setAllowedToChat] = useState(null);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [responseLength, setResonseLength] = useState(DEFAULT_RESPONSE_LENGTH);
  const [userFeedbackLoading, setUserFeedbackLoading] = useState(false);
  const [platformId, setPlatformId] = useState(staticPlatformId);


  useEffect(() => {
    // Usage:
    const userRoles = getRolesFromToken(accessToken);
    const requiredRoles = ['paid'];
    // NOTE: for now we only need to run this check for platformId 1, we should add a more centralized check later
    if (platformId != 1) {
      setAllowedToChat(true);
      return;
    }

    try {
      checkRoles(userRoles, requiredRoles);
    } catch (err) {
      console.log(err.message);
      setAllowedToChat(false);
    }
  }, [accessToken])






  const sendUserFeedback = async (message, sentiment) => {
    setUserFeedbackLoading(true);
    const feedback = { sentiment, note: `No Message Given By User` }

    const response = await apiClient.post(`/api/chat/feedback`, {
      id: message.id,
      feedback,
      platformId
    });

    if (!(response.status === 200)) {
      const message = `An error has occured: ${response.status}`;
      setUserFeedbackLoading(false);
      throw new Error(message);
    }

    const messageToUpdate = _.find(messages, { id: message.id })
    messageToUpdate.feedback = feedback;
    setMessages([...messages]);
    setUserFeedbackLoading(false);
  }

  useEffect(() => {
    // lets check for and load the URL params
    const foundPlatformId = parseInt(extractPlatformId(window.location.href));
    if (foundPlatformId != null) {
      setPlatformId(foundPlatformId);
    }

    const fetchInitialMessage = async () => {

      try {
        const response = await apiClient.get(`/api/chat?platformId=${foundPlatformId}`);
        const initialMessage = response.data.message;
        const formattedMessage = formatMessage(initialMessage);
        let introHelperMessage = formattedMessage;

        introHelperMessage = `Hello and welcome to BuildingBrain<br /><br /> BuildingBrain makes it simple and easy to troubleshoot and maintain your commercial real estate building. You can do things like:<br />
                    <ul>
                    <li>Upload custom files manuals, guides, and building plans</li>
                    <li>Ask for problem systems in your building</li>
                    <li>Ask questions to help diagnose your issues</li>
                    <li>And much more!</li>
                    </ul>
                    <br />
                    Try asking your BuildingBrain a question!
                   `





        setMessages([{ text: introHelperMessage, sender: 'bot', feedback: null, intro: true }]);
      } catch (error) {
        console.error('Error fetching initial message from server:', error);
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log("Response Error:");
          console.log(JSON.stringify(error.response.data));
          console.log(JSON.stringify(error.response.status));
          console.log(JSON.stringify(error.response.headers));
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log("Request Error:");
          console.log(JSON.stringify(error.request));
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Generic:");
          console.log('Error', error.message);
        }
        console.log(JSON.stringify(error.config));
      }
    }

    fetchInitialMessage();
  }, [window.location.href])

  const apiClient = getServiceGPTClient();

  const fontStyles = {
    fontWeight: 600,
  };

  const scrollToBottom = () => {
    if (messageEnd) {
      messageEnd.scrollIntoView({ behavior: "smooth" });
    }
  }

  const formatMessage = (message) => {
    let finalMessage = message;

    // finalMessage = _.replace(message, `:`, `:<br/><br/>`);
    // finalMessage = message.replaceAll(`:`, `:<br/>`);

    return finalMessage;
  }

  const sendMessage = async (message) => {
    if (message.trim() === '') return;
    // if (inputMessage.trim() === '') return;

    setMessages([...messages, { text: message, sender: 'user', feedback: null, intro: false }]);
    setInputMessage('');

    try {
      setLoadingResponse(true);
      let responseLengthClean = responseLength;
      if (responseLengthClean == null || responseLengthClean === '' || _.isNaN(responseLengthClean) || _.isEmpty(responseLengthClean)) {
        responseLengthClean = DEFAULT_RESPONSE_LENGTH;
      }

      const response = await apiClient.post(`/api/chat?platformId=${staticPlatformId}`, { message: message, max_response_length: responseLengthClean, platformId, });
      const botResponse = response.data.message;
      if (response.data.error != null) {
        console.error(response.data.error)
        setLoadingResponse(false);
        return;
      }

      const formattedMessage = formatMessage(botResponse);
      setMessages(prevMessages => [...prevMessages, { text: formattedMessage, sender: 'bot', feedback: null, intro: false, id: response.data.id, references: response.data.references }]);
      setLoadingResponse(false);

    } catch (error) {
      setLoadingResponse(false);
      console.error('Error fetching response from server:', error);
      console.log(error)
      console.log(JSON.stringify(error.toJSON()))
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderFiles = (message) => {
    // is this the intro message? Then we don't need to show references
    if (message.intro === true || message.sender != `bot`) return null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
        <h4 style={{ marginBottom: "0em" }}>Assets:</h4>
        {message.hyperlinks?.map((h) => (
          <Link onClick={() => {
            setOpenFile(h.url)
          }}>{h.text}</Link>
        ))}
      </div>
    )
  }

  const renderAssets = (message) => {
    // is this the intro message? Then we don't need to show asset data
    if (message.intro === true || message.sender != `bot`) return null;
    if (message && message.asset != null) {
      const keys = Object.keys(message?.asset) || [];
    } else {
      return null
    }

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
    )
  }

  const renderFeedbackButtons = (message) => {

    // is this the initial default message? then we don't need buttons
    if (message.intro === true || message.sender != `bot`) return null;

    let content = null;

    if (userFeedbackLoading == true) {
      return (
        <Box sx={{ paddingLeft: 2 }}>
          <CircularProgress size={20} />
        </Box>
      )
    }

    if (message.feedback != null && message.feedback.sentiment === 'positive') {
      content = (
        <Box sx={{ paddingLeft: 2 }}>
          <ThumbUpOffAltOutlinedIcon sx={{
            color: `#418944`
          }} />
        </Box>
      )
    } else if (message.feedback != null && message.feedback.sentiment === 'negative') {
      content = (
        <Box sx={{ paddingLeft: 2 }}>
          <ThumbDownOutlinedIcon sx={{
            color: `#D74242`
          }} />
        </Box>
      )
    } else {
      content = (
        <>
          <Grid item xs={3}>
            <Button variant='text' onClick={() => sendUserFeedback(message, `positive`)} >
              <ThumbUpOffAltOutlinedIcon sx={{
                color: `#808080`
              }} />
            </Button>
          </Grid>
          <Grid item xs={3}>
            <Button variant='text' onClick={() => sendUserFeedback(message, `negative`)} >
              <ThumbDownOutlinedIcon sx={{
                color: `#808080`
              }} />
            </Button>
          </Grid>
        </>
      )
    }


    return (
      <Grid container item xs={12} alignSelf={`space-between`} justifyContent={`flex-start`}>
        {content}
      </Grid>
    )
  }

  const renderThinkingMessage = () => (
    <Box sx={{ backgroundColor: theme.palette.primary.contrastText, padding: 1, marginTop: 4, borderRadius: 25, }}>
      <Typography sx={{ ...fontStyles }} variant={`h6`}>Thinking...</Typography>
    </Box>
  );

  const renderInputField = () => (
    <TextField
      value={inputMessage}
      onChange={e => setInputMessage(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') sendMessage();
      }}
      disabled={loadingResponse}
      sx={{
        '& .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        '& .MuiOutlinedInput-input': {
          border: 'none',
          borderRadius: 25,
        },
        '& .MuiOutlinedInput-root input': {
          fontSize: `16px`,
        },
        input: {
          ...fontStyles,
          height: 36,
          fontSize: `16px`,
          backgroundColor: theme.palette.primary.contrastText
        }
      }}
      variant='outlined'
      fullWidth
    />

  );

  const renderLoadingIndicator = () => (
    <Grid container>
      <Grid item sx={{ padding: 1, paddingLeft: 5, }}>
        <CircularProgress sx={{ height: 30, width: 30, color: theme.palette.primary.alt, marginBottom: -4 }} />
      </Grid>
    </Grid>
  );

  const renderSendButton = () => (
    <Button onClick={sendMessage} sx={{ ml: 1, ...fontStyles, backgroundColor: theme.palette.primary.alt }} variant="contained">Send</Button>
  );

  if (allowedToChat == false) {
    return (
      <Grid container justifyContent={`center`} alignItems={`center`} sx={{ height: `90vh`, padding: 2 }}>
        <Grid item>
          <Typography sx={{ ...fontStyles }} variant={`h6`}>You must be an active subscriber to access this feature</Typography>
        </Grid>
      </Grid>
    )
  }

  const renderReferences = (message) => {
    if (message == null || message.references == null || message.references?.length <= 0) return null;

    const rendMessages = message.references.map((reference, index) => {

        return (
          <Accordion key={index}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              button
              aria-controls={`panel${index}b-content`}
              id={`panel${index}b-header`}
            >
              <Grid container item xs={12} direction={`row`} alignSelf={`space-between`} justifyContent={`flex-start`}>
                {reference.documentName != null && (
                  <Grid item xs={4}>
                    <Grid container direction={"row"}>
                      <Grid item sx={6}>
                        <Typography sx={{ ...fontStyles }} variant={`body2`}>File: {reference.documentName}</Typography>
                      </Grid>
                      <Grid item sx={6}>
                        <IconButton style={{ marginTop: -10}} variant={`outlined`} onClick={() => {
                          // Get the link and navigate to it
                          getFileLink(reference.dynamodb_id).then(res => {
                            setOpenFile(res.data.url)
                          });
                        }}><LinkIcon /></IconButton>
                      </Grid>
                    </Grid>
                  </Grid>
                )}
                {reference.pageNumber != null && (
                  <Grid item xs={4}>
                    <Typography sx={{ ...fontStyles }} variant={`body2`}>Page: {reference.pageNumber}</Typography>
                  </Grid>
                )}
                {reference.paragraphNumber != null && (
                  <Grid item xs={4}>
                    <Typography sx={{ ...fontStyles }} variant={`body2`}>Paragraph: {reference.paragraphNumber}</Typography>
                  </Grid>
                )}
              </Grid>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ ...fontStyles }} variant={`body2`}>{reference.text}</Typography>
            </AccordionDetails>
          </Accordion>
        )
    });

    return (
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls='panel1a-content'
          id='panel1a-header'
        >
          <Typography>References:</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {rendMessages}
        </AccordionDetails>
      </Accordion>
    );
  };



  return (
    <Grid sx={{ backgroundColor: theme.palette.primary.background, paadding: 2, height: `90vh`, }}>
      <Grid container spacing={2} direction={`column`} justifyContent={`flex-start`}>
        <Grid item direction={`column`} xs={12} md={12}>
          <Grid item>
            {/* We're removing the settings accordion for now, as we'll likely want to refactor that into an actual settings page */}
            {/* <Accordion> */}
            {/* <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography sx={{ ...fontStyles }}>Settings</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <TextField
                                    label={`Response Length`}
                                    helperText={`Max number of words that the assistant will respond with.`}
                                    value={responseLength}
                                    onChange={e => {
                                        let value = e.target.value;
                                        if (value > 1000) {
                                            value = 1000;
                                        }

                                        setResonseLength(value)
                                    }}
                                    disabled={loadingResponse}
                                    sx={{ input: { ...fontStyles, height: 36 }, label: { ...fontStyles }, helperText: { ...fontStyles } }}
                                    fullWidth
                                />
                            </AccordionDetails> */}
            {/* </Accordion> */}

          </Grid>
          <Grid item xs={12}>
            {/* backgroundColor: `#c0c2be`, */}
            <Stack sx={{ flexGrow: 1, height: `83vh`, overflowY: 'auto', p: 2, }} spacing={1}>
              {messages.map((message, index) => (
                <Box key={index} sx={{ alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  <Grid
                    container
                    direction={`column`}
                    sx={{
                      minWidth: `100%`,
                      bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.200', color: message.sender === 'user' ? 'white' : 'black'
                    }}
                  >
                    <Grid item xs={12}>
                      <Typography
                        variant="body1"
                        sx={{ p: 1, ...fontStyles, width: `100%`, minWidth: `100%`, borderRadius: 5, }}
                        dangerouslySetInnerHTML={{ __html: message.text }}
                      >
                      </Typography>
                    </Grid>
                    {renderReferences(message)}
                    {renderFeedbackButtons(message)}
                    {/* {renderFiles(message)} */}
                    {renderAssets(message)}
                  </Grid>
                </Box>
              ))}
              <div style={{ float: "left", clear: "both" }}
                ref={(el) => { messageEnd = el; }}>
              </div>
            </Stack>
          </Grid>

          <InputBox
            onSend={(message) => sendMessage(message)}
            onMessageAdd={(myMessage, systemMessage) => {
              setMessages([
                ...messages,
                { text: myMessage, sender: "user" },
                {
                  text: systemMessage.message,
                  hyperlinks: systemMessage.hyperlinks,
                  asset: systemMessage.asset,
                  sender: "system",
                },
              ]);
            }}
          />

          {/* <Grid
                        item
                        container
                        alignItems='center'
                        sx={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: 1,
                            borderTop: '1px solid #ccc',
                            backgroundColor: theme.palette.primary.main,
                            // boxShadow: '0 -5px 5px -5px rgba(0, 0, 0, 0.5)' 
                        }}>
                        <Grid item xs={9}>
                            {loadingResponse ? renderThinkingMessage() : renderInputField()}
                        </Grid>
                        <Grid item xs={3}>
                            {loadingResponse ? renderLoadingIndicator() : renderSendButton()}
                        </Grid>
                    </Grid> */}


        </Grid>
      </Grid>
      {openFile != null && (
        <OpenFileDialog openFile={openFile} onFileClose={() => {
          setOpenFile(null);
        }} />
      )}
    </Grid>
  );
};

export default ChatInterface;