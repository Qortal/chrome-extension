import { useEffect, useMemo, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useDropzone } from "react-dropzone";
import { Box, Input, InputLabel, Tooltip, Typography } from "@mui/material";
import { decryptStoredWallet } from "./utils/decryptWallet";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import Logo1 from "./assets/svgs/Logo1.svg";
import Logo1Dark from "./assets/svgs/Logo1Dark.svg";

import Logo2 from "./assets/svgs/Logo2.svg";
import Copy from "./assets/svgs/Copy.svg";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Download from "./assets/svgs/Download.svg";
import Logout from "./assets/svgs/Logout.svg";
import Return from "./assets/svgs/Return.svg";
import Success from "./assets/svgs/Success.svg";
import Info from "./assets/svgs/Info.svg";
import {
  createAccount,
  generateRandomSentence,
  saveFileToDisk,
} from "./utils/generateWallet/generateWallet";
import { kdf } from "./deps/kdf";
import { generateSaveWalletData } from "./utils/generateWallet/storeWallet";
import { crypto, walletVersion } from "./constants/decryptWallet";
import PhraseWallet from "./utils/generateWallet/phrase-wallet";
import {
  AddressBox,
  AppContainer,
  AuthenticatedContainer,
  AuthenticatedContainerInnerLeft,
  AuthenticatedContainerInnerRight,
  CustomButton,
  CustomInput,
  CustomLabel,
  TextItalic,
  TextP,
  TextSpan,
} from "./App-styles";
import { Spacer } from "./common/Spacer";
import { Loader } from "./components/Loader";
import { PasswordField } from "./components";

type extStates =
  | "not-authenticated"
  | "authenticated"
  | "send-qort"
  | "web-app-request-connection"
  | "web-app-request-payment"
  | "web-app-request-authentication"
  | "download-wallet"
  | "create-wallet"
  | "transfer-success-regular"
  | "transfer-success-request";

