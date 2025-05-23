import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppsHomeDesktop } from "./AppsHomeDesktop";
import { Spacer } from "../../common/Spacer";
import { GlobalContext, MyContext, getBaseApiReact } from "../../App";
import { AppInfo } from "./AppInfo";
import {
  executeEvent,
  subscribeToEvent,
  unsubscribeFromEvent,
} from "../../utils/events";
import { AppsParent } from "./Apps-styles";
import AppViewerContainer from "./AppViewerContainer";
import ShortUniqueId from "short-unique-id";
import { AppPublish } from "./AppPublish";
import { AppsLibraryDesktop } from "./AppsLibraryDesktop";
import { AppsCategoryDesktop } from "./AppsCategoryDesktop";
import { AppsNavBarDesktop } from "./AppsNavBarDesktop";
import { Box, ButtonBase } from "@mui/material";
import { HomeIcon } from "../../assets/Icons/HomeIcon";
import { MessagingIcon } from "../../assets/Icons/MessagingIcon";
import { Save } from "../Save/Save";
import { HubsIcon } from "../../assets/Icons/HubsIcon";
import { IconWrapper } from "../Desktop/DesktopFooter";
import { AppsIcon } from "../../assets/Icons/AppsIcon";

const uid = new ShortUniqueId({ length: 8 });

