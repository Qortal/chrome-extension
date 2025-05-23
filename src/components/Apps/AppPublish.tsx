import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AppCircle,
  AppCircleContainer,
  AppCircleLabel,
  AppDownloadButton,
  AppDownloadButtonText,
  AppInfoAppName,
  AppInfoSnippetContainer,
  AppInfoSnippetLeft,
  AppInfoSnippetMiddle,
  AppInfoSnippetRight,
  AppInfoUserName,
  AppLibrarySubTitle,
  AppPublishTagsContainer,
  AppsLibraryContainer,
  AppsParent,
  AppsWidthLimiter,
  PublishQAppCTAButton,
  PublishQAppChoseFile,
  PublishQAppInfo,
} from "./Apps-styles";
import {
  Avatar,
  Box,
  ButtonBase,
  InputBase,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import {
  Select as BaseSelect,
  SelectProps,
  selectClasses,
  SelectRootSlotProps,
} from "@mui/base/Select";
import { Option as BaseOption, optionClasses } from "@mui/base/Option";
import { styled } from "@mui/system";
import UnfoldMoreRoundedIcon from "@mui/icons-material/UnfoldMoreRounded";
import { Add } from "@mui/icons-material";
import { MyContext, getBaseApiReact, isMobile } from "../../App";
import LogoSelected from "../../assets/svgs/LogoSelected.svg";

import { Spacer } from "../../common/Spacer";
import { executeEvent } from "../../utils/events";
import { useDropzone } from "react-dropzone";
import { LoadingSnackbar } from "../Snackbar/LoadingSnackbar";
import { CustomizedSnackbars } from "../Snackbar/Snackbar";
import { getFee } from "../../background";
import { fileToBase64 } from "../../utils/fileReading";
import { publishData } from "../../qdn/publish/pubish";
import { useSortedMyNames } from "../../hooks/useSortedMyNames";

const CustomSelect = styled(Select)({
  border: "0.5px solid var(--50-white, #FFFFFF80)",
  padding: "0px 15px",
  borderRadius: "5px",
  height: "36px",
  width: "100%",
  maxWidth: "450px",
  "& .MuiSelect-select": {
    padding: "0px",
  },
  "&:hover": {
    borderColor: "none", // Border color on hover
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "none", // Border color when focused
  },
  "&.Mui-disabled": {
    opacity: 0.5, // Lower opacity when disabled
  },
  "& .MuiSvgIcon-root": {
    color: "var(--50-white, #FFFFFF80)",
  },
});

const CustomMenuItem = styled(MenuItem)({
  backgroundColor: "#1f1f1f", // Background for dropdown items
  color: "#ccc",
  "&:hover": {
    backgroundColor: "#333", // Darker background on hover
  },
});

export const AppPublish = ({  categories, myAddress, myName }) => {
  const [names, setNames] = useState([]);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [appType, setAppType] = useState("APP");
  const [file, setFile] = useState(null);
  const { show } = useContext(MyContext);

  const [tag1, setTag1] = useState("");
  const [tag2, setTag2] = useState("");
  const [tag3, setTag3] = useState("");
  const [tag4, setTag4] = useState("");
  const [tag5, setTag5] = useState("");
  const [openSnack, setOpenSnack] = useState(false);
  const [infoSnack, setInfoSnack] = useState(null);
  const mySortedNames = useSortedMyNames(names, myName);

  const [isLoading, setIsLoading] = useState("");
  const maxFileSize = appType === "APP" ? 50 * 1024 * 1024 : 400 * 1024 * 1024; // 50MB or 400MB
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/zip": [".zip"], // Only accept zip files
    },
    maxSize: maxFileSize, // Set the max size based on appType
    multiple: false, // Disable multiple file uploads
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]); // Set the file name
      }
    },
    onDropRejected: (fileRejections) => {
      fileRejections.forEach(({ file, errors }) => {
        errors.forEach((error) => {
          if (error.code === "file-too-large") {
            console.error(
              `File ${file.name} is too large. Max size allowed is ${
                maxFileSize / (1024 * 1024)
              } MB.`
            );
          }
        });
      });
    },
  });

  const getNames = useCallback(async () => {
    if (!myAddress) return;
    try {
      setIsLoading('Loading names');
      const res = await fetch(
        `${getBaseApiReact()}/names/address/${myAddress}?limit=0`
      );
      const data = await res.json();
      setNames(data?.map((item) => item.name));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading('');
    }
  }, [myAddress]);
  useEffect(() => {
    getNames();
  }, [getNames]);

  const getQapp = React.useCallback(async (name, appType) => {
    try {
      setIsLoading("Loading app information");
      const url = `${getBaseApiReact()}/arbitrary/resources/search?service=${appType}&mode=ALL&name=${name}&includemetadata=true`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response?.ok) return;
      const responseData = await response.json();

      if (responseData?.length > 0) {
        const myApp = responseData[0];
        setTitle(myApp?.metadata?.title || "");
        setDescription(myApp?.metadata?.description || "");
        setCategory(myApp?.metadata?.category || "");
        setTag1(myApp?.metadata?.tags[0] || "");
        setTag2(myApp?.metadata?.tags[1] || "");
        setTag3(myApp?.metadata?.tags[2] || "");
        setTag4(myApp?.metadata?.tags[3] || "");
        setTag5(myApp?.metadata?.tags[4] || "");
      }
    } catch (error) {
    } finally {
      setIsLoading("");
    }
  }, []);

  useEffect(() => {
    if (!name || !appType) return;
    getQapp(name, appType);
  }, [name, appType]);

  const publishApp = async () => {
    try {
      const data = {
        name,
        title,
        description,
        category,
        appType,
        file,
      };
      const requiredFields = [
        "name",
        "title",
        "description",
        "category",
        "appType",
        "file",
      ];

      const missingFields: string[] = [];
      requiredFields.forEach((field) => {
        if (!data[field]) {
          missingFields.push(field);
        }
      });
      if (missingFields.length > 0) {
        const missingFieldsString = missingFields.join(", ");
        const errorMsg = `Missing fields: ${missingFieldsString}`;
        throw new Error(errorMsg);
      }
      const fee = await getFee("ARBITRARY");

      await show({
        message: "Would you like to publish this app?",
        publishFee: fee.fee + " QORT",
      });
      setIsLoading("Publishing... Please wait.");
       await publishData({
        registeredName: name, data: file, service: appType, identifier: null, uploadType: 'zip',  withFee: true, title,
        description,
        category,
        tag1,
        tag2,
        tag3,
        tag4,
        tag5
    })
      setInfoSnack({
        type: "success",
        message:
          "Successfully published. Please wait a couple minutes for the network to propogate the changes.",
      });
      setOpenSnack(true);
      const dataObj = {
        name: name,
        service: appType,
        metadata: {
          title: title,
          description: description,
          category: category,
        },
        created: Date.now(),
      };
      executeEvent("addTab", {
        data: dataObj,
      });
    } catch (error) {
      setInfoSnack({
        type: "error",
        message: error?.message || "Unable to publish app",
      });
      setOpenSnack(true);
    } finally {
      setIsLoading("");
    }
  };
  return (
    <AppsLibraryContainer sx={{
      height: !isMobile ? '100%' : 'auto',
      paddingTop: !isMobile && '30px',
      alignItems: !isMobile && 'center'
    }}>
      <AppsWidthLimiter sx={{
        width: !isMobile ? 'auto' : '90%'
      }}>
        <AppLibrarySubTitle>Create Apps!</AppLibrarySubTitle>
        <Spacer height="18px" />
        <PublishQAppInfo>
          Note: Currently, only one App and Website is allowed per Name.
        </PublishQAppInfo>
        <Spacer height="18px" />
        <InputLabel sx={{ color: '#888', fontSize: '14px', marginBottom: '2px' }}>Name/App</InputLabel>
        <CustomSelect
          placeholder="Select Name/App"
          displayEmpty
          value={name}
          onChange={(event) => setName(event?.target.value)}
        >
          <CustomMenuItem value="">
            <em
              style={{
                color: "var(--50-white, #FFFFFF80)",
              }}
            >
              Select Name/App
            </em>{" "}
            {/* This is the placeholder item */}
          </CustomMenuItem>
          {mySortedNames.map((name) => {
            return <CustomMenuItem value={name}>{name}</CustomMenuItem>;
          })}
        </CustomSelect>
        <Spacer height="15px" />
        <InputLabel sx={{ color: '#888', fontSize: '14px', marginBottom: '2px' }}>App service type</InputLabel>
        <CustomSelect
          placeholder="SERVICE TYPE"
          displayEmpty
          value={appType}
          onChange={(event) => setAppType(event?.target.value)}
        >
          <CustomMenuItem value="">
            <em
              style={{
                color: "var(--50-white, #FFFFFF80)",
              }}
            >
              Select App Type
            </em>{" "}
            {/* This is the placeholder item */}
          </CustomMenuItem>
          <CustomMenuItem value={"APP"}>App</CustomMenuItem>
          <CustomMenuItem value={"WEBSITE"}>Website</CustomMenuItem>
        </CustomSelect>
        <Spacer height="15px" />
        <InputLabel sx={{ color: '#888', fontSize: '14px', marginBottom: '2px' }}>Title</InputLabel>
        <InputBase
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{
            border: "0.5px solid var(--50-white, #FFFFFF80)",
            padding: "0px 15px",
            borderRadius: "5px",
            height: "36px",
            width: "100%",
            maxWidth: "450px",
          }}
          placeholder="Title"
          inputProps={{
            "aria-label": "Title",
            fontSize: "14px",
            fontWeight: 400,
          }}
        />
        <Spacer height="15px" />
        <InputLabel sx={{ color: '#888', fontSize: '14px', marginBottom: '2px' }}>Description</InputLabel>
        <InputBase
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{
            border: "0.5px solid var(--50-white, #FFFFFF80)",
            padding: "0px 15px",
            borderRadius: "5px",
            height: "36px",
            width: "100%",
            maxWidth: "450px",
          }}
          placeholder="Description"
          inputProps={{
            "aria-label": "Description",
            fontSize: "14px",
            fontWeight: 400,
          }}
        />

        <Spacer height="15px" />
        <InputLabel sx={{ color: '#888', fontSize: '14px', marginBottom: '2px' }}>Category</InputLabel>
        <CustomSelect
          displayEmpty
          placeholder="Select Category"
          value={category}
          onChange={(event) => setCategory(event?.target.value)}
        >
          <CustomMenuItem value="">
            <em
              style={{
                color: "var(--50-white, #FFFFFF80)",
              }}
            >
              Select Category
            </em>{" "}
            {/* This is the placeholder item */}
          </CustomMenuItem>
          {categories?.map((category) => {
            return (
              <CustomMenuItem value={category?.id}>
                {category?.name}
              </CustomMenuItem>
            );
          })}
        </CustomSelect>
        <Spacer height="15px" />
        <InputLabel sx={{ color: '#888', fontSize: '14px', marginBottom: '2px' }}>Tags</InputLabel>
        <AppPublishTagsContainer>
          <InputBase
            value={tag1}
            onChange={(e) => setTag1(e.target.value)}
            sx={{
              border: "0.5px solid var(--50-white, #FFFFFF80)",
              padding: "0px 15px",
              borderRadius: "5px",
              height: "36px",
              width: "100px",
            }}
            placeholder="Tag 1"
            inputProps={{
              "aria-label": "Tag 1",
              fontSize: "14px",
              fontWeight: 400,
            }}
          />
          <InputBase
            value={tag2}
            onChange={(e) => setTag2(e.target.value)}
            sx={{
              border: "0.5px solid var(--50-white, #FFFFFF80)",
              padding: "0px 15px",
              borderRadius: "5px",
              height: "36px",
              width: "100px",
            }}
            placeholder="Tag 2"
            inputProps={{
              "aria-label": "Tag 2",
              fontSize: "14px",
              fontWeight: 400,
            }}
          />
          <InputBase
            value={tag3}
            onChange={(e) => setTag3(e.target.value)}
            sx={{
              border: "0.5px solid var(--50-white, #FFFFFF80)",
              padding: "0px 15px",
              borderRadius: "5px",
              height: "36px",
              width: "100px",
            }}
            placeholder="Tag 3"
            inputProps={{
              "aria-label": "Tag 3",
              fontSize: "14px",
              fontWeight: 400,
            }}
          />
          <InputBase
            value={tag4}
            onChange={(e) => setTag4(e.target.value)}
            sx={{
              border: "0.5px solid var(--50-white, #FFFFFF80)",
              padding: "0px 15px",
              borderRadius: "5px",
              height: "36px",
              width: "100px",
            }}
            placeholder="Tag 4"
            inputProps={{
              "aria-label": "Tag 4",
              fontSize: "14px",
              fontWeight: 400,
            }}
          />
          <InputBase
            value={tag5}
            onChange={(e) => setTag5(e.target.value)}
            sx={{
              border: "0.5px solid var(--50-white, #FFFFFF80)",
              padding: "0px 15px",
              borderRadius: "5px",
              height: "36px",
              width: "100px",
            }}
            placeholder="Tag 5"
            inputProps={{
              "aria-label": "Tag 5",
              fontSize: "14px",
              fontWeight: 400,
            }}
          />
        </AppPublishTagsContainer>
        <Spacer height="30px" />
        <PublishQAppInfo>
          Select .zip file containing static content:{" "}
        </PublishQAppInfo>
        <Spacer height="10px" />
        <PublishQAppInfo>{`(${
          appType === "APP" ? "50mb" : "400mb"
        } MB maximum)`}</PublishQAppInfo>
        {file && (
          <>
            <Spacer height="5px" />
            <PublishQAppInfo>{`Selected: (${file?.name})`}</PublishQAppInfo>
          </>
        )}

        <Spacer height="18px" />
        <PublishQAppChoseFile {...getRootProps()}>
          {" "}
          <input {...getInputProps()} />
          Choose File
        </PublishQAppChoseFile>
        <Spacer height="35px" />
        <PublishQAppCTAButton
          sx={{
            alignSelf: "center",
          }}
          onClick={publishApp}
        >
          Publish
        </PublishQAppCTAButton>
      </AppsWidthLimiter>
      <LoadingSnackbar
        open={!!isLoading}
        info={{
          message: isLoading,
        }}
      />
      <CustomizedSnackbars
        duration={3500}
        open={openSnack}
        setOpen={setOpenSnack}
        info={infoSnack}
        setInfo={setInfoSnack}
      />
      
    </AppsLibraryContainer>
  );
};
