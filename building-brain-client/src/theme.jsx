import { createTheme } from '@mui/material';
import './assets/fonts/fonts.css'
import {lp} from './lp';
import { alpha } from "@mui/material";
import ServiceGPTLogo from './assets/serviceGPTLogo.png'
import BuildingBrainLogo from './assets/BuildingBrainLogo.png'


export const baseTheme = {
    branding: {
        logo: BuildingBrainLogo,
        logoSize: 50,
        title: `Building Brain`,
    },
    palette: {
        primary: {
            main: lp.primary.main,
            background: lp.slate.lighter,
            alt: lp.slate.darkest,
        },
        secondary: {
            main: lp.secondary.main,
        },
        text: {
            primary: lp.slate.darkest,
            secondary: lp.slate.darker,
            disabled: lp.slate.lighter,
            hint: lp.slate.darker,
        },
        navigation: {
            background: lp.slate.white,
            userBackground: lp.slate.lighter,
            textColor: lp.slate.darker,
        },
        header: {
            backgroundColor: lp.blue.darkest,
            textColor: lp.slate.white,
        },
        error: {
            main: lp.red.dark,
        },
        warning: {
            main: lp.orange.dark,
        },
        info: {
            main: lp.blue.light,
        },
        success: {
            main: lp.green.primary,
            contrastText: lp.green.dark,
        },
    },
    typography: {
        fontFamily: 'Raleway, Raleway',
        fontSize: 14,
        body2: {
            fontFamily: 'Raleway',
            fontSize: 13,
        },
        body1: {
            fontFamily: 'Raleway',
            fontSize: 14,
        },
        h1: {
            fontFamily: 'Raleway',
            fontSize: 39,
            fontWeight: 700,
            margin: '.67em 0'
        },
        h2: {
            fontFamily: 'Raleway',
            fontSize: 39,
            fontWeight: 700,
        },
        h3: {
            fontFamily: 'Raleway',
            fontSize: 31,
            fontWeight: 700,
        },
        h4: {
            fontFamily: 'Raleway',
            fontSize: 25,
            fontWeight: 700,
        },
        h5: {
            fontFamily: 'Raleway',
            fontSize: 20,
            fontWeight: 700,
        },
        h6: {
            fontFamily: 'Raleway',
            fontSize: 17,
            fontWeight: 700,
        },
        subtitle1: {
            fontSize: 13,
        },
        subtitle2: {
            fontSize: 13,
            fontWeight: 600,
        },
        button: {
            fontFamily: 'Raleway',
            fontSize: '1rem',
            fontWeight: 700,
            fontKerning: '1rem',
        },
    },
    components: {
        MuiButton: {
            defaultProps: {
                // The props to change the default for.
                disableRipple: true,
                size: 'large',
                variant: 'contained',
                // disableElevation: true,
            },
            styleOverrides: {
                root: {
                    textTransform: 'capitalize',

                    // contained primary
                    '&.MuiButton-containedPrimary.Mui-disabled': {
                        color: lp.slate.white,
                    },
                    '&.MuiButton-containedPrimary.Mui-focusVisible': {
                        backgroundColor: lp.blue.darkest,
                    },
                    '&.MuiButton-containedPrimary:active': {
                        backgroundColor: lp.slate.primary,
                    },

                    // outlined primary
                    '&.MuiButton-outlinedPrimary.Mui-focusVisible': {
                        color: lp.blue.darkest,
                        border: '1px solid ' + lp.blue.darkest,
                        backgroundColor: 'transparent',
                        boxShadow: '0px 1px 4px 1px ' + lp.transparent.blueThirty,
                    },
                    '&.MuiButton-outlinedPrimary:hover': {
                        color: lp.blue.darkest,
                        border: '1px solid ' + lp.blue.darkest,
                        backgroundColor: 'transparent',
                        boxShadow: '0px 1px 4px 1px ' + lp.transparent.blueThirty,
                    },
                    '&.MuiButton-outlinedPrimary:active': {
                        color: lp.slate.white,
                        backgroundColor: lp.slate.primary,
                    },

                    // text primary
                    '&.MuiButton-textPrimary.Mui-focusVisible': {
                        color: lp.blue.darkest,
                        backgroundColor: 'transparent',
                        boxShadow: '0px 1px 4px 1px ' + lp.transparent.blueThirty,
                    },
                    '&.MuiButton-textPrimary:hover': {
                        color: lp.blue.darkest,
                        backgroundColor: 'transparent',
                        boxShadow: '0px 1px 4px 1px ' + lp.transparent.blueThirty,
                    },
                    '&.MuiButton-textPrimary:active': {
                        color: lp.blue.darkest,
                        backgroundColor: lp.slate.lightest,
                        boxShadow: '0px 1px 4px 1px ' + lp.transparent.blueThirty,
                    },

                    // outlined error
                    '&.MuiButton-outlinedError.Mui-focusVisible': {
                        color: lp.red.dark,
                        border: '1px solid ' + lp.red.dark,
                        backgroundColor: 'transparent',
                        boxShadow: '0px 1px 4px 1px ' + lp.transparent.blueThirty,
                    },
                    '&.MuiButton-outlinedError:hover': {
                        color: lp.red.dark,
                        border: '1px solid ' + lp.red.dark,
                        backgroundColor: 'transparent',
                        boxShadow: '0px 1px 4px 1px ' + lp.transparent.blueThirty,
                    },
                    '&.MuiButton-outlinedError:active': {
                        color: 'white',
                        backgroundColor: lp.red.darkest,
                    },
                },
            },
        },
        MuiIconButton: {
            defaultProps: {
                // The props to change the default for.
                disableRipple: true,
                variant: 'text',
            },
            variants: [
                {
                    props: { variant: 'contained' },
                    style: {
                        backgroundColor: lp.blue.dark,
                        color: 'white',
                        '&:hover, &:focus': {
                            backgroundColor: lp.blue.darkest,
                        },
                        '&:active': {
                            backgroundColor: lp.slate.primary,
                        },
                        '&:disabled': {
                            color: 'white',
                            backgroundColor: lp.slate.lighter,
                        },
                    },
                },
                {
                    props: { variant: 'outlined' },
                    style: {
                        backgroundColor: 'transparent',
                        border: '1px solid ' + lp.transparent.greyFifty,
                        color: lp.blue.dark,
                        '&:hover, &:focus': {
                            color: lp.blue.darkest,
                            border: '1px solid ' + lp.blue.darkest,
                            backgroundColor: 'transparent',
                            boxShadow: '0px 1px 4px 1px ' + lp.transparent.blueThirty,
                        },
                        '&.Mui-disabled': {
                            border: 'none',
                        },
                        '&:active': {
                            color: 'white',
                            backgroundColor: lp.slate.primary,
                        },
                        '&:disabled': {
                            border: '1px solid ' + lp.slate.lighter,
                        },
                    },
                },
                {
                    props: { variant: 'icon' },
                    style: {
                        '&:hover, &:focus': {
                            color: lp.blue.darkest,
                            backgroundColor: 'transparent',
                            boxShadow: '0px 1px 4px 1px ' + lp.transparent.blueThirty,
                        },
                        '&:active': {
                            color: lp.blue.darkest,
                            backgroundColor: lp.slate.lightest,
                            boxShadow: '0px 1px 4px 1px ' + lp.transparent.blueThirty,
                        },
                    },
                },
            ],
            styleOverrides: {
                root: {
                    borderRadius: '4px',
                },
            },
        },
        MuiSwitch: {
            defaultProps: {},
            styleOverrides: {
                root: {
                    width: 44,
                    height: 22,
                    padding: 0,
                    margin: 9,
                    display: 'flex',
                    transition: 'all .2s',
                    borderRadius: 22 / 2,
                    '& .MuiSwitch-track': {
                        borderRadius: 22 / 2,
                        opacity: 1,
                        backgroundColor: lp.slate.lighter,
                        boxSizing: 'border-box',
                        border: '1px solid ' + lp.slate.lighter,
                    },
                    '& .MuiSwitch-thumb': {
                        boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
                        width: 17,
                        height: 17,
                        borderRadius: 17,
                        backgroundColor: 'white',
                    },
                    '& .Mui-disabled + span': {
                        backgroundColor: '#9f9f9f',
                        border: '1px solid ' + lp.blue.dark,
                    },
                    '& .MuiSwitch-switchBase': {
                        padding: 2.5,
                        '&.Mui-focusVisible': {
                            backgroundColor: 'rgba(198, 203, 212, 0.3)',
                            '& .MuiSwitch-thumb': {
                                backgroundColor: lp.slate.primary,
                            },
                        },
                        '&.Mui-checked': {
                            transform: 'translateX(22px)',
                            '& + .MuiSwitch-track': {
                                opacity: 1,
                                backgroundColor: lp.blue.primary,
                                border: '1px solid ' + lp.blue.primary,
                            },
                            '& .MuiSwitch-thumb': {
                                opacity: 1,
                                backgroundColor: 'white',
                            },
                            '&.Mui-disabled + span': {
                                backgroundColor: '#e4eaf6',
                                border: 'none',
                            },
                            '&.Mui-disabled .MuiSwitch-thumb': {
                                backgroundColor: 'white',
                            },
                        },
                    },
                },
            },
        },
        MuiRadio: {
            defaultProps: {
                disableRipple: true,
            },
            styleOverrides: {
                root: {
                    '&:hover': {
                        background:
                            'radial-gradient(35% 35% at center,#FFF 20% 56% , rgb(54 104 255 / 8%) 0% 86%,transparent 91% 100%)',
                    },
                    '&:focus': {
                        background:
                            'radial-gradient(35% 35% at center,#FFF 20% 56% , rgb(54 104 255 / 8%) 0% 86%,transparent 91% 100%)',
                    },
                    '.radioChecked': {
                        stroke: lp.blue.primary,
                        fill: lp.blue.primary,
                    },
                    '.radioUnChecked': {
                        stroke: lp.slate.evenLighter,
                    },
                },
            },
        },
        MuiCheckbox: {
            defaultProps: {
                disableRipple: true,
                size: 'small',
            },
            styleOverrides: {
                root: {},
            },
        },
        MuiPagination: {
            defaultProps: {
                size: 'small',
                variant: 'outlined',
                color:'primary',

            },
            styleOverrides: {
                root: {
                    fontFamily: 'Raleway',
                },
            },
        },
        MuiPaginationItem: {
            defaultProps: {
                rounded:false,
                color:'primary',
                disableRipple: true,
            },
            styleOverrides: {
                root: {
                    borderRadius:'3px',
                    fontFamily: 'Raleway',
                    fontSize: '14px',
                    height:'18px',
                    marginRight:'8px',
                    border: '1px solid #d9d9d9',
                    '&.Mui-selected':{
                        backgroundColor:'transparent',
                        '&:focus': {
                        backgroundColor:'transparent',
                            color: lp.slate.darkest,
                            border: '1px solid ' + lp.slate.darkest,
                        },
                        '&:hover': {
                            backgroundColor:'transparent',
                            color: lp.slate.darkest,
                            border: '1px solid ' + lp.slate.darkest,
                        }
                    },
                    '&:focus':{
                        backgroundColor:'transparent',
                        border: '1px solid ' + lp.transparent.greyFifty,
                        color: lp.blue.dark
                    },
                    '&:hover':{
                        backgroundColor:'transparent',
                        border: '1px solid ' + lp.transparent.greyFifty,
                        color: lp.blue.dark
                    },
                    '&.MuiPaginationItem-ellipsis':{
                        border: '0',
                        color: lp.slate.darkest
                    }
                },
            },
        },
        MuiTablePagination: {
            defaultProps: {
                disableRipple: true,
            },
            styleOverrides: {
                root: {
                },
                selectLabel: {
                    fontFamily: 'Raleway',
                    fontSize: '14px',
                },
                displayedRows: {
                    fontFamily: 'Raleway',
                    fontSize: '14px',
                },
                actions: {
                    '& button': {
                        borderRadius:'3px',
                        fontFamily: 'Raleway',
                        fontSize: '14px',
                        height:'18px',
                        padding:'0 4px',
                        backgroundColor:'transparent',
                        border: '1px solid #d9d9d9',
                        'svg': {
                            width:'19px',
                            fill:lp.slate.darkest
                        },
                        '&:focus':{
                            backgroundColor:'transparent',
                            border: '1px solid ' + lp.transparent.greyFifty,
                            'svg': {
                                width:'19px',
                                fill:lp.blue.dark
                            },
                        },
                        '&:hover':{
                            backgroundColor:'transparent',
                            border: '1px solid ' + lp.transparent.greyFifty,
                            'svg': {
                                width:'19px',
                                fill:lp.blue.dark
                            },
                        },
                        '&:disabled':{
                            backgroundColor:'transparent',
                            border: '1px solid ' + lp.transparent.blackTwentyFive,
                            'svg': {
                                width:'19px',
                                fill: lp.transparent.blackTwentyFive
                            },
                        },
                    },
                    '& button:first-of-type': {
                        marginRight:'8px',
                        marginLeft:'-8px',
                    }
                },
                input: {
                    maxWidth: 'fit-content',

                },
            }
        },
        MuiTooltip: {
            defaultProps: {
                arrow: true
            },
            styleOverrides: {
                tooltip: {
                    fontSize: "14px",
                    fontWeight: 'normal',
                    color: "white",
                    backgroundColor:  lp.transparent.blackSeventyFive
                },
                arrow: {
                    color:  lp.transparent.blackSeventyFive
                }
            },
        },
        MuiAlert: {
            defaultProps: {
            },
            styleOverrides: {
                root:{
                    fontFamily: 'Raleway',
                    fontSize: '14px',
                    fontWeight: 'normal',
                },
                message:{
                    'div':{
                        fontSize: '16px',
                    }
                },
                standardSuccess: {
                    backgroundColor: lp.green.lightest,
                    border: '1px solid ' + lp.green.dark,
                    '& .alert':{
                        fill: lp.green.dark
                    }
                },
                standardInfo:{
                    backgroundColor: '#f0f6ff',
                    border: '1px solid #b0ccff',
                    '& .alert':{
                        fill:'#b0ccff'
                    }
                },
                standardWarning:{
                    backgroundColor: lp.orange.lightest,
                    border: '1px solid ' + lp.orange.primary,
                    '& .alert':{
                        fill: lp.orange.primary
                    }
                },
                standardError:{
                    backgroundColor: lp.red.lightest,
                    border: '1px solid ' + lp.red.primary,
                    '& .alert':{
                        fill: lp.red.primary
                    }
                },
                action:{
                    '& button':{
                        backgroundColor: 'transparent',
                        color: lp.slate.darker,
                        '&:hover':{
                            backgroundColor: lp.transparent.greyFifty,
                        },
                        '&:focus':{
                            backgroundColor: lp.transparent.greyFifty,
                        },
                    }
                }
            },
        },
        MuiChip: {
            defaultProps: {
                size:'small',
            },
            styleOverrides: {
                root:{
                    fontSize: '13px',
                },
                sizeSmall:{
                    padding:'5px',
                    backgroundColor: lp.slate.lightest
                }
            },
        },
        MuiInputBase: {
            defaultProps: {
                fullWidth: 'true',
            },
            styleOverrides: {
                root:{
                    'input': {
                        borderRadius: '3px',
                        fontSize: '14px',
                        lineHeight: '1.5715',
                        textOverflow: 'ellipsis',
                    },
                    '.MuiInputBase-inputSizeSmall':{
                        padding:'4px 23px',
                    },
                    'input:disabled': {
                        backgroundColor: lp.slate.lighter,
                        cursor: 'not-allowed',
                        borderColor: lp.slate.lighter,
                    },
                    '&:has(textarea:disabled)': {
                        backgroundColor: lp.slate.lighter,
                    },
                    'textarea:disabled': {
                        cursor: 'not-allowed',
                    },
                    '&:has(textarea)': {
                        borderRadius: '3px',
                        fontSize: '14px',
                        lineHeight: '1.5715',
                        textOverflow: 'ellipsis',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        boxShadow: '0 0 0 2px ' + lp.transparent.blueThirty,
                        border:'1px solid ' + lp.blue.primary +' !important',
                    }
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                fullWidth: 'true',
                size: 'small',
                variant: 'outlined',
            },
            styleOverrides: {
                root:{
                    '.Mui-disabled .MuiOutlinedInput-notchedOutline': {
                        border:'1px solid #d9d9d9 !important',
                    },
                    '.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border:'1px solid ' + lp.blue.primary + ' !important',
                    },
                    '&:has(textarea:focus) .MuiInputBase-root':{
                        borderRadius: '3px',
                    },
                },
            },
        },
        MuiSelect: {
            defaultProps: {
                fullWidth: 'true',
                size: 'small',
                variant: 'outlined',
            },
            styleOverrides: {
                root: {
                    '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
                        border:'1px solid #d9d9d9 !important',
                    },
                    '.Mui-disabled': {
                        backgroundColor: lp.slate.lighter,
                        cursor: 'not-allowed',
                        borderColor: lp.slate.lighter,
                    }
                },
            }
        },
        MuiMenuItem: {
            defaultProps: {
            },
            styleOverrides: {
                root: {
                    padding:'4px 23px',
                    '&.Mui-selected': {
                        fontWeight: 'bold',
                        backgroundColor: lp.blue.lightest,
                    },
                },
            }
        },
        // NAV
        MuiDrawer: {
            defaultProps: {
            },
            styleOverrides: {
                root: {
                    '& .MuiTabs-root': {
                        backgroundColor: '#004987',
                        '.MuiTabs-flexContainer *':{
                            flex: 1,
                        },
                        '.MuiButtonBase-root':{
                            fontSize: '1em',
                            fontWeight: '400',
                            textTransform: 'capitalize',
                            color: 'inherit'
                        },
                    },
                    '.MuiTabs-indicator':{
                        backgroundColor: lp.slate.white,
                        height:'1px',
                    },
                    '.MuiBox-root':{
                        padding: '0',
                    },
                    '.MuiListSubheader-root':{
                        backgroundColor: 'inherit',
                        color: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'left',
                    },
                    '.MuiListItemButton-root':{
                        'border-radius': '100px',
                        '&:focus, &:hover': {
                            'background': alpha(lp.slate.white, 0.1),
                        },
                    },
                    '.MuiTypography-root':{
                        fontWeight: '700',
                    },
                    '.MuiSvgIcon-root':{
                        fontSize: '1.1em',
                    },
                    '.MuiListItemIcon-root':{
                        minWidth: '1.8em',
                    },
                    '.MuiListItem-root':{
                        fontWeight:'700'
                    },
                    '.nav-layout-bottom-list':{
                        '.MuiListItemButton-root':{
                            borderRadius: '0 !important',
                            padding: '1rem 0.8rem 1rem 0.8rem',
                            fontFamily: 'Raleway',
                            fontStyle: 'normal',
                            fontWeight: 700,
                            fontSize: '13px',
                            lineHeight: '18px',
                            display:'flex',
                            alignItems: 'center',
                            justifyContent:'space-between',
                            '&:hover, &:focus':{
                                'background': alpha(lp.slate.white, 0.1),
                            },
                        },
                        '.start-icon':{
                            fontSize: '1.3em',
                            marginRight: '12px'
                        },
                        '.end-icon':{
                            fontSize: '1.3em',
                        },
                    },
                    '.MuiPaper-root':{
                    },
                    '.shadow':{
                        width: '100px',
                        height: '100px',
                    }
                },
            }
        },
        MuiListSubheader: {
            defaultProps: {
                disableSticky: true,
            },
            styleOverrides: {
                fontHeight:'14px !important'
            }
        },
    },
    props: {},
};


const defaultTheme = createTheme(baseTheme);

export { defaultTheme }

export default defaultTheme