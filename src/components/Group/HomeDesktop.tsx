import { Box, Button, Divider, Typography } from "@mui/material";
import React from "react";
import { Spacer } from "../../common/Spacer";
import { ListOfThreadPostsWatched } from "./ListOfThreadPostsWatched";
import { ThingsToDoInitial } from "./ThingsToDoInitial";
import { GroupJoinRequests } from "./GroupJoinRequests";
import { GroupInvites } from "./GroupInvites";
import RefreshIcon from "@mui/icons-material/Refresh";
import { ListOfGroupPromotions } from "./ListOfGroupPromotions";
import { QortPrice } from "../Home/QortPrice";
import ExploreIcon from "@mui/icons-material/Explore";
import { Explore } from "../Explore/Explore";
import { NewUsersCTA } from "../Home/NewUsersCTA";
export const HomeDesktop = ({
  refreshHomeDataFunc,
  myAddress,
  name,
  isLoadingGroups,
  balance,
  userInfo,
  groups,
  setGroupSection,
  setSelectedGroup,
  getTimestampEnterChat,
  setOpenManageMembers,
  setOpenAddGroup,
  setMobileViewMode,
  setDesktopViewMode,
  desktopViewMode,
}) => {
  const [checked1, setChecked1] = React.useState(false);
  const [checked2, setChecked2] = React.useState(false);
  React.useEffect(() => {
      if (balance && +balance >= 6) {
        setChecked1(true);
      }
    }, [balance]);
  
  
    React.useEffect(() => {
      if (name) setChecked2(true);
    }, [name]);
  
  
    const isLoaded = React.useMemo(()=> {
        if(userInfo !== null) return true
      return false
    }, [ userInfo])
  
    const hasDoneNameAndBalanceAndIsLoaded = React.useMemo(()=> {
      if(isLoaded && checked1 && checked2) return true
    return false
  }, [checked1, isLoaded, checked2])

 
  return (
    <Box
      sx={{
        display: desktopViewMode === "home" ? "flex" : "none",
        width: "100%",
        flexDirection: "column",
        height: "100%",
        overflow: "auto",
        alignItems: "center",
      }}
    >
      <Spacer height="20px" />
      <Box
        sx={{
          display: "flex",
          width: "100%",
          flexDirection: "column",
          height: "100%",
          alignItems: "flex-start",
          maxWidth: "1036px",
        }}
      >
        <Typography
          sx={{
            color: "rgba(255, 255, 255, 1)",
            fontWeight: 400,
            fontSize: userInfo?.name?.length > 15 ? "16px" : "20px",
            padding: "10px",
          }}
        >
          Welcome
          {userInfo?.name ? (
            <span
              style={{
                fontStyle: "italic",
              }}
            >{`, ${userInfo?.name}`}</span>
          ) : null}
        </Typography>
        <Spacer height="30px" />
        {!isLoadingGroups && (
          <Box
            sx={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: "20px",
                flexWrap: "wrap",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  width: "330px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ThingsToDoInitial
                  balance={balance}
                  myAddress={myAddress}
                  name={userInfo?.name}
                  userInfo={userInfo}
                  hasGroups={
                    groups?.filter((item) => item?.groupId !== "0").length !== 0
                  }
                />
              </Box>
           
              {desktopViewMode === "home" && (
                <>

              {hasDoneNameAndBalanceAndIsLoaded && (
                <>
 <Box
                    sx={{
                      width: "330px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <GroupJoinRequests
                      setGroupSection={setGroupSection}
                      setSelectedGroup={setSelectedGroup}
                      getTimestampEnterChat={getTimestampEnterChat}
                      setOpenManageMembers={setOpenManageMembers}
                      myAddress={myAddress}
                      groups={groups}
                      setMobileViewMode={setMobileViewMode}
                      setDesktopViewMode={setDesktopViewMode}
                    />
                  </Box>
                  <Box
                    sx={{
                      width: "330px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <GroupInvites
                      setOpenAddGroup={setOpenAddGroup}
                      myAddress={myAddress}
                      groups={groups}
                      setMobileViewMode={setMobileViewMode}
                    />
                  </Box>
                </>
              )}
                 
                </>
              )}
            </Box>
            <QortPrice />
          </Box>
        )}
      
        {!isLoadingGroups && (
          <>
            <Spacer height="60px" />
        <Divider
          color="secondary"
          sx={{
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <ExploreIcon
              sx={{
                color: "white",
              }}
            />{" "}
            <Typography
              sx={{
                fontSize: "1rem",
              }}
            >
              Explore
            </Typography>{" "}
          </Box>
        </Divider>
        {!hasDoneNameAndBalanceAndIsLoaded && (
            <Spacer height="40px" />
          )}
          <Box
            sx={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              width: "100%",
              justifyContent: "center",
            }}
          >
          {hasDoneNameAndBalanceAndIsLoaded && (
                        <ListOfGroupPromotions />

          )}
           
            <Explore setDesktopViewMode={setDesktopViewMode} />
          </Box>
        
          <NewUsersCTA balance={balance} />
          </>
          
        )}
      </Box>
      <Spacer height="26px" />


      <Spacer height="180px" />
    </Box>
  );
};
