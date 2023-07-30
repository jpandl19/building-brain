import { CameraOutlined, MicOutlined } from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  IconButton,
  InputBase,
  TextField,
} from "@mui/material";
import axios from "axios";
import { Formik } from "formik";
import React from "react";

const InputBox = ({ onMessageAdd }: any) => {
  return (
    <Formik
      enableReinitialize
      initialValues={{
        content: "",
      }}
      onSubmit={(values: any, { setSubmitting, resetForm }) => {
        // Make a POST here and clear the data
        setSubmitting(true);

        axios
          .post(`http://localhost:5001/api/chat`, {
            message: values.content,
          })
          .then((res) => {
            onMessageAdd(values.content, res.data.message);

            resetForm();
          })
          .catch((e) => {});
      }}
    >
      {({
        handleChange,
        handleBlur,
        handleSubmit,
        errors,
        touched,
        values,
        isSubmitting,
        setFieldValue,
      }) => (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "flex",
              border: "solid grey",
              borderRadius: "1em",
              borderWidth: "0.05em",
              padding: "0.5em",
              gap: "1em",
            }}
          >
            <InputBase
              id="content"
              value={values.content}
              name="content"
              onChange={handleChange}
              onBlur={handleBlur}
              style={{ flex: 1 }}
              placeholder="The room I'm in is very hot"
            />
            {isSubmitting ? (
              <CircularProgress />
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button type="submit">Send</Button>
                  <IconButton>
                    <MicOutlined />
                  </IconButton>
                  <IconButton>
                    <CameraOutlined />
                  </IconButton>
                </div>
              </>
            )}
          </div>
        </form>
      )}
    </Formik>
  );
};

export default InputBox;