export const AppsDesktop = ({ mode, setMode, show , myName, goToHome, setDesktopSideView, hasUnreadDirects, isDirects, isGroups, hasUnreadGroups, toggleSideViewGroups, toggleSideViewDirects, setDesktopViewMode, isApps, desktopViewMode, myAddress}) => {
  const [availableQapps, setAvailableQapps] = useState([]);
  const [selectedAppInfo, setSelectedAppInfo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [tabs, setTabs] = useState([]);
  const [selectedTab, setSelectedTab] = useState(null);
  const [isNewTabWindow, setIsNewTabWindow] = useState(false);
  const [categories, setCategories] = useState([])
  const iframeRefs = useRef({});
  const { showTutorial } = useContext(GlobalContext);

  const myApp = useMemo(()=> {
   
   return availableQapps.find((app)=> app.name === myName && app.service === 'APP')
  }, [myName, availableQapps])
  const myWebsite = useMemo(()=> {
   
    return availableQapps.find((app)=> app.name === myName && app.service === 'WEBSITE')
   }, [myName, availableQapps])

  useEffect(() => {
    setTimeout(() => {
      executeEvent("setTabsToNav", {
        data: {
          tabs: tabs,
          selectedTab: selectedTab,
          isNewTabWindow: isNewTabWindow,
        },
      });
    }, 100);
  }, [show, tabs, selectedTab, isNewTabWindow]);

  useEffect(()=> {
    if(show){
      showTutorial('qapps')
    }
  }, [show])


  const getCategories = React.useCallback(async () => {
    try {
      const url = `${getBaseApiReact()}/arbitrary/categories`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response?.ok) return;
      const responseData = await response.json();
     
      setCategories(responseData);
     
    } catch (error) {
    } finally {
      // dispatch(setIsLoadingGlobal(false))
    }
  }, []);

  const getQapps = React.useCallback(async () => {
    try {
      let apps = [];
      let websites = [];
      // dispatch(setIsLoadingGlobal(true))
      const url = `${getBaseApiReact()}/arbitrary/resources/search?service=APP&mode=ALL&limit=0&includestatus=true&includemetadata=true`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response?.ok) return;
      const responseData = await response.json();
      const urlWebsites = `${getBaseApiReact()}/arbitrary/resources/search?service=WEBSITE&mode=ALL&limit=0&includestatus=true&includemetadata=true`;

      const responseWebsites = await fetch(urlWebsites, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!responseWebsites?.ok) return;
      const responseDataWebsites = await responseWebsites.json();
    
      apps = responseData;
      websites = responseDataWebsites;
      const combine = [...apps, ...websites];
      setAvailableQapps(combine);
    } catch (error) {
    } finally {
      // dispatch(setIsLoadingGlobal(false))
    }
  }, []);

  useEffect(() => {
    getCategories()
   }, [getCategories]);
 
   useEffect(() => {
     getQapps();
 
     const interval = setInterval(() => {
       getQapps();
     }, 20 * 60 * 1000); // 20 minutes in milliseconds
 
     return () => clearInterval(interval);
   }, [getQapps]);

  const selectedAppInfoFunc = (e) => {
    const data = e.detail?.data;
    setSelectedAppInfo(data);
    setMode("appInfo");
  };

  useEffect(() => {
    subscribeToEvent("selectedAppInfo", selectedAppInfoFunc);

    return () => {
      unsubscribeFromEvent("selectedAppInfo", selectedAppInfoFunc);
    };
  }, []);

  const selectedAppInfoCategoryFunc = (e) => {
    const data = e.detail?.data;
    setSelectedAppInfo(data);
    setMode("appInfo-from-category");
  };

  useEffect(() => {
    subscribeToEvent("selectedAppInfoCategory", selectedAppInfoCategoryFunc);

    return () => {
      unsubscribeFromEvent("selectedAppInfoCategory", selectedAppInfoCategoryFunc);
    };
  }, []);

  

  const selectedCategoryFunc = (e) => {
    const data = e.detail?.data;
    setSelectedCategory(data);
    setMode("category");
  };

  useEffect(() => {
    subscribeToEvent("selectedCategory", selectedCategoryFunc);

    return () => {
      unsubscribeFromEvent("selectedCategory", selectedCategoryFunc);
    };
  }, []);





  
  const navigateBackFunc = (e) => {
    if (['category', 'appInfo-from-category', 'appInfo', 'library', 'publish'].includes(mode)) {
      // Handle the various modes as needed
      if (mode === 'category') {
        setMode('library');
        setSelectedCategory(null);
      } else if (mode === 'appInfo-from-category') {
        setMode('category');
      } else if (mode === 'appInfo') {
        setMode('library');
      } else if (mode === 'library') {
        if (isNewTabWindow) {
          setMode('viewer');
        } else {
          setMode('home');
        }
      } else if (mode === 'publish') {
        setMode('library');
      }
    } else if(selectedTab?.tabId) {
      executeEvent(`navigateBackApp-${selectedTab?.tabId}`, {})
    }
  };
  

  useEffect(() => {
    subscribeToEvent("navigateBack", navigateBackFunc);

    return () => {
      unsubscribeFromEvent("navigateBack", navigateBackFunc);
    };
  }, [mode, selectedTab]);

  const addTabFunc = (e) => {
    const data = e.detail?.data;
    const newTab = {
      ...data,
      tabId: uid.rnd(),
    };
    setTabs((prev) => [...prev, newTab]);
    setSelectedTab(newTab);
    setMode("viewer");

    setIsNewTabWindow(false);
  };



  useEffect(() => {
    subscribeToEvent("addTab", addTabFunc);

    return () => {
      unsubscribeFromEvent("addTab", addTabFunc);
    };
  }, [tabs]);
  const setSelectedTabFunc = (e) => {
    const data = e.detail?.data;

    setSelectedTab(data);
    setTimeout(() => {
      executeEvent("setTabsToNav", {
        data: {
          tabs: tabs,
          selectedTab: data,
          isNewTabWindow: isNewTabWindow,
        },
      });
    }, 100);
    setIsNewTabWindow(false);
  };
  

  useEffect(() => {
    subscribeToEvent("setSelectedTab", setSelectedTabFunc);

    return () => {
      unsubscribeFromEvent("setSelectedTab", setSelectedTabFunc);
    };
  }, [tabs, isNewTabWindow]);

  const removeTabFunc = (e) => {
    const data = e.detail?.data;
    const copyTabs = [...tabs].filter((tab) => tab?.tabId !== data?.tabId);
    if (copyTabs?.length === 0) {
      setMode("home");
    } else {
      setSelectedTab(copyTabs[0]);
    }
    setTabs(copyTabs);
    setSelectedTab(copyTabs[0]);
    setTimeout(() => {
      executeEvent("setTabsToNav", {
        data: {
          tabs: copyTabs,
          selectedTab: copyTabs[0],
        },
      });
    }, 400);
  };

  useEffect(() => {
    subscribeToEvent("removeTab", removeTabFunc);

    return () => {
      unsubscribeFromEvent("removeTab", removeTabFunc);
    };
  }, [tabs]);

  const setNewTabWindowFunc = (e) => {
    setIsNewTabWindow(true);
    setSelectedTab(null)
  };

  useEffect(() => {
    subscribeToEvent("newTabWindow", setNewTabWindowFunc);

    return () => {
      unsubscribeFromEvent("newTabWindow", setNewTabWindowFunc);
    };
  }, [tabs]);


  return (
    <AppsParent
      sx={{
        position: !show && 'fixed',
        left: !show && '-10000000px',
        flexDirection:  'row' 
      }}
    >
     
       <Box sx={{
        width: '60px',
        flexDirection: 'column',
        height: '100vh',
        alignItems: 'center',
        display: 'flex',
        gap: '25px'
       }}>
        <ButtonBase
          sx={{
            width: '60px',
            height: '60px',
            paddingTop: '23px'
          }}
          onClick={() => {
            goToHome();

          }}
        >
            
            <HomeIcon
              height={34}
              color={desktopViewMode === 'home' ? 'white': "rgba(250, 250, 250, 0.5)"}
            />
        
        </ButtonBase>
        <ButtonBase
          onClick={() => {
            setDesktopViewMode('apps')
          }}
        >
          <IconWrapper
            color={isApps ? 'white' :"rgba(250, 250, 250, 0.5)"}
            label="Apps"
            disableWidth
          >
          <AppsIcon height={30} color={isApps ? 'white' :"rgba(250, 250, 250, 0.5)"} />
          </IconWrapper>
        </ButtonBase>
        <ButtonBase
          onClick={() => {
            setDesktopViewMode('chat')
          }}
        >
        <IconWrapper
            color={(hasUnreadDirects || hasUnreadGroups) ? "var(--unread)" : desktopViewMode === 'chat' ? 'white' :"rgba(250, 250, 250, 0.5)"}
            label="Chat"
            disableWidth
          >
            <MessagingIcon
              height={30}
              color={
                (hasUnreadDirects || hasUnreadGroups)
                  ? "var(--unread)"
                  : desktopViewMode === 'chat'
                  ? "white"
                  : "rgba(250, 250, 250, 0.5)"
              }
            />
    </IconWrapper>
        </ButtonBase>
        <Save isDesktop disableWidth myName={myName} />
        {mode !== 'home' && (
                 <AppsNavBarDesktop disableBack={isNewTabWindow && mode === 'viewer'}  />

        )}

       </Box>
    
  
      {mode === "home" && (
         <Box sx={{
          display: 'flex',
          width: '100%',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'auto'
        }}>

         <Spacer height="30px" />
        <AppsHomeDesktop myName={myName} availableQapps={availableQapps}  setMode={setMode} myApp={myApp} myWebsite={myWebsite} myAddress={myAddress} />
        </Box>
      )}
    
        <AppsLibraryDesktop
        isShow={mode === "library" && !selectedTab}
          availableQapps={availableQapps}
          setMode={setMode}
          myName={myName}
          hasPublishApp={!!(myApp || myWebsite)}
          categories={categories}
          getQapps={getQapps}
        />
   
      {mode === "appInfo" && !selectedTab && <AppInfo app={selectedAppInfo} myName={myName} />}
      {mode === "appInfo-from-category" && !selectedTab && <AppInfo app={selectedAppInfo} myName={myName} />}
      <AppsCategoryDesktop  availableQapps={availableQapps} isShow={mode === 'category' && !selectedTab} category={selectedCategory} myName={myName} />
      {mode === "publish" && !selectedTab && <AppPublish  categories={categories} myAddress={myAddress} />}
      {tabs.map((tab) => {
        if (!iframeRefs.current[tab.tabId]) {
          iframeRefs.current[tab.tabId] = React.createRef();
        }
        return (
          <AppViewerContainer
          key={tab?.tabId}
            hide={isNewTabWindow}
            isSelected={tab?.tabId === selectedTab?.tabId}
            app={tab}
            ref={iframeRefs.current[tab.tabId]}
            isDevMode={tab?.service ? false : true}
          />
        );
      })}

      {isNewTabWindow && mode === "viewer" && (
        <>
        <Box sx={{
          display: 'flex',
          width: '100%',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'auto'
        }}>

         <Spacer height="30px" />
          <AppsHomeDesktop myName={myName}  availableQapps={availableQapps} setMode={setMode} myApp={myApp} myWebsite={myWebsite} myAddress={myAddress}  />
          </Box>
        </>
      )}
    </AppsParent>
  );
};
