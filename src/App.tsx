import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useDropzone } from "react-dropzone";
import {
  Box,
  Button,
  ButtonBase,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Input,
  InputLabel,
  Popover,
  Tooltip,
  Typography,
} from "@mui/material";
import { decryptStoredWallet } from "./utils/decryptWallet";
import PersonSearchIcon from '@mui/icons-material/PersonSearch';

import { CountdownCircleTimer } from "react-countdown-circle-timer";
import Logo1 from "./assets/svgs/Logo1.svg";
import Logo1Dark from "./assets/svgs/Logo1Dark.svg";
import RefreshIcon from "@mui/icons-material/Refresh";
import Logo2 from "./assets/svgs/Logo2.svg";
import Copy from "./assets/svgs/Copy.svg";
import ltcLogo from "./assets/ltc.png";
import qortLogo from "./assets/qort.png";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Download from "./assets/svgs/Download.svg";
import Logout from "./assets/svgs/Logout.svg";
import Return from "./assets/svgs/Return.svg";
import Success from "./assets/svgs/Success.svg";
import Info from "./assets/svgs/Info.svg";
import CloseIcon from "@mui/icons-material/Close";
import { JsonView, allExpanded, darkStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import HelpIcon from '@mui/icons-material/Help';
import EngineeringIcon from '@mui/icons-material/Engineering';
import WarningIcon from '@mui/icons-material/Warning';
import { DrawerUserLookup } from "./components/Drawer/DrawerUserLookup";
import { UserLookup } from "./components/UserLookup.tsx/UserLookup";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import {
  createAccount,
  generateRandomSentence,
  saveFileToDisk,
  saveSeedPhraseToDisk
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
  CustomButtonAccept,
  CustomInput,
  CustomLabel,
  TextItalic,
  TextP,
  TextSpan,
} from "./App-styles";
import { Spacer } from "./common/Spacer";
import { Loader } from "./components/Loader";
import { PasswordField, ErrorText } from "./components";
import { ChatGroup } from "./components/Chat/ChatGroup";
import { Group, requestQueueMemberNames } from "./components/Group/Group";
import { TaskManger } from "./components/TaskManager/TaskManger";
import { useModal } from "./common/useModal";
import { LoadingButton } from "@mui/lab";
import { Label } from "./components/Group/AddGroup";
import { CustomizedSnackbars } from "./components/Snackbar/Snackbar";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  cleanUrl,
  getFee,
  getProtocol,
  getWallets,
  groupApi,
  groupApiLocal,
  groupApiSocket,
  groupApiSocketLocal,
  storeWallets,
} from "./background";
import {
  executeEvent,
  subscribeToEvent,
  unsubscribeFromEvent,
} from "./utils/events";
import {
  requestQueueCommentCount,
  requestQueuePublishedAccouncements,
} from "./components/Chat/GroupAnnouncements";
import { requestQueueGroupJoinRequests } from "./components/Group/GroupJoinRequests";
import { DrawerComponent } from "./components/Drawer/Drawer";
import { AddressQRCode } from "./components/AddressQRCode";
import { Settings } from "./components/Group/Settings";
import { MainAvatar } from "./components/MainAvatar";
import { useRetrieveDataLocalStorage } from "./useRetrieveDataLocalStorage";
import { useQortalGetSaveSettings } from "./useQortalGetSaveSettings";
import { useRecoilState, useResetRecoilState, useSetRecoilState } from "recoil";
import { canSaveSettingToQdnAtom, fullScreenAtom, groupsPropertiesAtom, hasSettingsChangedAtom, isDisabledEditorEnterAtom, isUsingImportExportSettingsAtom, lastPaymentSeenTimestampAtom, mailsAtom, myGroupsWhereIAmAdminAtom, oldPinnedAppsAtom, qMailLastEnteredTimestampAtom, settingsLocalLastUpdatedAtom, settingsQDNLastUpdatedAtom, sortablePinnedAppsAtom } from "./atoms/global";
import { useAppFullScreen } from "./useAppFullscreen";
import { NotAuthenticated } from "./ExtStates/NotAuthenticated";
import { useFetchResources } from "./common/useFetchResources";
import { Tutorials } from "./components/Tutorials/Tutorials";
import { useHandleTutorials } from "./components/Tutorials/useHandleTutorials";
import { CoreSyncStatus } from "./components/CoreSyncStatus";
import BoundedNumericTextField from "./common/BoundedNumericTextField";
import { Wallets } from "./Wallets";
import './utils/seedPhrase/RandomSentenceGenerator';
import { test } from "vitest";
import { useHandleUserInfo } from "./components/Group/useHandleUserInfo";
import { Minting } from "./components/Minting/Minting";
import { isRunningGateway } from "./qortalRequests";
import { QMailStatus } from "./components/QMailStatus";
import { GlobalActions } from "./components/GlobalActions/GlobalActions";
import { RegisterName } from "./components/RegisterName";
import { BuyQortInformation } from "./components/BuyQortInformation";
import { WalletIcon } from "./assets/Icons/WalletIcon";
import { useBlockedAddresses } from "./components/Chat/useBlockUsers";
import { QortPayment } from "./components/QortPayment";
import { GeneralNotifications } from "./components/GeneralNotifications";
import { PdfViewer } from "./common/PdfViewer";
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { DownloadWallet } from "./components/Auth/DownloadWallet";


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
  | "transfer-success-request"
  | "wallet-dropped"
  | "web-app-request-buy-order"
  | "buy-order-submitted"
  | "group";

interface MyContextInterface {
  txList: any[];
  memberGroups: any[];
  setTxList: (val) => void;
  setMemberGroups: (val) => void;
  isShow: boolean;
  onCancel: () => void;
  onOk: () => void;
  show: () => void;
  message: any;
}

const defaultValues: MyContextInterface = {
  txList: [],
  memberGroups: [],
  setTxList: () => {},
  setMemberGroups: () => {},
  isShow: false,
  onCancel: () => {},
  onOk: () => {},
  show: () => {},
  message: {
    publishFee: "",
    message: "",
  },
};
export let isMobile = false;

const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  if (/android/i.test(userAgent)) {
    return true; // Android device
  }

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return true; // iOS device
  }

  return false;
};

if (isMobileDevice()) {
  isMobile = true;
  console.log("Running on a mobile device");
} else {
  console.log("Running on a desktop");
}

export const allQueues = {
  requestQueueCommentCount: requestQueueCommentCount,
  requestQueuePublishedAccouncements: requestQueuePublishedAccouncements,
  requestQueueMemberNames: requestQueueMemberNames,
  requestQueueGroupJoinRequests: requestQueueGroupJoinRequests,
};

const controlAllQueues = (action) => {
  Object.keys(allQueues).forEach((key) => {
    const val = allQueues[key];
    try {
      if (typeof val[action] === "function") {
        val[action]();
      }
    } catch (error) {
      console.error(error);
    }
  });
};

export const clearAllQueues = () => {
  Object.keys(allQueues).forEach((key) => {
    const val = allQueues[key];
    try {
      val.clear();
    } catch (error) {
      console.error(error);
    }
  });
};

export const pauseAllQueues = () => {
  controlAllQueues("pause");
  chrome?.runtime?.sendMessage({
    action: "pauseAllQueues",
    payload: {},
  });
};
export const resumeAllQueues = () => {
  controlAllQueues("resume");
  chrome?.runtime?.sendMessage({
    action: "resumeAllQueues",
    payload: {},
  });
};
const defaultValuesGlobal = {
  openTutorialModal: null,
  setOpenTutorialModal: ()=> {}
}
export const MyContext = createContext<MyContextInterface>(defaultValues);
export const GlobalContext = createContext<MyContextInterface>(defaultValuesGlobal);

export let globalApiKey: string | null = null;

export const getBaseApiReact = (customApi?: string) => {
  if (customApi) {
    return customApi;
  }

  if (globalApiKey?.url) {
    return globalApiKey?.url;
  } else {
    return groupApi;
  }
};
// export const getArbitraryEndpointReact = () => {

