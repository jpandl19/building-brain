import { MenuOutlined } from "@mui/icons-material";
import {
  AppBar,
  Toolbar,
  Grid,
  IconButton,
  Avatar,
  Typography,
} from "@mui/material";
import React from "react";

const MainToolbar = () => {
  const [open, setOpen] = React.useState(false);
  return (
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
              Ferry Building A
            </Typography>
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
};

export default MainToolbar;