function App() {
  const [extState, setExtstate] = useState<extStates>("not-authenticated");
  const [backupjson, setBackupjson] = useState<any>(null);
  const [rawWallet, setRawWallet] = useState<any>(null);
  const [decryptedWallet, setdecryptedWallet] = useState<any>(null);
  const [requestConnection, setRequestConnection] = useState<any>(null);
  const [requestAuthentication, setRequestAuthentication] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [paymentTo, setPaymentTo] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentPassword, setPaymentPassword] = useState<string>("");
  const [sendPaymentError, setSendPaymentError] = useState<string>("");
  const [sendPaymentSuccess, setSendPaymentSuccess] = useState<string>("");
  const [countdown, setCountdown] = useState<null | number>(null);
  const [walletToBeDownloaded, setWalletToBeDownloaded] = useState<any>(null);
  const [walletToBeDownloadedPassword, setWalletToBeDownloadedPassword] =
    useState<string>("");
  const [sendqortState, setSendqortState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [
    walletToBeDownloadedPasswordConfirm,
    setWalletToBeDownloadedPasswordConfirm,
  ] = useState<string>("");
  const [walletToBeDownloadedError, setWalletToBeDownloadedError] =
    useState<string>("");

    const holdRefExtState = useRef<extStates>("not-authenticated")
  useEffect(()=> {
    if(extState){
      holdRefExtState.current = extState
    }
  }, [extState])

  const address = useMemo(() => {
    if (!rawWallet?.address0) return "";
    return rawWallet.address0;
  }, [rawWallet]);
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/json": [".json"], // Only accept JSON files
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file: any = acceptedFiles[0];
      const fileContents = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onabort = () => reject("File reading was aborted");
        reader.onerror = () => reject("File reading has failed");
        reader.onload = () => {
          // Resolve the promise with the reader result when reading completes
          resolve(reader.result);
        };

        // Read the file as text
        reader.readAsText(file);
      });
    
      let error: any = null;
      let pf: any;

      try {
        if (typeof fileContents !== "string") return;
        pf = JSON.parse(fileContents);
      } catch (e) {}

      try {
        const requiredFields = [
          "address0",
          "salt",
          "iv",
          "version",
          "encryptedSeed",
          "mac",
          "kdfThreads",
        ];
        for (const field of requiredFields) {
          if (!(field in pf)) throw new Error(field + " not found in JSON");
        }
        // setBackupjson(pf)
        storeWalletInfo(pf);
        setRawWallet(pf);
        setExtstate("authenticated");
        setdecryptedWallet(null);
      } catch (e) {
        console.log(e);

        error = e;
      }
    },
  });

  

  const saveWalletFunc = async (password: string) => {
    let wallet = structuredClone(rawWallet);

    const res = await decryptStoredWallet(password, wallet);
    const wallet2 = new PhraseWallet(res, walletVersion);
    wallet = await wallet2.generateSaveWalletData(
      password,
      crypto.kdfThreads,
      () => {}
    );

    setWalletToBeDownloaded({
      wallet,
      qortAddress: rawWallet.address0,
    });
    return {
      wallet,
      qortAddress: rawWallet.address0,
    };
  };

  const storeWalletInfo = (wallet: any) => {
    chrome.runtime.sendMessage(
      { action: "storeWalletInfo", wallet },
      (response) => {
        if (response) {
        }
      }
    );

    chrome.tabs.query(
      { active: true, currentWindow: true },
      function (tabs: any[]) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { from: "popup", subject: "anySubject" },
          function (response) {
           
          }
        );
      }
    );
  };
 
 
  const getBalanceFunc = () => {
    chrome.runtime.sendMessage({ action: "balance" }, (response) => {
      if (response && !response?.error) {
        setBalance(response);
      }
    });
  };
  const sendCoinFunc = () => {
    setSendPaymentError("");
    setSendPaymentSuccess("");
    if (!paymentTo) {
      setSendPaymentError("Please enter a recipient");
      return;
    }
    if (!paymentAmount) {
      setSendPaymentError("Please enter an amount greater than 0");
      return;
    }
    if (!paymentPassword) {
      setSendPaymentError("Please enter your wallet password");
      return;
    }
    setIsLoading(true)
    chrome.runtime.sendMessage(
      {
        action: "sendCoin",
        payload: {
          amount: Number(paymentAmount),
          receiver: paymentTo.trim(),
          password: paymentPassword,
        },
      },
      (response) => {
        if (response?.error) {
          setSendPaymentError(response.error);
        } else {
          setExtstate("transfer-success-regular");
          // setSendPaymentSuccess("Payment successfully sent");
        }
        setIsLoading(false)
      }
    );
  };


  const clearAllStates = () => {
    setRequestConnection(null);
    setRequestAuthentication(null);
  };

  useEffect(() => {
    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
     
      // Check if the message is to update the state
      if (message.action === "UPDATE_STATE_CONFIRM_SEND_QORT") {
        // Update the component state with the received 'sendqort' state
        setSendqortState(message.payload);
        setExtstate("web-app-request-payment");
      } else if (message.action === "closePopup") {
        // Update the component state with the received 'sendqort' state
        window.close();
      } else if (message.action === "UPDATE_STATE_REQUEST_CONNECTION") {
        // Update the component state with the received 'sendqort' state
        setRequestConnection(message.payload);
        setExtstate("web-app-request-connection");
      } else if (message.action === "UPDATE_STATE_REQUEST_AUTHENTICATION") {
        // Update the component state with the received 'sendqort' state
        setRequestAuthentication(message.payload);
        setExtstate("web-app-request-authentication");
      } else if (message.action === "SET_COUNTDOWN") {
        setCountdown(message.payload);
      }
    });
  }, []);

 
  //param = isDecline
  const confirmPayment = (isDecline: boolean) => {
    if (isDecline) {
      chrome.runtime.sendMessage(
        {
          action: "sendQortConfirmation",
          payload: {
            amount: sendqortState?.amount,
            receiver: sendqortState?.address,
            password: paymentPassword,
            interactionId: sendqortState?.interactionId,
            isDecline: true,
          },
        },
        (response) => {
          if (response) {
            setSendPaymentSuccess("Payment successfully sent");
          } else {
            window.close();
          }
        }
      );
      return;
    }
    if (!paymentPassword) {
      setSendPaymentError("Please enter your wallet password");
      return;
    }
    setIsLoading(true)
    chrome.runtime.sendMessage(
      {
        action: "sendQortConfirmation",
        payload: {
          amount: sendqortState.amount,
          receiver: sendqortState.address,
          password: paymentPassword,
          interactionId: sendqortState.interactionId,
          isDecline: false,
        },
      },
      (response) => {
        if (response === true) {
          setExtstate("transfer-success-request");
          setCountdown(null);
          // setSendPaymentSuccess("Payment successfully sent");
        } else {
         
          setSendPaymentError(
            response?.error || "Unable to perform payment. Please try again."
          );
        }
        setIsLoading(false)
      }
    );
  };
  const responseToConnectionRequest = (
    isOkay: boolean,
    hostname: string,
    interactionId: string
  ) => {
    chrome.runtime.sendMessage(
      {
        action: "responseToConnectionRequest",
        payload: { isOkay, hostname, interactionId },
      },
      (response) => {
        if (response === false || response === true) {
          window.close();
        }
      }
    );
  };

  // const rawWalletRef = useRef(null)

  // useEffect(()=> {
  //   rawWalletRef.current = rawWallet
  // }, [rawWallet])
  

  useEffect(() => {
    try {
      setIsLoading(true)
      chrome.runtime.sendMessage({ action: "getWalletInfo" }, (response) => {
        if (response && response?.walletInfo) {
          setRawWallet(response?.walletInfo);
          if(holdRefExtState.current === 'web-app-request-payment' || holdRefExtState.current === 'web-app-request-connection') return
          setExtstate("authenticated");
        }
      });
    } catch (error) {} finally {
      setIsLoading(false)
    }
  }, []);

  useEffect(() => {
    if (!address) return;
    try {
      chrome.runtime.sendMessage({ action: "userInfo" }, (response) => {
        if (response && !response.error) {
          setUserInfo(response);
        }
      });
      getBalanceFunc();
    } catch (error) {}
  }, [address]);

  useEffect(() => {
    return () => {
      console.log("exit");
    };
  }, []);

  const confirmPasswordToDownload = async () => {
    try {
      setWalletToBeDownloadedError("");
      if (!walletToBeDownloadedPassword) {
        setSendPaymentError("Please enter your password");
        return;
      }
      setIsLoading(true)
      await new Promise<void>((res)=> {
        setTimeout(()=> {
          res()
        }, 250)
      })
      const res = await saveWalletFunc(walletToBeDownloadedPassword);
    } catch (error: any) {
      setWalletToBeDownloadedError(error?.message);
    } finally {
      setIsLoading(false)

    }
  };

  const saveFileToDiskFunc = async () => {
    try {
      await saveFileToDisk(
        walletToBeDownloaded.wallet,
        walletToBeDownloaded.qortAddress
      );
    } catch (error: any) {
      setWalletToBeDownloadedError(error?.message);
    } finally {
    }
  };

  const createAccountFunc = async () => {
    try {
      if (!walletToBeDownloadedPassword) {
        setWalletToBeDownloadedError("Please enter a password");
        return;
      }
      if (!walletToBeDownloadedPasswordConfirm) {
        setWalletToBeDownloadedError("Please confirm your password");
        return;
      }
      if (
        walletToBeDownloadedPasswordConfirm !== walletToBeDownloadedPassword
      ) {
        setWalletToBeDownloadedError("Password fields do not match!");
        return;
      }
      setIsLoading(true)
      await new Promise<void>((res)=> {
        setTimeout(()=> {
          res()
        }, 250)
      })
      const res = await createAccount();
      const wallet = await res.generateSaveWalletData(
        walletToBeDownloadedPassword,
        crypto.kdfThreads,
        () => {}
      );
      setRawWallet(wallet);
      storeWalletInfo(wallet);
      setWalletToBeDownloaded({
        wallet,
        qortAddress: wallet.address0,
      });
    } catch (error: any) {
      setWalletToBeDownloadedError(error?.message);
    } finally {
      setIsLoading(false)

    }
  };

  const logoutFunc = () => {
    try {
      chrome.runtime.sendMessage({ action: "logout" }, (response) => {
        if (response) {
          resetAllStates();
        }
      });
    } catch (error) {}
  };

  const returnToMain = () => {
    setPaymentTo("");
    setPaymentAmount(0);
    setPaymentPassword("");
    setSendPaymentError("");
    setSendPaymentSuccess("");
    setCountdown(null);
    setWalletToBeDownloaded(null);
    setWalletToBeDownloadedPassword("");
    setExtstate("authenticated");
  };

  const resetAllStates = () => {
    setExtstate("not-authenticated");
    setBackupjson(null);
    setRawWallet(null);
    setdecryptedWallet(null);
    setRequestConnection(null);
    setRequestAuthentication(null);
    setUserInfo(null);
    setBalance(null);
    setPaymentTo("");
    setPaymentAmount(0);
    setPaymentPassword("");
    setSendPaymentError("");
    setSendPaymentSuccess("");
    setCountdown(null);
    setWalletToBeDownloaded(null);
    setWalletToBeDownloadedPassword("");
    setWalletToBeDownloadedPasswordConfirm("");
    setWalletToBeDownloadedError("");
    setSendqortState(null);
  };

  return (
    <AppContainer>
      {extState === "not-authenticated" && (
        <>
          <Spacer height="48px" />
          <div className="image-container" style={{
            width: '136px',
            height: '154px'
          }}>
            <img src={Logo1} className="base-image" />
            <img src={Logo1Dark} className="hover-image" />
          </div>
          <Spacer height="38px" />
          <TextP
            sx={{
              textAlign: "center",
              lineHeight: "15px",
            }}
          >
            WELCOME TO <TextItalic>YOUR</TextItalic> <br></br>
            <TextSpan> QORTAL WALLET</TextSpan>
          </TextP>
          <Spacer height="38px" />
          <Box
            sx={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginLeft: "28px",
            }}
          >
            <CustomButton {...getRootProps()}>
              <input {...getInputProps()} />
              Authenticate
            </CustomButton>
            <Tooltip
              title="Authenticate by importing your Qortal JSON file"
              arrow
            >
              <img src={Info} />
            </Tooltip>
          </Box>

          <Spacer height="6px" />
          <Box
            sx={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginLeft: "28px",
            }}
          >
            <CustomButton
              onClick={() => {
                setExtstate("create-wallet");
              }}
            >
              Create account
            </CustomButton>

            <img
              src={Info}
              style={{
                visibility: "hidden",
              }}
            />
          </Box>
        </>
      )}
      {/* {extState !== "not-authenticated" && (
        <button onClick={logoutFunc}>logout</button>
      )} */}
      {extState === "authenticated" && (
        <AuthenticatedContainer>
          <AuthenticatedContainerInnerLeft>
            <Spacer height="48px" />
            <img src={Logo2} />
            <Spacer height="32px" />
            <TextP
              sx={{
                textAlign: "center",
                lineHeight: "24px",
                fontSize: "20px",
              }}
            >
              {userInfo?.name}
            </TextP>
            <Spacer height="10px" />
            <CopyToClipboard text={rawWallet?.address0}>
              <AddressBox>
                {rawWallet?.address0?.slice(0, 6)}...
                {rawWallet?.address0?.slice(-4)} <img src={Copy} />
              </AddressBox>
            </CopyToClipboard>
            <Spacer height="10px" />
            {balance && (
               <TextP
               sx={{
                 textAlign: "center",
                 lineHeight: "24px",
                 fontSize: "20px",
                 fontWeight: 700,
               }}
             >
               {balance?.toFixed(2)} QORT
             </TextP>
            )}
           
            {/* <p>balance: {balance}</p> */}
            <Spacer height="55px" />

            {/* <CustomButton
            onClick={() => {
              setExtstate("download-wallet");
            }}
          >
            Download Wallet
          </CustomButton> */}
            <CustomButton
              onClick={() => {
                setExtstate("send-qort");
              }}
            >
              Transfer QORT
            </CustomButton>
          </AuthenticatedContainerInnerLeft>
          <AuthenticatedContainerInnerRight>
            <Spacer height="20px" />
            <img
              onClick={() => {
                setExtstate("download-wallet");
              }}
              src={Download}
              style={{
                cursor: "pointer",
              }}
            />
            <Spacer height="20px" />
            <img
              src={Logout}
              onClick={logoutFunc}
              style={{
                cursor: "pointer",
              }}
            />
          </AuthenticatedContainerInnerRight>
        </AuthenticatedContainer>
      )}
      {extState === "send-qort" && (
        <>
          <Spacer height="22px" />
          <Box
            sx={{
              display: "flex",
              width: "100%",
              justifyContent: "flex-start",
              paddingLeft: "22px",
              boxSizing: "border-box",
            }}
          >
            <img
              style={{
                cursor: "pointer",
              }}
              onClick={returnToMain}
              src={Return}
            />
          </Box>
          <Spacer height="35px" />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <TextP
              sx={{
                textAlign: "start",
                lineHeight: "24px",
                fontSize: "20px",
                fontWeight: 600,
              }}
            >
              Transfer QORT
            </TextP>
            <Spacer height="35px" />
            <TextP
              sx={{
                textAlign: "start",
                lineHeight: "16px",
                fontSize: "20px",
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.5)",
              }}
            >
              Balance:
            </TextP>
            <TextP
              sx={{
                textAlign: "start",
                lineHeight: "24px",
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              {balance?.toFixed(2)} QORT
            </TextP>
          </Box>
          <Spacer height="35px" />

          <Box>
            <CustomLabel htmlFor="standard-adornment-name">To</CustomLabel>
            <Spacer height="5px" />
            <CustomInput
              id="standard-adornment-name"
              value={paymentTo}
              onChange={(e) => setPaymentTo(e.target.value)}
              autoComplete="off"
            />
            <Spacer height="6px" />
            <CustomLabel htmlFor="standard-adornment-amount">
              Amount
            </CustomLabel>
            <Spacer height="5px" />
            <CustomInput
              id="standard-adornment-amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(+e.target.value)}
              autoComplete="off"
            />
            <Spacer height="6px" />
            <CustomLabel htmlFor="standard-adornment-password">
              Confirm Wallet Password
            </CustomLabel>
            <Spacer height="5px" />
            <PasswordField
              id="standard-adornment-password"
              value={paymentPassword}
              onChange={(e) => setPaymentPassword(e.target.value)}
              autoComplete="off"
            />
          </Box>
          <Spacer height="10px" />
          <Typography sx={{
            color: "red",
            fontSize: "12px",
            fontFamily: "Inter",
            fontWeight: '600'
          }}>{sendPaymentError}</Typography>
          {/* <Typography>{sendPaymentSuccess}</Typography> */}
          <Spacer height="25px" />
          <CustomButton
            onClick={() => {
              sendCoinFunc();
            }}
          >
            Send
          </CustomButton>
        </>
      )}
      {extState === "web-app-request-payment" && (
        <>
          <Spacer height="100px" />

          <TextP
            sx={{
              textAlign: "center",
              lineHeight: "15px",
            }}
          >
            {/* Start TODO */}
            The Application <br></br>{" "}
            <TextItalic>{sendqortState?.hostname}</TextItalic> <br></br>
            <TextSpan>is requesting a payment</TextSpan>
          </TextP>
          <Spacer height="10px" />
          <TextP
            sx={{
              textAlign: "center",
              lineHeight: "15px",
              fontSize: "10px",
            }}
          >
            {sendqortState?.description}
          </TextP>
          <Spacer height="15px" />
          <TextP
            sx={{
              textAlign: "center",
              lineHeight: "24px",
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            {sendqortState?.amount} QORT
          </TextP>
          <Spacer height="29px" />

          <CustomLabel htmlFor="standard-adornment-password">
            Confirm Wallet Password
          </CustomLabel>
          <Spacer height="5px" />
          <PasswordField
            id="standard-adornment-password"
            value={paymentPassword}
            onChange={(e) => setPaymentPassword(e.target.value)}
          />
          <Spacer height="29px" />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <CustomButton
              sx={{
                minWidth: "102px",
              }}
              onClick={() => confirmPayment(false)}
            >
              accept
            </CustomButton>
            <CustomButton
              sx={{
                minWidth: "102px",
              }}
              onClick={() => confirmPayment(true)}
            >
              decline
            </CustomButton>
          </Box>
          <Typography color="errror">{sendPaymentError}</Typography>
        </>
      )}
      {extState === "web-app-request-connection" && (
        <>
          <Spacer height="48px" />
          <div className="image-container" style={{
            width: '136px',
            height: '154px'
          }}>
            <img src={Logo1} className="base-image" />
            <img src={Logo1Dark} className="hover-image" />
          </div>
          <Spacer height="38px" />
          <TextP
            sx={{
              textAlign: "center",
              lineHeight: "15px",
            }}
          >
            The Application <br></br>{" "}
            <TextItalic>{requestConnection?.hostname}</TextItalic> <br></br>
            <TextSpan>is requestion a connection</TextSpan>
          </TextP>
          <Spacer height="38px" />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <CustomButton
              sx={{
                minWidth: "102px",
              }}
              onClick={() =>
                responseToConnectionRequest(
                  true,
                  requestConnection?.hostname,
                  requestConnection.interactionId
                )
              }
            >
              accept
            </CustomButton>
            <CustomButton
              sx={{
                minWidth: "102px",
              }}
              onClick={() =>
                responseToConnectionRequest(
                  false,
                  requestConnection?.hostname,
                  requestConnection.interactionId
                )
              }
            >
              decline
            </CustomButton>
          </Box>
        </>
      )}
      {extState === "web-app-request-authentication" && (
        <>
          <Spacer height="48px" />
          <div className="image-container" style={{
            width: '136px',
            height: '154px'
          }}>
            <img src={Logo1} className="base-image" />
            <img src={Logo1Dark} className="hover-image" />
          </div>
          <Spacer height="38px" />
          <TextP
            sx={{
              textAlign: "center",
              lineHeight: "15px",
            }}
          >
            The Application <br></br>{" "}
            <TextItalic>{requestConnection?.hostname}</TextItalic> <br></br>
            <TextSpan>requests authentication</TextSpan>
          </TextP>
          <Spacer height="38px" />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          ></Box>
          <Spacer height="38px" />
          <CustomButton {...getRootProps()}>
            <input {...getInputProps()} />
            Authenticate
          </CustomButton>
          <Spacer height="6px" />
          <CustomButton
            onClick={() => {
              setExtstate("create-wallet");
            }}
          >
            Create account
          </CustomButton>
        </>
      )}
      {extState === "download-wallet" && (
        <>
          <Spacer height="22px" />
          <Box
            sx={{
              display: "flex",
              width: "100%",
              justifyContent: "flex-start",
              paddingLeft: "22px",
              boxSizing: "border-box",
            }}
          >
            <img
              style={{
                cursor: "pointer",
              }}
              onClick={returnToMain}
              src={Return}
            />
          </Box>
          <Spacer height="10px" />
          <div className="image-container" style={{
            width: '136px',
            height: '154px'
          }}>
            <img src={Logo1} className="base-image" />
            <img src={Logo1Dark} className="hover-image" />
          </div>
          <Spacer height="35px" />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <TextP
              sx={{
                textAlign: "start",
                lineHeight: "24px",
                fontSize: "20px",
                fontWeight: 600,
              }}
            >
              Download Wallet
            </TextP>
          </Box>
          <Spacer height="35px" />
          {!walletToBeDownloaded && (
            <>
              <CustomLabel htmlFor="standard-adornment-password">
                Confirm Wallet Password
              </CustomLabel>
              <Spacer height="5px" />
              <PasswordField
                id="standard-adornment-password"
                value={walletToBeDownloadedPassword}
                onChange={(e) =>
                  setWalletToBeDownloadedPassword(e.target.value)
                }
              />
              <Spacer height="20px" />
              <CustomButton onClick={confirmPasswordToDownload}>
                Confirm password
              </CustomButton>
              <Typography color="errror">
                {walletToBeDownloadedError}
              </Typography>
            </>
          )}

          {walletToBeDownloaded && (
            <>
              <CustomButton onClick={saveFileToDiskFunc}>
                Download wallet
              </CustomButton>
            </>
          )}
        </>
      )}
      {extState === "create-wallet" && (
        <>
          {!walletToBeDownloaded && (
            <>
            <Spacer height="22px" />
          <Box
            sx={{
              display: "flex",
              width: "100%",
              justifyContent: "flex-start",
              paddingLeft: "22px",
              boxSizing: "border-box",
            }}
          >
            <img
              style={{
                cursor: "pointer",
              }}
              onClick={()=> {
                setExtstate("not-authenticated")
              }}
              src={Return}
            />
          </Box>
              <Spacer height="15px" />
              <div className="image-container" style={{
            width: '136px',
            height: '154px'
          }}>
            <img src={Logo1} className="base-image" />
            <img src={Logo1Dark} className="hover-image" />
          </div>
              <Spacer height="38px" />
              <TextP
                sx={{
                  textAlign: "center",
                  lineHeight: "15px",
                }}
              >
                Set up your Qortal account
              </TextP>
              <Spacer height="14px" />
              <CustomLabel htmlFor="standard-adornment-password">
                Wallet Password
              </CustomLabel>
              <Spacer height="5px" />
              <PasswordField
                id="standard-adornment-password"
                value={walletToBeDownloadedPassword}
                onChange={(e) =>
                  setWalletToBeDownloadedPassword(e.target.value)
                }
              />
              <Spacer height="6px" />
              <CustomLabel htmlFor="standard-adornment-password">
                Confirm Wallet Password
              </CustomLabel>
              <Spacer height="5px" />
              <PasswordField
                id="standard-adornment-password"
                value={walletToBeDownloadedPasswordConfirm}
                onChange={(e) =>
                  setWalletToBeDownloadedPasswordConfirm(e.target.value)
                }
              />
              <Spacer height="17px" />

              <CustomButton onClick={createAccountFunc}>
                Create Account
              </CustomButton>
              <Typography color="errror">
                {walletToBeDownloadedError}
              </Typography>
            </>
          )}

          {walletToBeDownloaded && (
            <>
              <Spacer height="48px" />
              <img src={Success} />
              <Spacer height="45px" />
              <TextP
                sx={{
                  textAlign: "center",
                  lineHeight: "15px",
                }}
              >
                Congrats, you’re all set up!
              </TextP>
              <Spacer height="100px" />
              <CustomButton
                onClick={() => {
                  saveFileToDiskFunc();
                  returnToMain();
                }}
              >
                Backup Account
              </CustomButton>
            </>
          )}
        </>
      )}
      {extState === "transfer-success-regular" && (
        <>
          <Spacer height="48px" />
          <img src={Success} />
          <Spacer height="45px" />
          <TextP
            sx={{
              textAlign: "center",
              lineHeight: "15px",
            }}
          >
            The transfer was succesful!
          </TextP>
          <Spacer height="100px" />
          <CustomButton
            onClick={() => {
              returnToMain();
            }}
          >
            Continue
          </CustomButton>
        </>
      )}
      {extState === "transfer-success-request" && (
        <>
          <Spacer height="48px" />
          <img src={Success} />
          <Spacer height="45px" />
          <TextP
            sx={{
              textAlign: "center",
              lineHeight: "15px",
            }}
          >
            The transfer was succesful!
          </TextP>
          <Spacer height="100px" />
          <CustomButton
            onClick={() => {
              window.close();
            }}
          >
            Continue
          </CustomButton>
        </>
      )}
      {countdown && (
        <Box
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
          }}
        >
          {/* <Spacer  height="25px"/> */}
          <CountdownCircleTimer
            isPlaying
            duration={countdown}
            colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
            colorsTime={[7, 5, 2, 0]}
            onComplete={() => {
              window.close();
            }}
            size={75}
            strokeWidth={8}
          >
            {({ remainingTime }) => <TextP>{remainingTime}</TextP>}
          </CountdownCircleTimer>
        </Box>
      )}
      {isLoading && <Loader />}
    </AppContainer>
  );
}

export default App;