//   if (globalApiKey) {
//     return `/arbitrary/resources/search`;
//   } else {
//     return `/arbitrary/resources/searchsimple`;
//   }
// };
export const getArbitraryEndpointReact = () => {
  if (globalApiKey) {
    return `/arbitrary/resources/searchsimple`;
  } else {
    return `/arbitrary/resources/searchsimple`;
  }
};
export const getBaseApiReactSocket = (customApi?: string) => {
  if (customApi) {
    return customApi;
  }

  if (globalApiKey?.url) {
    return `${getProtocol(globalApiKey?.url) === 'http' ? 'ws://': 'wss://'}${cleanUrl(globalApiKey?.url)}`
  } else {
    return groupApiSocket;
  }
};
export const isMainWindow = window?.location?.href?.includes("?main=true");
function App() {
  const [extState, setExtstate] = useState<extStates>("not-authenticated");
  const [desktopViewMode, setDesktopViewMode] = useState('home')

  const [backupjson, setBackupjson] = useState<any>(null);
  const [rawWallet, setRawWallet] = useState<any>(null);
  const [ltcBalanceLoading, setLtcBalanceLoading] = useState<boolean>(false);
  const [qortBalanceLoading, setQortBalanceLoading] = useState<boolean>(false);
  const [decryptedWallet, setdecryptedWallet] = useState<any>(null);
  const [requestConnection, setRequestConnection] = useState<any>(null);
  const [requestBuyOrder, setRequestBuyOrder] = useState<any>(null);
  const [authenticatedMode, setAuthenticatedMode] = useState("qort");
  const [requestAuthentication, setRequestAuthentication] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [ltcBalance, setLtcBalance] = useState<any>(null);
  const [paymentTo, setPaymentTo] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentPassword, setPaymentPassword] = useState<string>("");
  const [sendPaymentError, setSendPaymentError] = useState<string>("");
  const [sendPaymentSuccess, setSendPaymentSuccess] = useState<string>("");
  const [countdown, setCountdown] = useState<null | number>(null);
  const [walletToBeDownloaded, setWalletToBeDownloaded] = useState<any>(null);
  const [walletToBeDownloadedPassword, setWalletToBeDownloadedPassword] =
    useState<string>("");
    const {isUserBlocked,
      addToBlockList,
      removeBlockFromList, getAllBlockedUsers} = useBlockedAddresses(extState === 'authenticated')
    const [isOpenDrawerLookup, setIsOpenDrawerLookup] = useState(false)
  const [isMain, setIsMain] = useState<boolean>(
    window?.location?.href?.includes("?main=true")
  );
  const isMainRef = useRef(false);
  const [authenticatePassword, setAuthenticatePassword] = useState<string>("");
  const [sendqortState, setSendqortState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [
    walletToBeDownloadedPasswordConfirm,
    setWalletToBeDownloadedPasswordConfirm,
  ] = useState<string>("");
  const [walletToBeDownloadedError, setWalletToBeDownloadedError] =
    useState<string>("");
  const [walletToBeDecryptedError, setWalletToBeDecryptedError] =
    useState<string>("");
  const [txList, setTxList] = useState([]);
  const [memberGroups, setMemberGroups] = useState([]);
  const [isFocused, setIsFocused] = useState(true);
  const [hasSettingsChanged, setHasSettingsChanged] =  useRecoilState(hasSettingsChangedAtom)
  const holdRefExtState = useRef<extStates>("not-authenticated");
  const isFocusedRef = useRef<boolean>(true);
  const { isShow, onCancel, onOk, show, message } = useModal();
  const { isShow: isShowUnsavedChanges, onCancel:  onCancelUnsavedChanges, onOk: onOkUnsavedChanges, show:  showUnsavedChanges, message: messageUnsavedChanges } = useModal();
  const balanceSetIntervalRef = useRef(null)
  const [currentNode, setCurrentNode] = useState({
    url: "http://127.0.0.1:12391",
  });
    const [useLocalNode, setUseLocalNode] = useState(false);
    const [confirmRequestRead, setConfirmRequestRead] = useState(false);

  const {downloadResource} = useFetchResources()
  const [showSeed, setShowSeed] = useState(false)
  const [creationStep, setCreationStep] = useState(1)
  const [isOpenMinting, setIsOpenMinting] = useState(false)

  const setIsDisabledEditorEnter = useSetRecoilState(isDisabledEditorEnterAtom)
  const {
    isShow: isShowInfo,
    onCancel: onCancelInfo,
    onOk: onOkInfo,
    show: showInfo,
    message: messageInfo,
  } = useModal();
  
  const {
    onCancel: onCancelQortalRequest,
    onOk: onOkQortalRequest,
    show: showQortalRequest,
    isShow: isShowQortalRequest,
    message: messageQortalRequest,
  } = useModal();
  const {
    onCancel: onCancelQortalRequestExtension,
    onOk: onOkQortalRequestExtension,
    show: showQortalRequestExtension,
    isShow: isShowQortalRequestExtension,
    message: messageQortalRequestExtension,
  } = useModal();
  
  const [infoSnack, setInfoSnack] = useState(null);
  const [openSnack, setOpenSnack] = useState(false);
  const [hasLocalNode, setHasLocalNode] = useState(false);
  const [isOpenDrawerProfile, setIsOpenDrawerProfile] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isOpenSendQort, setIsOpenSendQort] = useState(false);
  const [isOpenSendQortSuccess, setIsOpenSendQortSuccess] = useState(false);
  const [rootHeight, setRootHeight] = useState("100%");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const qortalRequestCheckbox1Ref = useRef(null);
  useRetrieveDataLocalStorage(userInfo?.address)
  useQortalGetSaveSettings(userInfo?.name, extState === "authenticated")
  const [fullScreen, setFullScreen] = useRecoilState(fullScreenAtom);
  const resetAtomIsUsingImportExportSettingsAtom = useResetRecoilState(isUsingImportExportSettingsAtom)
  const { toggleFullScreen } = useAppFullScreen(setFullScreen);
  const generatorRef = useRef(null)
  const [isRunningPublicNode, setIsRunningPublicNode] = useState(false)

  const exportSeedphrase = ()=> {
    const seedPhrase = generatorRef.current.parsedString
    saveSeedPhraseToDisk(seedPhrase)
  }
  const {showTutorial, openTutorialModal, shownTutorialsInitiated, setOpenTutorialModal, hasSeenGettingStarted} = useHandleTutorials()
  const {getIndividualUserInfo} = useHandleUserInfo()

  const passwordRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (extState === "wallet-dropped" && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [extState]);

  useEffect(() => {
      // Attach a global event listener for double-click
      const handleDoubleClick = () => {
          toggleFullScreen();
      };

      // Add the event listener to the root HTML document
      document.documentElement.addEventListener('dblclick', handleDoubleClick);

      // Clean up the event listener on unmount
      return () => {
          document.documentElement.removeEventListener('dblclick', handleDoubleClick);
      };
  }, [toggleFullScreen]);
  //resets for recoil
  const resetAtomSortablePinnedAppsAtom = useResetRecoilState(sortablePinnedAppsAtom);
  const resetAtomCanSaveSettingToQdnAtom = useResetRecoilState(canSaveSettingToQdnAtom);
  const resetAtomSettingsQDNLastUpdatedAtom = useResetRecoilState(settingsQDNLastUpdatedAtom);
  const resetAtomSettingsLocalLastUpdatedAtom = useResetRecoilState(settingsLocalLastUpdatedAtom);
  const resetAtomOldPinnedAppsAtom = useResetRecoilState(oldPinnedAppsAtom);
  const resetAtomQMailLastEnteredTimestampAtom = useResetRecoilState(qMailLastEnteredTimestampAtom)
  const resetAtomMailsAtom = useResetRecoilState(mailsAtom)
  const resetGroupPropertiesAtom = useResetRecoilState(groupsPropertiesAtom)
  const resetLastPaymentSeenTimestampAtom = useResetRecoilState(lastPaymentSeenTimestampAtom)
    const resetMyGroupsWhereIAmAdminAtom = useResetRecoilState(
    myGroupsWhereIAmAdminAtom
  );
  const resetAllRecoil = () => {
    resetAtomSortablePinnedAppsAtom();
    resetAtomCanSaveSettingToQdnAtom();
    resetAtomSettingsQDNLastUpdatedAtom();
    resetAtomSettingsLocalLastUpdatedAtom();
    resetAtomOldPinnedAppsAtom();
    resetAtomIsUsingImportExportSettingsAtom()
    resetAtomQMailLastEnteredTimestampAtom()
    resetAtomMailsAtom()
    resetGroupPropertiesAtom()
    resetLastPaymentSeenTimestampAtom()
    resetMyGroupsWhereIAmAdminAtom()
  };
  useEffect(() => {
    if (!isMobile) return;
    // Function to set the height of the app to the viewport height
    const resetHeight = () => {
      const height = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      // Set the height to the root element (usually #root)
      document.getElementById("root").style.height = height + "px";
      setRootHeight(height + "px");
    };

    // Set the initial height
    resetHeight();

    // Add event listeners for resize and visualViewport changes
    window.addEventListener("resize", resetHeight);
    window.visualViewport?.addEventListener("resize", resetHeight);

    // Clean up the event listeners when the component unmounts
    return () => {
      window.removeEventListener("resize", resetHeight);
      window.visualViewport?.removeEventListener("resize", resetHeight);
    };
  }, []);
  const handleSetGlobalApikey = (key)=> {
    globalApiKey = key;
  }
  useEffect(() => {
    chrome?.runtime?.sendMessage({ action: "getApiKey" }, (response) => {
      if (response) {
        handleSetGlobalApikey(response)
        setApiKey(response);

      }
    });
  }, []);
  useEffect(() => {
    if (extState) {
      holdRefExtState.current = extState;
    }
  }, [extState]);

  useEffect(()=> {
    isRunningGateway().then((res)=> {
      setIsRunningPublicNode(res)
    }).catch((error)=> {
      console.error(error)
    })
  }, [extState])

  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  useEffect(()=> {
    if(!shownTutorialsInitiated) return
    if(extState === 'not-authenticated'){
      showTutorial('create-account')
    } else if(extState === "create-wallet" && walletToBeDownloaded){
      showTutorial('important-information')
    } else if(extState === "authenticated"){
      showTutorial('getting-started')
    }
  }, [extState, walletToBeDownloaded, shownTutorialsInitiated])

  // const checkIfUserHasLocalNode = useCallback(async () => {
  //   try {
  //     const url = `http://127.0.0.1:12391/admin/status`;
  //     const response = await fetch(url, {
  //       method: "GET",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     });
  //     const data = await response.json();
  //     if (data?.isSynchronizing === false && data?.syncPercent === 100) {
  //       setHasLocalNode(true);
  //     }
  //   } catch (error) {}
  // }, []);

  // useEffect(() => {
  //   checkIfUserHasLocalNode();
  // }, [extState]);

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
        // storeWalletInfo(pf);
        setRawWallet(pf);
        // setExtstate("authenticated");
        setExtstate("wallet-dropped");
        setdecryptedWallet(null);
      } catch (e) {
        console.log(e);

        
      }
    },
  });

  const saveWalletFunc = async (password: string) => {
    let wallet = structuredClone(rawWallet);

    const res = await decryptStoredWallet(password, wallet);
    const wallet2 = new PhraseWallet(res, wallet?.version || walletVersion);
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
    chrome?.runtime?.sendMessage(
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
          function (response) {}
        );
      }
    );
  };

  const balanceSetInterval = ()=> {
    try {
      if(balanceSetIntervalRef?.current){
        clearInterval(balanceSetIntervalRef?.current);
      }

      let isCalling = false;
      balanceSetIntervalRef.current =  setInterval(async () => {
        if (isCalling) return;
        isCalling = true;
        chrome?.runtime?.sendMessage({ action: "balance" }, (response) => {
          if (!response?.error && !isNaN(+response)) {
            setBalance(response);
          }
     
          isCalling = false
        });
     
      }, 40000);
    } catch (error) {
      console.error(error)
    }
  }

  const getBalanceFunc = () => {
    setQortBalanceLoading(true);
    chrome?.runtime?.sendMessage({ action: "balance" }, (response) => {
      if (!response?.error && !isNaN(+response)) {
        setBalance(response);
      }
      setQortBalanceLoading(false);
      balanceSetInterval()

    });
  };

  const refetchUserInfo = () => {
    window
      .sendMessage('userInfo')
      .then((response) => {
        if (response && !response.error) {
          setUserInfo(response);
        }
      })
      .catch((error) => {
        console.error('Failed to get user info:', error);
      });
  };

  const getBalanceAndUserInfoFunc = () => {
    getBalanceFunc();
    refetchUserInfo();
  };
  const getLtcBalanceFunc = () => {
    setLtcBalanceLoading(true);
    chrome?.runtime?.sendMessage({ action: "ltcBalance" }, (response) => {
      if (!response?.error && !isNaN(+response)) {
        setLtcBalance(response);
      }
      setLtcBalanceLoading(false);
    });
  };


  const clearAllStates = () => {
    setRequestConnection(null);
    setRequestAuthentication(null);
  };

  const qortalRequestPermisson = async (message, sender, sendResponse) => {
    if (message.action === "QORTAL_REQUEST_PERMISSION" && !isMainWindow) {
      try {

        await showQortalRequest(message?.payload);
        if (qortalRequestCheckbox1Ref.current) {
         
          sendResponse({
            accepted: true,
            checkbox1: qortalRequestCheckbox1Ref.current,
          });
          return;
        }
        sendResponse({ accepted: true });
      } catch (error) {
        sendResponse({ accepted: false });
      } finally {
        window.close();
      }
    }
  };
  const qortalRequestPermissonFromExtension = async (message, sender, sendResponse) => {
    if (message.action === "QORTAL_REQUEST_PERMISSION" && isMainWindow) {
      try {
        if(message?.payload?.checkbox1){
          qortalRequestCheckbox1Ref.current = message?.payload?.checkbox1?.value || false
        }
        setConfirmRequestRead(false)

        await showQortalRequestExtension(message?.payload);
       
        if (qortalRequestCheckbox1Ref.current) {
         
          sendResponse({
            accepted: true,
            checkbox1: qortalRequestCheckbox1Ref.current,
          });
          return;
        }
        sendResponse({ accepted: true });
      } catch (error) {
        sendResponse({ accepted: false });
      } 
    }
  };

  useEffect(() => {
    // Listen for messages from the background script
    const messageListener = (message, sender, sendResponse) => {
      // Handle various actions
      if (
        message.action === "UPDATE_STATE_CONFIRM_SEND_QORT" &&
        !isMainWindow
      ) {
        setSendqortState(message.payload);
        setExtstate("web-app-request-payment");
      } else if (message.action === "closePopup" && !isMainWindow) {
        window.close();
      } else if (
        message.action === "UPDATE_STATE_REQUEST_CONNECTION" &&
        !isMainWindow
      ) {
        setRequestConnection(message.payload);
        setExtstate("web-app-request-connection");
      } else if (
        message.action === "UPDATE_STATE_REQUEST_BUY_ORDER" &&
        !isMainWindow
      ) {
        setRequestBuyOrder(message.payload);
        setExtstate("web-app-request-buy-order");
      } else if (
        message.action === "UPDATE_STATE_REQUEST_AUTHENTICATION" &&
        !isMainWindow
      ) {
        setRequestAuthentication(message.payload);
        setExtstate("web-app-request-authentication");
      } else if (message.action === "SET_COUNTDOWN" && !isMainWindow) {
        setCountdown(message.payload);
      } else if (message.action === "INITIATE_MAIN") {
        setIsMain(true);
        isMainRef.current = true;
      } else if (message.action === "CHECK_FOCUS" && isMainWindow) {
        sendResponse(isFocusedRef.current); // Synchronous response
        return true; // Return true if you plan to send a response asynchronously
      } else if (
        message.action === "NOTIFICATION_OPEN_DIRECT" &&
        isMainWindow
      ) {
        executeEvent("openDirectMessage", {
          from: message.payload.from,
        });
      } else if (message.action === "NOTIFICATION_OPEN_GROUP" && isMainWindow) {
        executeEvent("openGroupMessage", {
          from: message.payload.from,
        });
      } else if (
        message.action === "NOTIFICATION_OPEN_ANNOUNCEMENT_GROUP" &&
        isMainWindow
      ) {
        executeEvent("openGroupAnnouncement", {
          from: message.payload.from,
        });
      } else if (
        message.action === "NOTIFICATION_OPEN_THREAD_NEW_POST" &&
        isMainWindow
      ) {
        executeEvent("openThreadNewPost", {
          data: message.payload.data,
        });
      } else if (
        message.action === "receiveChunks" &&
        isMainWindow
      ) {
       executeEvent('receiveChunks', message.payload?.data);
      }

      // Call the permission request handler for "QORTAL_REQUEST_PERMISSION"
      qortalRequestPermisson(message, sender, sendResponse);
      if (message.action === "QORTAL_REQUEST_PERMISSION" && !isMainWindow) {
        return true; // Return true to indicate an async response is coming
      }
      if (message.action === "QORTAL_REQUEST_PERMISSION" && isMainWindow && message?.isFromExtension) {
        qortalRequestPermissonFromExtension(message, sender, sendResponse);
        return true;
      }
      if (message.action === "QORTAL_REQUEST_PERMISSION" && isMainWindow) {
      
        return;
      }
    };

    // Add message listener
    chrome.runtime?.onMessage.addListener(messageListener);

    // Clean up the listener on component unmount
    return () => {
      chrome.runtime?.onMessage.removeListener(messageListener);
    };
  }, []);

  //param = isDecline
  const confirmPayment = (isDecline: boolean) => {
    if (isDecline) {
      chrome?.runtime?.sendMessage(
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

    setIsLoading(true);
    chrome?.runtime?.sendMessage(
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
        } else {
          setSendPaymentError(
            response?.error || "Unable to perform payment. Please try again."
          );
        }
        setIsLoading(false);
      }
    );
  };

  const confirmBuyOrder = (isDecline: boolean) => {
    if (isDecline) {
      chrome?.runtime?.sendMessage(
        {
          action: "buyOrderConfirmation",
          payload: {
            crosschainAtInfo: requestBuyOrder?.crosschainAtInfo,
            interactionId: requestBuyOrder?.interactionId,
            isDecline: true,
            useLocal: requestBuyOrder?.useLocal,
          },
        },
        (response) => {
          window.close();
        }
      );
      return;
    }

    setIsLoading(true);
    chrome?.runtime?.sendMessage(
      {
        action: "buyOrderConfirmation",
        payload: {
          crosschainAtInfo: requestBuyOrder?.crosschainAtInfo,
          interactionId: requestBuyOrder?.interactionId,
          isDecline: false,
          useLocal: requestBuyOrder?.useLocal,
        },
      },
      (response) => {
        if (response === true) {
          setExtstate("buy-order-submitted");
          setCountdown(null);
        } else {
          setSendPaymentError(
            response?.error || "Unable to perform payment. Please try again."
          );
        }
        setIsLoading(false);
      }
    );
  };
  const responseToConnectionRequest = (
    isOkay: boolean,
    hostname: string,
    interactionId: string
  ) => {
    chrome?.runtime?.sendMessage(
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
      setIsLoading(true);
      chrome?.runtime?.sendMessage({ action: "getWalletInfo" }, (response) => {
        if (response && response?.walletInfo) {
          setRawWallet(response?.walletInfo);
          if (
            holdRefExtState.current === "web-app-request-payment" ||
            holdRefExtState.current === "web-app-request-connection" ||
            holdRefExtState.current === "web-app-request-buy-order"
          )
            return;

            if(response?.hasKeyPair){
              setExtstate("authenticated");

            } else {
              setExtstate("wallet-dropped");
            }
        }
      });
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserInfo = useCallback(async (useTimer?: boolean) => {
    try {
      if (useTimer) {
        await new Promise((res) => {
          setTimeout(() => {
            res(null);
          }, 10000);
        });
      }
      chrome?.runtime?.sendMessage({ action: "userInfo" }, (response) => {
        if (response && !response.error) {
          setUserInfo(response);
        }
      });
      getBalanceFunc();
    } catch (error) {}
  }, []);

  useEffect(() => {
    if (!address) return;
    getUserInfo();
  }, [address]);

  useEffect(()=> {
    try {
     const val = localStorage.getItem('settings-disable-editor-enter');
      if(val){
        const parsedVal = JSON.parse(val)
        if(parsedVal === false || parsedVal === true){
          setIsDisabledEditorEnter(parsedVal)
        }
      }
    } catch (error) {
      
    }
  }, [])

  useEffect(() => {
    return () => {
      console.log("exit");
    };
  }, []);

  useEffect(() => {
    if (
      authenticatedMode === "ltc" &&
      !ltcBalanceLoading &&
      ltcBalance === null
    ) {
      getLtcBalanceFunc();
    }
  }, [authenticatedMode]);



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

  const saveWalletToLocalStorage = async (newWallet)=> {
    try {
       getWallets().then((res)=> {
            
              if(res && Array.isArray(res)){
                 const wallets = [...res, newWallet]
                 storeWallets(wallets)
              } else {
                storeWallets([newWallet])
              }
              setIsLoading(false)
          }).catch((error)=> {
              console.error(error)
              setIsLoading(false)
          })
    } catch (error) {
      console.error(error)
    }
  }

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
      setIsLoading(true);
      await new Promise<void>((res) => {
        setTimeout(() => {
          res();
        }, 250);
      });
      const res = await createAccount(generatorRef.current.parsedString);

      const wallet = await res.generateSaveWalletData(
        walletToBeDownloadedPassword,
        crypto.kdfThreads,
        () => {}
      );
      chrome?.runtime?.sendMessage(
        {
          action: "decryptWallet",
          payload: {
            password: walletToBeDownloadedPassword,
            wallet,
          },
        },
        (response) => {
          if (response && !response?.error) {
            saveWalletToLocalStorage(wallet)
            setRawWallet(wallet);
            setWalletToBeDownloaded({
              wallet,
              qortAddress: wallet.address0,
            });
            chrome?.runtime?.sendMessage(
              { action: "userInfo" },
              (response2) => {
                setIsLoading(false);
                if (response2 && !response2.error) {
                  setUserInfo(response);
                }
              }
            );
            getBalanceFunc();
          } else if (response?.error) {
            setIsLoading(false);
            setWalletToBeDecryptedError(response.error);
          }
        }
      );
    } catch (error: any) {
      setWalletToBeDownloadedError(error?.message);
      setIsLoading(false);
    }
  };

  const logoutFunc = async () => {
    try {
      if(hasSettingsChanged){
        await showUnsavedChanges({message: 'Your settings have changed. If you logout you will lose your changes. Click on the save button in the header to keep your changed settings.'})
      } else if(extState === 'authenticated') {
        await showUnsavedChanges({
          message:
            "Are you sure you would like to logout?",
        });
      }
      chrome?.runtime?.sendMessage({ action: "logout" }, (response) => {
        if (response) {
          executeEvent("logout-event", {});
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
    setIsOpenSendQort(false);
    setIsOpenSendQortSuccess(false);
    setShowSeed(false)
    setCreationStep(1)
  };

  const resetAllStates = () => {
    setExtstate("not-authenticated");
    setAuthenticatedMode("qort");
    setBackupjson(null);
    setRawWallet(null);
    setdecryptedWallet(null);
    setRequestConnection(null);
    setRequestBuyOrder(null);
    setRequestAuthentication(null);
    setUserInfo(null);
    setBalance(null);
    setLtcBalance(null);
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
    setHasLocalNode(false);
    setTxList([]);
    setMemberGroups([]);
    resetAllRecoil()
    setShowSeed(false)
    setCreationStep(1)
    if(balanceSetIntervalRef?.current){
      clearInterval(balanceSetIntervalRef?.current);
    }
  };

   function roundUpToDecimals(number, decimals = 8) {
    const factor = Math.pow(10, decimals); // Create a factor based on the number of decimals
    return Math.ceil(+number * factor) / factor;
  }

  const authenticateWallet = async () => {
    try {
      setIsLoading(true);
      setWalletToBeDecryptedError("");
      await new Promise<void>((res) => {
        setTimeout(() => {
          res();
        }, 250);
      });
      chrome?.runtime?.sendMessage(
        {
          action: "decryptWallet",
          payload: {
            password: authenticatePassword,
            wallet: rawWallet,
          },
        },
        (response) => {
          if (response && !response?.error) {
            setAuthenticatePassword("");
            setExtstate("authenticated");
            setWalletToBeDecryptedError("");
            chrome?.runtime?.sendMessage({ action: "userInfo" }, (response) => {
              setIsLoading(false);
              if (response && !response.error) {
                setUserInfo(response);
              }
            });
            getBalanceFunc();
            chrome?.runtime?.sendMessage(
              { action: "getWalletInfo" },
              (response) => {
                if (response && response?.walletInfo) {
                  setRawWallet(response?.walletInfo);
                }
              }
            );
          } else if (response?.error) {
            setIsLoading(false);
            setWalletToBeDecryptedError(response.error);
          }
        }
      );
    } catch (error) {
      setWalletToBeDecryptedError("Unable to authenticate. Wrong password");
    }
  };

  // const handleBeforeUnload = (e)=> {
  //   const shouldClose = confirm('Are you sure you want to close this window? You may have unsaved changes.');

  //   if (!shouldClose) {
  //     // Prevent the window from closing
  //     e.preventDefault();
  //     e.returnValue = ''; // Required for Chrome
  //   } else {
  //     // Allow the window to close
  //     // No need to call preventDefault here; returnValue must be left empty
  //   }
  // }

  // useEffect(()=> {
  //   window.addEventListener('beforeunload', handleBeforeUnload);

  //   return ()=> {
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //   }
  // }, [])

  useEffect(() => {
    if (!isMainWindow || isMobile) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; // This is required for Chrome to display the confirmation dialog.
      return "";
    };

    // Add the event listener when the component mounts
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (!isMainWindow) return;
    // Handler for when the window gains focus
    const handleFocus = () => {
      setIsFocused(true);
      if (isMobile) {
        chrome?.runtime?.sendMessage({
          action: "clearAllNotifications",
          payload: {},
        });
      }

    };

    // Handler for when the window loses focus
    const handleBlur = () => {
      setIsFocused(false);
    };

    // Attach the event listeners
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // Optionally, listen for visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setIsFocused(true);
        if (isMobile) {
          chrome?.runtime?.sendMessage({
            action: "clearAllNotifications",
            payload: {},
          });
        }
      } else {
        setIsFocused(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup the event listeners on component unmount
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const openPaymentInternal = (e) => {
    const directAddress = e.detail?.address;
    const name = e.detail?.name;
    setIsOpenSendQort(true);
    setPaymentTo(name || directAddress);
  };

  useEffect(() => {
    subscribeToEvent("openPaymentInternal", openPaymentInternal);

    return () => {
      unsubscribeFromEvent("openPaymentInternal", openPaymentInternal);
    };
  }, []);

 

  const renderProfileLeft = ()=> {

    return <AuthenticatedContainerInnerLeft
    sx={{
      overflowY: isMobile && "auto",
      padding: "0px 20px",
      minWidth: "225px",
    }}
  >
    <Spacer height="20px" />
    <Box sx={{
      width: '100%',
      display: 'flex',
      justifyContent: 'flex-start'
    }}>
        {authenticatedMode === "qort" && (
              <Tooltip
                title={<span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>LITECOIN WALLET</span>} 
                placement="left"
                arrow
                sx={{ fontSize: "24" }}
                slotProps={{
                  tooltip: {
                    sx: {
                      color: "#ffffff",
                      backgroundColor: "#444444",
                    },
                  },
                  arrow: {
                    sx: {
                      color: "#444444",
                    },
                  },
                }}
              >
                <img
                  onClick={() => {
                   
                    setAuthenticatedMode("ltc");
                  }}
                  src={ltcLogo}
                  style={{
                    cursor: "pointer",
                    width: "20px",
                    height: "auto",
                  }}
                />
              </Tooltip>
            )}
            {authenticatedMode === "ltc" && (
              <Tooltip
                title={<span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>QORTAL WALLET</span>} 
                placement="left"
                arrow
                sx={{ fontSize: "24" }}
                slotProps={{
                  tooltip: {
                    sx: {
                      color: "#ffffff",
                      backgroundColor: "#444444",
                    },
                  },
                  arrow: {
                    sx: {
                      color: "#444444",
                    },
                  },
                }}
              >
                <img
                  onClick={() => {
                    setAuthenticatedMode("qort");
                  }}
                  src={qortLogo}
                  style={{
                    cursor: "pointer",
                    width: "20px",
                    height: "auto",
                  }}
                />
              </Tooltip>
            )}
            </Box>
    <Spacer height="48px" />

    {authenticatedMode === "ltc" ? (
      <>
        <img src={ltcLogo} />
        <Spacer height="32px" />
        <CopyToClipboard text={rawWallet?.ltcAddress}>
          <AddressBox>
            {rawWallet?.ltcAddress?.slice(0, 6)}...
            {rawWallet?.ltcAddress?.slice(-4)} <img src={Copy} />
          </AddressBox>
        </CopyToClipboard>
        <Spacer height="10px" />
        {ltcBalanceLoading && (
          <CircularProgress color="success" size={16} />
        )}
        {!isNaN(+ltcBalance) && !ltcBalanceLoading && (
          <Box
            sx={{
              gap: "10px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <TextP
              sx={{
                textAlign: "center",
                lineHeight: "24px",
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              {ltcBalance} LTC
            </TextP>
            <RefreshIcon
              onClick={getLtcBalanceFunc}
              sx={{
                fontSize: "16px",
                color: "white",
                cursor: "pointer",
              }}
            />
          </Box>
        )}
        <AddressQRCode targetAddress={rawWallet?.ltcAddress} />
      </>
    ) : (
      <>
       <MainAvatar setOpenSnack={setOpenSnack}  setInfoSnack={setInfoSnack} myName={userInfo?.name} balance={balance} />
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
        {qortBalanceLoading && (
          <CircularProgress color="success" size={16} />
        )}
        {!qortBalanceLoading && balance >= 0 && (
          <Box
            sx={{
              gap: "10px",
              display: "flex",
              alignItems: "center",
            }}
          >
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
            <RefreshIcon
              onClick={getBalanceAndUserInfoFunc}
              sx={{
                fontSize: "16px",
                color: "white",
                cursor: "pointer",
              }}
            />
          </Box>
        )}

        <Spacer height="35px" />
        {userInfo && !userInfo?.name && (
          <TextP
            sx={{
              textAlign: "center",
              lineHeight: 1.2,
              fontSize: "16px",
              fontWeight: 500,
              cursor: "pointer",
              marginTop: "10px",
              color: "red",
              textDecoration: "underline",
            }}
            onClick={() => {
              executeEvent('openRegisterName', {})
            }}
          >
            REGISTER NAME
          </TextP>
        )}
        <Spacer height="20px" />
        <CustomButton
          onClick={() => {
            setIsOpenSendQort(true);
            // setExtstate("send-qort");
            setIsOpenDrawerProfile(false);
          }}
        >
          Transfer QORT
        </CustomButton>
        <AddressQRCode targetAddress={rawWallet?.address0} />
      </>
    )}
    <TextP
      sx={{
        textAlign: "center",
        lineHeight: "24px",
        fontSize: "12px",
        fontWeight: 500,
        cursor: "pointer",
        marginTop: "10px",
        textDecoration: "underline",
      }}
      onClick={async () => {
        executeEvent("addTab", {
          data: { service: "APP", name: "q-trade" },
        });
        executeEvent("open-apps-mode", {});
      }}
    >
      Get QORT at Q-Trade
    </TextP>
  </AuthenticatedContainerInnerLeft>
  }

  const renderProfile = () => {
    return (
      <AuthenticatedContainer
        sx={{
          width: isMobile ? "100vw" : "auto",
          display: "flex",
          backgroundColor: "var(--bg-2)",
          justifyContent: "flex-end",
        }}
      >
        {isMobile && (
          <Box
            sx={{
              padding: "10px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <CloseIcon
              onClick={() => {
                setIsOpenDrawerProfile(false);
              }}
              sx={{
                cursor: "pointer",
                color: "white",
              }}
            />
          </Box>
        )}
        {desktopViewMode !== "apps" &&
          desktopViewMode !== "dev" &&
          desktopViewMode !== "chat" && (
            <>
            {renderProfileLeft()}
            </>
          )}

        <AuthenticatedContainerInnerRight
          sx={{
            height: "100%",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: 'center'
            }}
          >
            <Spacer height="20px" />
            
            {!isMobile && (
              <>
                <Spacer height="20px" />
                <Tooltip
                  title={<span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>LOG OUT</span>} 
                  placement="left"
                  arrow
                  sx={{ fontSize: "24" }}
                  slotProps={{
                    tooltip: {
                      sx: {
                        color: "#ffffff",
                        backgroundColor: "#444444",
                      },
                    },
                    arrow: {
                      sx: {
                        color: "#444444",
                      },
                    },
                  }}
                >
                  <img
                    src={Logout}
                    onClick={() => {
                      logoutFunc();
                      setIsOpenDrawerProfile(false);
                    }}
                    style={{
                      cursor: "pointer",
                      width: '20px',
                      height: 'auto'
                    }}
                  />
                </Tooltip>
              </>
            )}
            <Spacer height="20px" />

            <ButtonBase
              onClick={() => {
                setIsSettingsOpen(true);
              }}
            >
              <Tooltip
                title={<span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>SETTINGS</span>} 
                placement="left"
                arrow
                sx={{ fontSize: "24" }}
                slotProps={{
                  tooltip: {
                    sx: {
                      color: "#ffffff",
                      backgroundColor: "#444444",
                    },
                  },
                  arrow: {
                    sx: {
                      color: "#444444",
                    },
                  },
                }}
              >
                <SettingsIcon
                  sx={{
                    color: "rgba(255, 255, 255, 0.5)",
                  }}
                />
              </Tooltip>
            </ButtonBase>
            <Spacer height="20px" />
            <ButtonBase
              onClick={() => {
                setIsOpenDrawerLookup(true);
              }}
            >
              <Tooltip
                title={<span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>USER LOOKUP</span>} 
                placement="left"
                arrow
                sx={{ fontSize: "24" }}
                slotProps={{
                  tooltip: {
                    sx: {
                      color: "#ffffff",
                      backgroundColor: "#444444",
                    },
                  },
                  arrow: {
                    sx: {
                      color: "#444444",
                    },
                  },
                }}
              >
                <PersonSearchIcon
                  sx={{
                    color: "rgba(255, 255, 255, 0.5)",
                  }}
                />
              </Tooltip>
            </ButtonBase>
            <Spacer height="20px" />
            <ButtonBase
              onClick={() => {
                executeEvent('openWalletsApp', {})
              }}
            >
              <Tooltip
                title={<span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>WALLETS</span>} 
                placement="left"
                arrow
                sx={{ fontSize: "24" }}
                slotProps={{
                  tooltip: {
                    sx: {
                      color: "#ffffff",
                      backgroundColor: "#444444",
                    },
                  },
                  arrow: {
                    sx: {
                      color: "#444444",
                    },
                  },
                }}
              >
                <AccountBalanceWalletIcon
                  sx={{
                    color: "rgba(255, 255, 255, 0.5)",
                  }}
                />
              </Tooltip>
            </ButtonBase>
            
            {desktopViewMode !== 'home' && (
              <>
                <Spacer height="20px" />
             
               <Tooltip
               title={<span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>YOUR ACCOUNT</span>} 
               placement="left"
               arrow
               sx={{ fontSize: "24" }}
               slotProps={{
                 tooltip: {
                   sx: {
                     color: "#ffffff",
                     backgroundColor: "#444444",
                   },
                 },
                 arrow: {
                   sx: {
                     color: "#444444",
                   },
                 },
               }}
             >
                <ButtonBase onClick={() => {
                  setIsOpenDrawerProfile(true);
                }}>

              <WalletIcon width={25} color="rgba(250, 250, 250, 0.5)" />

              </ButtonBase>
              </Tooltip>
              </>
            )}
          
            {/* {authenticatedMode === "qort" && (
              <Tooltip
                title={<span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>LITECOIN WALLET</span>} 
                placement="left"
                arrow
                sx={{ fontSize: "24" }}
                slotProps={{
                  tooltip: {
                    sx: {
                      color: "#ffffff",
                      backgroundColor: "#444444",
                    },
                  },
                  arrow: {
                    sx: {
                      color: "#444444",
                    },
                  },
                }}
              >
                <img
                  onClick={() => {
                    if(desktopViewMode !== 'home'){
                      setIsOpenDrawerProfile((prev)=> !prev)
                    }
                    setAuthenticatedMode("ltc");
                  }}
                  src={ltcLogo}
                  style={{
                    cursor: "pointer",
                    width: "20px",
                    height: "auto",
                  }}
                />
              </Tooltip>
            )}
            {authenticatedMode === "ltc" && (
              <Tooltip
                title={<span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>QORTAL WALLET</span>} 
                placement="left"
                arrow
                sx={{ fontSize: "24" }}
                slotProps={{
                  tooltip: {
                    sx: {
                      color: "#ffffff",
                      backgroundColor: "#444444",
                    },
                  },
                  arrow: {
                    sx: {
                      color: "#444444",
                    },
                  },
                }}
              >
                <img
                  onClick={() => {
                    setAuthenticatedMode("qort");
                  }}
                  src={qortLogo}
                  style={{
                    cursor: "pointer",
                    width: "20px",
                    height: "auto",
                  }}
                />
              </Tooltip>
            )} */}
            <Spacer height="20px" />
            <CoreSyncStatus />
            <Spacer height="20px" />
            <QMailStatus />
            <Spacer height="20px"/>
            {extState === 'authenticated' && (
              <GeneralNotifications address={userInfo?.address} />
            )}
          </Box>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: 'center'
            }}
          >
            {extState === "authenticated" && isMainWindow && (
               <MyContext.Provider
               value={{
                 txList,
                 setTxList,
                 memberGroups,
                 setMemberGroups,
                 isShow,
                 onCancel,
                 onOk,
                 show,
                 userInfo,
                 message,
                 rootHeight,
                 showInfo,
                 openSnackGlobal: openSnack,
                 setOpenSnackGlobal: setOpenSnack,
                 infoSnackCustom: infoSnack,
                 setInfoSnackCustom: setInfoSnack,
                 downloadResource,
                 getIndividualUserInfo,
                 isUserBlocked,
                 addToBlockList,
                 removeBlockFromList,
                 getAllBlockedUsers,
                 isRunningPublicNode
               }}
             >
                 <TaskManger getUserInfo={getUserInfo} />
                 <GlobalActions memberGroups={memberGroups} />

                 </MyContext.Provider>
            )}
                          <Spacer height="20px" />
            <ButtonBase onClick={async ()=> {
              try {
                const res =  await isRunningGateway()
                if(res) throw new Error('Cannot view minting details on the gateway')
                setIsOpenMinting(true)

              } catch (error) {
                setOpenSnack(true)
                setInfoSnack({
                  type: 'error',
                  message: error?.message
                })
              }
            }}>
              <Tooltip
                title={<span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>MINTING STATUS</span>} 
                placement="left"
                arrow
                sx={{ fontSize: "24" }}
                slotProps={{
                  tooltip: {
                    sx: {
                      color: "#ffffff",
                      backgroundColor: "#444444",
                    },
                  },
                  arrow: {
                    sx: {
                      color: "#444444",
                    },
                  },
                }}
              >
                <EngineeringIcon sx={{ color: 'var(--unread)' }} />
              </Tooltip>
            </ButtonBase>
          
            <Spacer height="20px" />
            {(desktopViewMode === "apps" || desktopViewMode === "home") && (
               <ButtonBase onClick={()=> {
                if(desktopViewMode === "apps"){
                  showTutorial('qapps', true)
                } else {
                  showTutorial('getting-started', true)
                }
                }} >
                  <Tooltip
                    title={<span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>TUTORIAL</span>} 
                    placement="left"
                    arrow
                    sx={{ fontSize: "24" }}
                    slotProps={{
                      tooltip: {
                        sx: {
                          color: "#ffffff",
                          backgroundColor: "#444444",
                        },
                      },
                      arrow: {
                        sx: {
                          color: "#444444",
                        },
                      },
                    }}
                  >
                    <HelpIcon sx={{ color: 'var(--unread)' }} />
                  </Tooltip>
                </ButtonBase>
              )}
            
        <Spacer height="20px" />
        <Tooltip
          title={<span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>BACKUP WALLET</span>} 
          placement="left"
          arrow
          sx={{ fontSize: "24" }}
          slotProps={{
            tooltip: {
              sx: {
                color: "#ffffff",
                backgroundColor: "#444444",
              },
            },
            arrow: {
              sx: {
                color: "#444444",
              },
            },
          }}
        >
          <img
              onClick={() => {
                setExtstate("download-wallet");
                setIsOpenDrawerProfile(false);
              }}
              src={Download}
              style={{
                cursor: "pointer",
                width: '20px'
              }}
            />
        </Tooltip>
            <Spacer height="40px" />
            </Box>
        </AuthenticatedContainerInnerRight>
      </AuthenticatedContainer>
    );
  };

  return (
    <AppContainer
      sx={{
        height: isMobile ? "100%" : "100vh",
        // backgroundImage: desktopViewMode === 'apps' && 'url("appsBg.svg")',
        // backgroundSize: desktopViewMode === 'apps' &&  'cover',
        // backgroundPosition: desktopViewMode === 'apps' &&  'center',
        // backgroundRepeat: desktopViewMode === 'apps' &&  'no-repeat',
      }}
    >
       <PdfViewer />
    <GlobalContext.Provider value={{
            showTutorial,
            openTutorialModal,
            setOpenTutorialModal,
            downloadResource,
            hasSeenGettingStarted
      }}>
                    <Tutorials />

      {extState === "not-authenticated" && (
       <NotAuthenticated getRootProps={getRootProps} getInputProps={getInputProps} setExtstate={setExtstate}     apiKey={apiKey}  globalApiKey={globalApiKey} setApiKey={setApiKey}  handleSetGlobalApikey={handleSetGlobalApikey} currentNode={currentNode}
       setCurrentNode={setCurrentNode}
       setUseLocalNode={setUseLocalNode}
       useLocalNode={useLocalNode}/>
      )}
      {/* {extState !== "not-authenticated" && (
        <button onClick={logoutFunc}>logout</button>
      )} */}
      {extState === "authenticated" && isMainWindow && (
        <MyContext.Provider
          value={{
            txList,
            setTxList,
            memberGroups,
            setMemberGroups,
            isShow,
            onCancel,
            onOk,
            show,
            message,
            rootHeight,
            downloadResource,
            showInfo,
            openSnackGlobal: openSnack,
            setOpenSnackGlobal: setOpenSnack,
            infoSnackCustom: infoSnack,
            setInfoSnackCustom: setInfoSnack,
            getIndividualUserInfo,
            isUserBlocked,
            addToBlockList,
            removeBlockFromList,
            getAllBlockedUsers,
            isRunningPublicNode
          }}
        >
          <Box
            sx={{
              width: "100vw",
              height: isMobile ? "100%" : "100vh",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              overflow: isMobile && "hidden",
            }}
          >
            <Group
              logoutFunc={logoutFunc}
              balance={balance}
              userInfo={userInfo}
              myAddress={address}
              isFocused={isFocused}
              isMain={isMain}
              isOpenDrawerProfile={isOpenDrawerProfile}
              setIsOpenDrawerProfile={setIsOpenDrawerProfile}
              desktopViewMode={desktopViewMode}
              setDesktopViewMode={setDesktopViewMode}
            />
             {!isMobile &&  renderProfile()}
          </Box>

        
        </MyContext.Provider>
      )}
      {isOpenSendQort && isMainWindow && (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            position: "fixed",
            background: "#27282c",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 10000,
          }}
        >
          <Spacer height="22px" />
          <Box
            sx={{
              display: "flex",
              width: "100%",
              justifyContent: "flex-start",
              paddingLeft: "22px",
              boxSizing: "border-box",
              maxWidth: '700px'
            }}
          >
            <img
              style={{
                cursor: "pointer",
                height: '24px'
              }}
              onClick={returnToMain}
              src={Return}
            />
          </Box>
          <Spacer height="35px" />
         

          <QortPayment balance={balance} show={show} onSuccess={()=> {
               setIsOpenSendQort(false);
               setIsOpenSendQortSuccess(true);
            }} 
             defaultPaymentTo={paymentTo}
            />
        </Box>
      )}

      {isShowQortalRequest && !isMainWindow && (
        <>
          <Spacer height="120px" />
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <TextP
              sx={{
                lineHeight: 1.2,
                maxWidth: "90%",
                textAlign: "center",
              }}
            >
              {messageQortalRequest?.text1}
            </TextP>
          </Box>
          {messageQortalRequest?.text2 && (
            <>
              <Spacer height="10px" />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  width: "90%",
                }}
              >
                <TextP
                  sx={{
                    lineHeight: 1.2,
                    fontSize: "16px",
                    fontWeight: "normal",
                  }}
                >
                  {messageQortalRequest?.text2}
                </TextP>
              </Box>
              <Spacer height="15px" />
            </>
          )}
          {messageQortalRequest?.text3 && (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  width: "90%",
                }}
              >
                <TextP
                  sx={{
                    lineHeight: 1.2,
                    fontSize: "16px",
                    fontWeight: "normal",
                  }}
                >
                  {messageQortalRequest?.text3}
                </TextP>
                <Spacer height="15px" />
              </Box>
            </>
          )}

          {messageQortalRequest?.text4 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                width: "90%",
              }}
            >
              <TextP
                sx={{
                  lineHeight: 1.2,
                  fontSize: "16px",
                  fontWeight: "normal",
                }}
              >
                {messageQortalRequest?.text4}
              </TextP>
            </Box>
          )}

          {messageQortalRequest?.html && (
            <div
              dangerouslySetInnerHTML={{ __html: messageQortalRequest?.html }}
            />
          )}
          <Spacer height="15px" />
       
          <TextP
            sx={{
              textAlign: "center",
              lineHeight: 1.2,
              fontSize: "16px",
              fontWeight: 700,
              maxWidth: "90%",
            }}
          >
            {messageQortalRequest?.highlightedText}
          </TextP>

          {messageQortalRequest?.fee && (
            <>
                      <Spacer height="15px" />

            <TextP
    sx={{
                  textAlign: "center",
                  lineHeight: 1.2,
                  fontSize: "16px",
                  fontWeight: "normal",
                  maxWidth: "90%",
                }}
              >
                {'Fee: '}{messageQortalRequest?.fee}{' QORT'}
              </TextP>
<Spacer height="15px" />

            </>
          )}
          {messageQortalRequest?.checkbox1 && (
            <Box
              sx={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                justifyContent: "center",
                width: "90%",
                marginTop: "20px",
              }}
            >
              <Checkbox
                onChange={(e) => {
                  qortalRequestCheckbox1Ref.current = e.target.checked;
                }}
                edge="start"
                tabIndex={-1}
                disableRipple
                defaultChecked={messageQortalRequest?.checkbox1?.value}
                sx={{
                  "&.Mui-checked": {
                    color: "white", // Customize the color when checked
                  },
                  "& .MuiSvgIcon-root": {
                    color: "white",
                  },
                }}
              />

              <Typography
                sx={{
                  fontSize: "14px",
                }}
              >
                {messageQortalRequest?.checkbox1?.label}
              </Typography>
            </Box>
          )}

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
              onClick={() => onOkQortalRequest("accepted")}
            >
              accept
            </CustomButton>
            <CustomButton
              sx={{
                minWidth: "102px",
              }}
              onClick={() => onCancelQortalRequest()}
            >
              decline
            </CustomButton>
          </Box>
          <ErrorText>{sendPaymentError}</ErrorText>
        </>
      )}
      {extState === "web-app-request-buy-order" && !isMainWindow && (
        <>
          <Spacer height="100px" />

          <TextP
            sx={{
              textAlign: "center",
              lineHeight: "15px",
            }}
          >
            The Application <br></br>{" "}
            <TextItalic>{requestBuyOrder?.hostname}</TextItalic> <br></br>
            <TextSpan>
              is requesting {requestBuyOrder?.crosschainAtInfo?.length}{" "}
              {`buy order${
                requestBuyOrder?.crosschainAtInfo.length === 1 ? "" : "s"
              }`}
            </TextSpan>
          </TextP>
          <Spacer height="10px" />
          <TextP
            sx={{
              textAlign: "center",
              lineHeight: "24px",
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            {requestBuyOrder?.crosschainAtInfo?.reduce((latest, cur) => {
              return latest + +cur?.qortAmount;
            }, 0)}{" "}
            QORT
          </TextP>
          <Spacer height="15px" />
          <TextP
            sx={{
              textAlign: "center",
              lineHeight: "15px",
              fontSize: "14px",
            }}
          >
            FOR
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
            {roundUpToDecimals(
              requestBuyOrder?.crosschainAtInfo?.reduce((latest, cur) => {
                return latest + +cur?.expectedForeignAmount;
              }, 0)
            )}
            {` ${requestBuyOrder?.crosschainAtInfo?.[0]?.foreignBlockchain}`}
          </TextP>
          {/* <Spacer height="29px" />

          <CustomLabel htmlFor="standard-adornment-password">
            Confirm Wallet Password
          </CustomLabel>
          <Spacer height="5px" />
          <PasswordField
            id="standard-adornment-password"
            value={paymentPassword}
            onChange={(e) => setPaymentPassword(e.target.value)}
          /> */}
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
              onClick={() => confirmBuyOrder(false)}
            >
              accept
            </CustomButton>
            <CustomButton
              sx={{
                minWidth: "102px",
              }}
              onClick={() => confirmBuyOrder(true)}
            >
              decline
            </CustomButton>
          </Box>
          <ErrorText>{sendPaymentError}</ErrorText>
        </>
      )}

      {extState === "web-app-request-payment" && !isMainWindow && (
        <>
          <Spacer height="100px" />

          <TextP
            sx={{
              textAlign: "center",
              lineHeight: "15px",
            }}
          >
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
          {/* <Spacer height="29px" />

          <CustomLabel htmlFor="standard-adornment-password">
            Confirm Wallet Password
          </CustomLabel>
          <Spacer height="5px" />
          <PasswordField
            id="standard-adornment-password"
            value={paymentPassword}
            onChange={(e) => setPaymentPassword(e.target.value)}
          /> */}
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
          <ErrorText>{sendPaymentError}</ErrorText>
        </>
      )}
      {extState === "web-app-request-connection" && !isMainWindow && (
        <>
          <Spacer height="48px" />
          <div
            className="image-container"
            style={{
              width: "136px",
              height: "154px",
            }}
          >
          <img src={Logo1Dark} className="base-image" />
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
      {extState === "web-app-request-authentication" && !isMainWindow && (
        <>
          <Spacer height="48px" />
          <div
            className="image-container"
            style={{
              width: "136px",
              height: "154px",
            }}
          >
            <img src={Logo1Dark} className="base-image" />
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
        {extState === "wallets" && (
        <>
         <Spacer height="22px" />
          <Box
            sx={{
              display: "flex",
              width: "100%",
              justifyContent: "flex-start",
              paddingLeft: "22px",
              boxSizing: "border-box",
                maxWidth: '700px'
            }}
          >
            <img
              style={{
                cursor: "pointer",
                height: '24px'
              }}
              onClick={() => {
                setRawWallet(null);
                setExtstate("not-authenticated");
                logoutFunc();
              }}
              src={Return}
            />
          </Box>
         <Wallets setRawWallet={setRawWallet} setExtState={setExtstate} rawWallet={rawWallet} />

        </>
      )}
      {rawWallet && extState === "wallet-dropped" && (
        <>
          <Spacer height="22px" />
          <Box
            sx={{
              display: "flex",
              width: "100%",
              justifyContent: "flex-start",
              paddingLeft: "22px",
              boxSizing: "border-box",
                maxWidth: '700px'
            }}
          >
            <img
              style={{
                cursor: "pointer",
                height: '24px'
              }}
              onClick={() => {
                setRawWallet(null);
                setExtstate("wallets");
                logoutFunc();
              }}
              src={Return}
            />
          </Box>
          <Spacer height="10px" />
          <div
            className="image-container"
            style={{
              width: "136px",
              height: "154px",
            }}
          >
           <img src={Logo1Dark} className="base-image" />
          </div>
          <Spacer height="35px" />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography>{rawWallet?.name ? rawWallet?.name : rawWallet?.address0}</Typography>
            <Spacer height="10px" />
            <TextP
              sx={{
                textAlign: "start",
                lineHeight: "24px",
                fontSize: "20px",
                fontWeight: 600,
              }}
            >
              Authenticate
            </TextP>
          </Box>
          <Spacer height="35px" />

          <>
            <CustomLabel htmlFor="standard-adornment-password">
              Wallet Password
            </CustomLabel>
            <Spacer height="5px" />
            <PasswordField
              id="standard-adornment-password"
              value={authenticatePassword}
              onChange={(e) => setAuthenticatePassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  authenticateWallet();
                }
              }}
              ref={passwordRef}
            />
               {useLocalNode ? (
              <>
           <Spacer height="20px" />
             <Typography
                    sx={{
                      fontSize: "12px",
                    }}
                  >
                    {"Using node: "} {currentNode?.url}
                  </Typography>
              </>
            ) : (
              <>
              <Spacer height="20px" />
                <Typography
                       sx={{
                         fontSize: "12px",
                       }}
                     >
                       {"Using public node"} 
                     </Typography>
                 </>
            )}
            <Spacer height="20px" />
            <CustomButton onClick={authenticateWallet}>
              Authenticate
            </CustomButton>
            <ErrorText>{walletToBeDecryptedError}</ErrorText>
          </>
        </>
      )}
      {extState === "download-wallet" && (
        <>
         <DownloadWallet
            returnToMain={returnToMain}
            setIsLoading={setIsLoading}
            showInfo={showInfo}
            rawWallet={rawWallet}
            setWalletToBeDownloaded={setWalletToBeDownloaded}
            walletToBeDownloaded={walletToBeDownloaded}
          />
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
                    maxWidth: '700px'
                }}
              >
                <img
                  style={{
                    cursor: "pointer",
                    height: '24px'
                  }}
                  onClick={() => {
                    if(creationStep === 2){
                      setCreationStep(1)
                      return
                    }
                    setExtstate("not-authenticated");
                    setShowSeed(false)
                    setCreationStep(1)
                    setWalletToBeDownloadedPasswordConfirm('')
                    setWalletToBeDownloadedPassword('')
                  }}
                  src={Return}
                />
              </Box>
              <Spacer height="15px" />
              <div
                className="image-container"
                style={{
                  width: "136px",
                  height: "154px",
                }}
              >
              <img src={Logo1Dark} className="base-image" />
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
              <Box sx={{
                display: 'flex',
                maxWidth: '100%',
                justifyContent: 'center',
                padding: '10px'
              }}>
                <Box sx={{
                display: creationStep === 1 ? 'flex' :  'none',
                flexDirection: 'column',
                alignItems: 'center',
                width: '350px',
                maxWidth: '95%'
              }}>
                <Typography sx={{
                  fontSize: '14px'
                }}>
                A ‘ <span onClick={()=> {
                  setShowSeed(true)
                }} style={{
                  fontSize: '14px',
                  color: 'steelblue',
                  cursor: 'pointer'
                }}>SEEDPHRASE</span> ’ has been randomly generated in the background. 


                </Typography>
                <Typography sx={{
                  fontSize: '14px',
                  marginTop: '5px'
                }}>
                If you wish to VIEW THE SEEDPHRASE, click the word 'SEEDPHRASE' in this text. Seedphrases are used to generate the private key for your Qortal account. For security by default, seedphrases are NOT displayed unless specifically chosen.
                </Typography>
                <Typography sx={{
                  fontSize: '16px',
                  marginTop: '15px',
                 
                  textAlign: 'center'
                }}>
               Create your Qortal account by clicking <span style={{
                fontWeight: 'bold'
               }}>NEXT</span> below.

                </Typography>
                <Spacer height="17px" />
                <CustomButton onClick={()=> {
                  setCreationStep(2)
                }}>
                Next
              </CustomButton>
                </Box>
                <div style={{
                  display: 'none'
                }}>
                <random-sentence-generator
              ref={generatorRef}
											template="adverb verb noun adjective noun adverb verb noun adjective noun adjective verbed adjective noun"
									
										></random-sentence-generator>
                    </div>
                <Dialog
          open={showSeed}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogContent>
          <Box sx={{
                flexDirection: 'column',
                maxWidth: '400px',
                alignItems: 'center',
                gap: '10px',
                display: showSeed ? 'flex' : 'none'
              }}>
                <Typography sx={{
                  fontSize: '14px'
                }}>Your seedphrase</Typography>
               
                <Box sx={{
                  textAlign: 'center',
                  width: '100%',
                  backgroundColor: '#1f2023',
                  borderRadius: '5px',
                  padding: '10px',
                }}>
                  {generatorRef.current?.parsedString}
                </Box>
             
                    <CustomButton sx={{
                padding: '7px',
                fontSize: '12px'
              }} onClick={exportSeedphrase}>
                Export Seedphrase
              </CustomButton>
                </Box>
          </DialogContent>
          <DialogActions>
           
            <Button  variant="contained" onClick={()=> setShowSeed(false)}>
              close
            </Button>
            
          </DialogActions>
        </Dialog>
            
                </Box>
                <Box sx={{
                display: creationStep === 2 ? 'flex' :  'none',
                flexDirection: 'column',
                alignItems: 'center',

              }}>
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
                <Spacer height="5px" />
                <Typography variant="body2">There is no minimum length requirement</Typography>
              <Spacer height="17px" />

              <CustomButton onClick={createAccountFunc}>
                Create Account
              </CustomButton>
              </Box>
              <ErrorText>{walletToBeDownloadedError}</ErrorText>
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
              <Spacer height="50px"/>
              <Box sx={{
                display: 'flex',
                gap: '15px',
                alignItems: 'center',
                padding: '10px'
              }}>
                <WarningIcon color="warning" />
                <Typography>Save your account in a place where you will remember it!</Typography>
              </Box>
              <Spacer height="50px" />
              <CustomButton
                onClick={async () => {
                  await saveFileToDiskFunc();
                  returnToMain();
                  await showInfo({
                    message: `Keep your account file secure.`,
                  });
                }}
              >
                Backup Account
              </CustomButton>
            </>
          )}
        </>
      )}
      {isOpenSendQortSuccess && (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            position: "fixed",
            background: "#27282c",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 10000,
          }}
        >
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
        </Box>
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
      {extState === "buy-order-submitted" && (
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
            Your buy order was submitted
          </TextP>
          <Spacer height="100px" />
          <CustomButton
            onClick={() => {
              window.close();
            }}
          >
            Close
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
      {isShow && (
        <Dialog
          open={isShow}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          sx={{
            zIndex: 10001
          }}
        >
          <DialogTitle id="alert-dialog-title">{message.paymentFee ? "Payment"  : "Publish"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {message.message}
            </DialogContentText>
            {message?.paymentFee && (
               <DialogContentText id="alert-dialog-description2">
               payment fee: {message.paymentFee}
             </DialogContentText>
            )}
           {message?.publishFee && (
             <DialogContentText id="alert-dialog-description2">
             publish fee: {message.publishFee}
           </DialogContentText>
           )}
          </DialogContent>
          <DialogActions>
          <Button sx={{
                  backgroundColor: 'var(--green)',
                  color: 'black',
                  fontWeight: 'bold',
                  opacity: 0.7,
                  '&:hover': {
                    backgroundColor: 'var(--green)',
                  color: 'black',
                  opacity: 1
                  },
                }} variant="contained" onClick={onOk} autoFocus>
              accept
            </Button>
            <Button sx={{
                  backgroundColor: 'var(--danger)',
                  color: 'black',
                  fontWeight: 'bold',
                  opacity: 0.7,
                  '&:hover': {
                    backgroundColor: 'var(--danger)',
                  color: 'black',
                  opacity: 1
                  },
                }}  variant="contained" onClick={onCancel}>
              decline
            </Button>
          </DialogActions>
        </Dialog>
      )}
       {isShowInfo && (
        <Dialog
          open={isShowInfo}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Important Info"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {messageInfo.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={onOkInfo} autoFocus>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
       {isShowUnsavedChanges && (
        <Dialog
          open={isShowUnsavedChanges}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"LOGOUT"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {messageUnsavedChanges.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={onCancelUnsavedChanges}>
              Cancel
            </Button>
            <Button variant="contained" onClick={onOkUnsavedChanges} autoFocus>
              Continue to Logout
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {isShowQortalRequestExtension && isMainWindow && (
        <Dialog
          open={isShowQortalRequestExtension}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <CountdownCircleTimer
            isPlaying
            duration={30}
            colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
            colorsTime={[7, 5, 2, 0]}
            onComplete={() => {
              onCancelQortalRequestExtension()
            }}
            size={50}
            strokeWidth={5}
          >
            {({ remainingTime }) => <TextP>{remainingTime}</TextP>}
          </CountdownCircleTimer>
           <Box sx={{
            display: 'flex',
            padding: '20px',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            maxHeight: '90vh',
            overflow: 'auto'
           }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <TextP
              sx={{
                lineHeight: 1.2,
                maxWidth: "90%",
                textAlign: "center",
              }}
            >
              {messageQortalRequestExtension?.text1}
            </TextP>
          </Box>
          {messageQortalRequestExtension?.text2 && (
            <>
              <Spacer height="10px" />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  width: "90%",
                }}
              >
                <TextP
                  sx={{
                    lineHeight: 1.2,
                    fontSize: "16px",
                    fontWeight: "normal",
                  }}
                >
                  {messageQortalRequestExtension?.text2}
                </TextP>
              </Box>
              <Spacer height="15px" />
            </>
          )}
          {messageQortalRequestExtension?.text3 && (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  width: "90%",
                }}
              >
                <TextP
                  sx={{
                    lineHeight: 1.2,
                    fontSize: "16px",
                    fontWeight: "normal",
                  }}
                >
                  {messageQortalRequestExtension?.text3}
                </TextP>
               
              </Box>
              <Spacer height="15px" />
            </>
          )}

          {messageQortalRequestExtension?.text4 && (
            <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                width: "90%",
              }}
            >
              <TextP
                sx={{
                  lineHeight: 1.2,
                  fontSize: "16px",
                  fontWeight: "normal",
                }}
              >
                {messageQortalRequestExtension?.text4}
              </TextP>
            </Box>
            <Spacer height="15px" />
            </>
          )}

          {messageQortalRequestExtension?.html && (
            <div
              dangerouslySetInnerHTML={{ __html: messageQortalRequestExtension?.html }}
            />
          )}
          <Spacer height="15px" />
       
          <TextP
            sx={{
              textAlign: "center",
              lineHeight: 1.2,
              fontSize: "16px",
              fontWeight: 700,
              maxWidth: "90%",
            }}
          >
            {messageQortalRequestExtension?.highlightedText}
          </TextP>

          {messageQortalRequestExtension?.json && (
              <>
                          <Spacer height="15px" />

                          <JsonView data={messageQortalRequestExtension?.json} shouldExpandNode={allExpanded} style={darkStyles} />
                          <Spacer height="15px" />

              </>
            )}
          {messageQortalRequestExtension?.fee && (
            <>
                      <Spacer height="15px" />

            <TextP
    sx={{
                  textAlign: "center",
                  lineHeight: 1.2,
                  fontSize: "16px",
                  fontWeight: "normal",
                  maxWidth: "90%",
                }}
              >
                {'Fee: '}{messageQortalRequestExtension?.fee}{' QORT'}
              </TextP>
<Spacer height="15px" />

            </>
          )}
          {messageQortalRequestExtension?.appFee && (
              <>
                <TextP
                  sx={{
                    textAlign: "center",
                    lineHeight: 1.2,
                    fontSize: "16px",
                    fontWeight: "normal",
                    maxWidth: "90%",
                  }}
                >
                  {"App Fee: "}
                  {messageQortalRequestExtension?.appFee}
                  {" QORT"}
                </TextP>
                <Spacer height="15px" />
              </>
            )}
          {messageQortalRequestExtension?.foreignFee && (
              <>
                <Spacer height="15px" />

                <TextP
                  sx={{
                    textAlign: "center",
                    lineHeight: 1.2,
                    fontSize: "16px",
                    fontWeight: "normal",
                    maxWidth: "90%",
                  }}
                >
                  {"Foreign Fee: "}
                  {messageQortalRequestExtension?.foreignFee}
                </TextP>
                <Spacer height="15px" />
              </>
            )}
          {messageQortalRequestExtension?.checkbox1 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "90%",
                marginTop: "20px",
              }}
            >
              <Checkbox
                onChange={(e) => {
                  qortalRequestCheckbox1Ref.current = e.target.checked;
                }}
                edge="start"
                tabIndex={-1}
                disableRipple
                defaultChecked={messageQortalRequestExtension?.checkbox1?.value}
                sx={{
                  "&.Mui-checked": {
                    color: "white", // Customize the color when checked
                  },
                  "& .MuiSvgIcon-root": {
                    color: "white",
                  },
                }}
              />

              <Typography
                sx={{
                  fontSize: "14px",
                }}
              >
                {messageQortalRequestExtension?.checkbox1?.label}
              </Typography>
            </Box>
          )}
           {messageQortalRequestExtension?.confirmCheckbox && (
              <FormControlLabel
              control={
                <Checkbox
                  onChange={(e) => setConfirmRequestRead(e.target.checked)}
                  checked={confirmRequestRead}
                  edge="start"
                  tabIndex={-1}
                  disableRipple
                  sx={{
                    "&.Mui-checked": {
                      color: "white",
                    },
                    "& .MuiSvgIcon-root": {
                      color: "white",
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: "14px" }}>
                    I have read this request
                  </Typography>
                  <PriorityHighIcon color="warning" />
                </Box>
              }
            />
            )}

          <Spacer height="29px" />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
              <CustomButtonAccept
              color="black"
              bgColor="var(--green)"
                sx={{
                  minWidth: "102px",
                  opacity: messageQortalRequestExtension?.confirmCheckbox && !confirmRequestRead ? 0.1 : 0.7,
                  cursor: messageQortalRequestExtension?.confirmCheckbox && !confirmRequestRead ? 'default' : 'pointer',
                  "&:hover": {
      opacity: messageQortalRequestExtension?.confirmCheckbox && !confirmRequestRead ? 0.1 : 1,
    }
                }}
                onClick={() => {
                  if(messageQortalRequestExtension?.confirmCheckbox && !confirmRequestRead) return
                  onOkQortalRequestExtension("accepted")
                }}
              >
                accept
              </CustomButtonAccept>
              <CustomButtonAccept
               color="black"
               bgColor="var(--unread)"
                sx={{
                  minWidth: "102px",
                }}
                onClick={() => onCancelQortalRequestExtension()}
              >
                decline
              </CustomButtonAccept>
          </Box>
          <ErrorText>{sendPaymentError}</ErrorText>
        </Box>
        </Dialog>
      )}

      {isSettingsOpen && (
        <Settings open={isSettingsOpen} setOpen={setIsSettingsOpen} />
      )}
      <CustomizedSnackbars
        open={openSnack}
        setOpen={setOpenSnack}
        info={infoSnack}
        setInfo={setInfoSnack}
      />
      <DrawerComponent
        open={isOpenDrawerProfile}
        setOpen={setIsOpenDrawerProfile}
      >
        {renderProfileLeft()}
      </DrawerComponent>
      <UserLookup isOpenDrawerLookup={isOpenDrawerLookup} setIsOpenDrawerLookup={setIsOpenDrawerLookup} />
      <RegisterName balance={balance}  show={show} setTxList={setTxList} userInfo={userInfo} setOpenSnack={setOpenSnack}  setInfoSnack={setInfoSnack}/>
      <BuyQortInformation balance={balance} />
      </GlobalContext.Provider>
      {extState === "create-wallet" && walletToBeDownloaded && (
         <ButtonBase onClick={()=> {
          showTutorial('important-information', true)
       }} sx={{
         position: 'fixed',
         bottom: '25px',
         right: '25px'
       }}>
         <HelpIcon sx={{
           color: 'var(--unread)'
         }} />
         </ButtonBase>
      )}
        {isOpenMinting && (
      <Minting setIsOpenMinting={setIsOpenMinting} groups={memberGroups} myAddress={address} show={show} setTxList={setTxList} txList={txList}/>
     )}
    </AppContainer>
  );
}

export default App;
