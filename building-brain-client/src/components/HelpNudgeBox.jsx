import React from 'react';

import CircleIcon from '@mui/icons-material/Circle';

const data = [{
  id: "1",
  icon: <CircleIcon/>,
  text: "Jason's HVAC Professional Services"
}, {
  id: "2",
  icon: <CircleIcon/>,
  text: "Air Flow Pros Heating And Air Conditioning"
}]

const HelpNudgeBox = ({}) => (
  <div>
    Let's get you some help! Here a few professionals in your area:
    <List>
      {data.map((item) => (
        <ListItem key={item.id} button>
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItem>
      ))}
    </List>
  </div>
)

export default HelpNudgeBox;