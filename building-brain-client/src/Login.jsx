import { Box, Typography, Button, Grid } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import Loading from './components/Loading';
import { lp } from './lp';

const Login = () => {
    const { loginWithRedirect, signup, isAuthenticated } = useAuth0();

    // if (isAuthenticated) {
    //     if(window.location.pathname === '/login') {
    //         window.location.href = '/';
    //     }
    //     return (
    //         <Loading />
    //     )
    // }


    return (
        <Grid container spacing={1} sx={{
            height: `90vh`,
            width: `100vw`,
        }} justifyContent={`center`} alignItems={`center`} direction="column">
            {/* <Grid item sx={{ marginTop: `-10vh` }}>
                <Button sx={{}} variant='contained' onClick={() => loginWithRedirect({  screen_hint: 'signup'  })}>Sign Up</Button>
            </Grid>
            <Grid item sx={{ marginTop: `-10vh`}}>
                <Typography variant={`h4`}>or</Typography>
            </Grid> */}
            <Grid item sx={{ marginTop: `-10vh` }}>
                <Button sx={{}} variant='contained' onClick={() => loginWithRedirect()}>Log In</Button>
            </Grid>

        </Grid>
    )
}



export default Login;