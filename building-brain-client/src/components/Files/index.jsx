import React, { useState, useCallback, useEffect, useRef, } from 'react';
import { Button, TextField, Grid, Typography, IconButton, FormControlLabel, CircularProgress, Divider, Tooltip, Dialog, DialogContent, DialogActions, Box, Checkbox } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import Loading from '../Loading';
import { useDropzone } from 'react-dropzone';
import { DataGrid } from '@mui/x-data-grid';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LinearProgress from '@mui/material/LinearProgress';
import { extractPlatformId, getRolesFromToken, checkRoles } from './../../utils/utils'
import { getServiceGPTClient, uploadFile, getFiles, deleteFile, getAccessToken } from './../../utils/ServiceGPTClient';
import { UniversalAlertCtrl } from '../UniversalAlert';

const Files = () => {
    const [files, setFiles] = useState([]);
    const [allowedToManageFiles, setAllowedToManageFiles] = useState(false);
    const [filenames, setFilenames] = useState([]);
    const [filesData, setFilesData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [uploadComplete, setUploadComplete] = useState({});
    const [onlyUserItems, setOnlyUserItems] = useState(false);
    const fileInputRef = useRef(null);
    const accessToken = getAccessToken()

    useEffect(() => {
        // Usage:
        const userRoles = getRolesFromToken(accessToken);
        const requiredRoles = ['admin'];
        // NOTE: for now we only need to run this check for platformId 1, we should add a more centralized check later
        try {
            checkRoles(userRoles, requiredRoles);
            setAllowedToManageFiles(true);
        } catch (err) {
            console.log(err.message);
            setAllowedToManageFiles(false);
        }
    }, [accessToken])

    const resetModal = () => {
        if (loading && (reason === 'backdropClick' && reason === 'escapeKeyDown')) {
            // Set 'open' to false, however you would do that with your particular code.
            setOpen(false);
            return
        }
        setFiles([]);
        setFilenames([]);
        setUploadProgress({});
        setUploadComplete({});
        setDialogOpen(false);
    };

    const handleFileChange = (files) => {
        setFiles(files);
        setFilenames(files.map(file => file.name));
    };

    const handleFileDrop = (files) => {
        handleFileChange(files);
        setDialogOpen(true);
    };

    const onDrop = useCallback(handleFileDrop, []);

    const { getRootProps, getInputProps, isDragActive, } = useDropzone({ onDrop, noDrag: false, noClick: true, multiple: true, });

    const handleFilenamesChange = (event, index) => {
        const newFilenames = [...filenames];
        newFilenames[index] = event.target.value;
        setFilenames(newFilenames);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const filename = filenames[i];
                const onUploadProgress = (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(prevUploadProgress => ({
                        ...prevUploadProgress,
                        [filename]: percentCompleted,
                    }));
                };

                await uploadFile(file, filename, onUploadProgress);

                UniversalAlertCtrl.show(`File ${file.name} uploaded successfully`, 'success');

                setUploadComplete(prevUploadComplete => ({
                    ...prevUploadComplete,
                    [filename]: true,
                }));
            }
            await fetchFiles();
        } catch (error) {
            console.error(new Error('Failed to upload files'));
        } finally {
            setLoading(false);
            resetModal();
        }
    };

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const response = await getFiles({ onlyUserItems: onlyUserItems ? 1 : 0 });
            setFilesData(response.data.files);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [onlyUserItems]);

    const columns = [
        { field: 'id', headerName: 'ID', width: 200 },
        { field: 'url', headerName: 'URL', width: 300 },
        { field: 'filename', headerName: 'Filename', width: 150 },
        { field: 'platformId', headerName: 'Platform ID', width: 50 },
        { field: 'email', headerName: 'Email', width: 300 },
        { field: 'embedded', headerName: 'Embedded', width: 100 },
        { field: 'active', headerName: 'Active', width: 100 },
        {
            field: 'delete',
            headerName: 'Delete',
            sortable: false,
            width: 100,
            disableClickEventBubbling: true,
            renderCell: (params) => {
                const onClick = async () => {
                    const id = params.id;
                    try {
                        setLoading(true);
                        await deleteFile(id);
                        await fetchFiles();
                    } catch (err) {
                        console.error('Failed to delete file:', err);
                    } finally {
                        setLoading(false);
                    }
                };

                return <IconButton variant="text" onClick={onClick}><DeleteIcon /></IconButton>;
            },
        },
    ];

    const handleFileDialogClick = () => {
        const input = document.getElementById(`hidden-file-input`);
        if (input != null) {
            input.click();
        }
    }

    if (allowedToManageFiles == false) {
        return (
            <Grid container justifyContent={`center`} alignItems={`center`} sx={{ height: `90vh`, padding: 2 }}>
                <Grid item>
                    <Typography sx={{ fontWeight: 600, }} variant={`h6`}>You must be an admin to access this feature</Typography>
                </Grid>
            </Grid>
        )
    }

    return (
        <div {...getRootProps()} style={{ height: `100vh`, width: `99vw` }}>
            <Grid container justifyContent="center" spacing={3} style={{ padding: 10, }}>
                <Grid container item xs={12}>
                    <Grid item xs={9} justifyContent={`flex-end`} alignItems={`flex-end`}>
                        <Typography variant="h5" align="center">
                            <Tooltip title="This section displays your files.">
                                Your Files
                            </Tooltip>
                        </Typography>
                    </Grid>
                    
                    <Grid item xs={0.2} justifyContent={`flex-end`} alignItems={`flex-end`}>
                        <IconButton onClick={() => handleFileDialogClick()} disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : <FileUploadIcon />}
                        </IconButton>
                    </Grid>
                    <Grid item xs={0.3} justifyContent={`flex-end`} alignItems={`flex-end`}>
                        <IconButton onClick={fetchFiles} disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
                        </IconButton>
                    </Grid>
                    <Grid item xs={1.5} justifyContent={`flex-end`} alignItems={`flex-end`}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={onlyUserItems}
                                    onChange={(e) => setOnlyUserItems(e.target.checked)}
                                />
                            }
                            label={(onlyUserItems == true) ? "Showing User Files Only" : "Showing All Files On Your Organization"}
                        />
                    </Grid>
                    <Divider />
                </Grid>
                <Grid item xs={12}>
                    {loading ? <Loading /> : <DataGrid rows={filesData} columns={columns} pageSize={5} />}
                </Grid>
                {isDragActive && <div style={{ border: '2px dashed gray', padding: '20px', cursor: 'pointer', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <Typography variant="body1" align="center" style={{ color: 'white' }}>
                        Drop the file here to upload
                    </Typography>
                </div>}
                <Dialog
                    open={dialogOpen}
                    onClose={resetModal}
                    maxWidth="md"
                    disableBackdropClick={loading}
                    fullWidth={true}
                    PaperProps={{
                        style: {
                            height: '50vh',
                            overflow: 'auto',
                        },
                    }}
                >
                    <DialogContent>
                        <Grid container justifyContent="center" flexDirection={`column`} spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h4" align="center">
                                    File Upload Settings
                                </Typography>
                            </Grid>
                            {files.map((file, index) => (
                                <Grid item xs={12} key={index}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={10}>
                                            {!loading && <TextField
                                                label="File Name"
                                                variant="outlined"
                                                size='medium'
                                                fullWidth
                                                value={filenames[index]}
                                                onChange={event => handleFilenamesChange(event, index)}
                                                disabled={loading}
                                            />}
                                            {loading && <Typography variant="h5">{filenames[index]}</Typography>}
                                        </Grid>
                                        <Grid item xs={2}>
                                            {uploadProgress[filenames[index]] !== undefined && (
                                                <Box display="flex" alignItems="center">
                                                    <Box width="100%" mr={1}>
                                                        <LinearProgress variant="determinate" value={uploadProgress[filenames[index]]} />
                                                    </Box>
                                                    <Box minWidth={35}>
                                                        {uploadComplete[filenames[index]] && <CheckCircleIcon color="primary" />}
                                                    </Box>
                                                </Box>
                                            )}
                                        </Grid>
                                    </Grid>
                                </Grid>
                            ))}
                            <Grid item xs={12} justifyContent={`flex-start`} alignItems={`flex-start`}>
                                <Typography fontWeight={`600`} variant="subtitle1">
                                    files: {files.map(file => file.name).join(', ')}
                                </Typography>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleSubmit} variant="contained" color="primary" type="submit" fullWidth disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : 'Upload'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Grid>
            <input {...getInputProps()} style={{ display: `none` }} id={`hidden-file-input`} ref={fileInputRef} disabled={loading} />
        </div>
    );
}

export default Files;
