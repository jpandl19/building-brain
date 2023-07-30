import { useTheme } from "@emotion/react";
import { Navigation, Route, MenuOutlined } from "@mui/icons-material";
import {
  Box,
  AppBar,
  Grid,
  IconButton,
  Avatar,
  Toolbar,
  Typography,
  Drawer,
  Stack,
} from "@mui/material";
import React from "react";
import ChatInterface from "./ChatInterface";

const MainToolbar = () => {
  const theme = useTheme();

  const [open, setOpen] = React.useState(false);

  return (
    <Box sx={{ boxShadow: 3 }} height="100vh">
      <AppBar position="static">
        <Toolbar
          sx={{
            minHeight: `10vh`,
            boxShadow: "0 5px 5px -5px rgba(0, 0, 0, 0.5)",
          }}
        >
          <Grid
            container
            spacing={1}
            justifyContent="flex-start"
            alignItems="center"
            direction="row"
          >
            <Grid item>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={() => setOpen(true)}
              >
                <MenuOutlined />
              </IconButton>
            </Grid>
            <Grid item>
              <Avatar
                alt="Building Brain Logo"
                src="./android-chrome-192x192.png"
                sx={{
                  boxShadow: 5,
                }}
              />
            </Grid>
            <Grid item>
              <Typography variant="h6" color="primary.contrastText">
                Building Brain
              </Typography>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}></Drawer>
      <Box padding={0}>
        <Stack spacing={1} direction="column">
          <Stack spacing={2} direction="column">
            <ChatInterface />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default MainToolbar;
