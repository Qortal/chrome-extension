import React, { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { CreateCommonSecret } from './CreateCommonSecret'
import { reusableGet } from '../../qdn/publish/pubish'
import { uint8ArrayToObject } from '../../backgroundFunctions/encryption'
import { base64ToUint8Array, decodeBase64ForUIChatMessages, objectToBase64 } from '../../qdn/encryption/group-encryption'
import {  ChatContainerComp } from './ChatContainer'
import { ChatList } from './ChatList'
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import Tiptap from './TipTap'
import { CustomButton } from '../../App-styles'
import CircularProgress from '@mui/material/CircularProgress';
import { LoadingSnackbar } from '../Snackbar/LoadingSnackbar'
import { getBaseApiReact, getBaseApiReactSocket, isMobile, MyContext, pauseAllQueues, resumeAllQueues } from '../../App'
import { CustomizedSnackbars } from '../Snackbar/Snackbar'
import { PUBLIC_NOTIFICATION_CODE_FIRST_SECRET_KEY } from '../../constants/codes'
import { useMessageQueue } from '../../MessageQueueContext'
import { executeEvent, subscribeToEvent, unsubscribeFromEvent } from '../../utils/events'
import { Box, ButtonBase, Divider, Typography,   IconButton,
  Tooltip } from '@mui/material'
import ShortUniqueId from "short-unique-id";
import { ReplyPreview } from './MessageItem'
import { ExitIcon } from '../../assets/Icons/ExitIcon'
import { RESOURCE_TYPE_NUMBER_GROUP_CHAT_REACTIONS } from '../../constants/resourceTypes'
import { isExtMsg, getFee } from '../../background'
import { throttle } from 'lodash'
import AppViewerContainer from '../Apps/AppViewerContainer'
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from '@mui/icons-material/Image';
import { messageHasImage } from '../../utils/chat';



const uidImages = new ShortUniqueId({ length: 12 });

const uid = new ShortUniqueId({ length: 5 });

export const ChatGroup = ({selectedGroup, secretKey, setSecretKey, getSecretKey, myAddress, handleNewEncryptionNotification, hide, handleSecretKeyCreationInProgress, triedToFetchSecretKey, myName, balance, getTimestampEnterChatParent, isPrivate, hideView}) => {
  const [messages, setMessages] = useState([])
  const [chatReferences, setChatReferences] = useState({})
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMoved, setIsMoved] = useState(false);
  const [openSnack, setOpenSnack] = React.useState(false);
  const [infoSnack, setInfoSnack] = React.useState(null);
  const hasInitialized = useRef(false)
  const [isFocusedParent, setIsFocusedParent] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null)

  const hasInitializedWebsocket = useRef(false)
  const socketRef = useRef(null); // WebSocket reference
  const timeoutIdRef = useRef(null); // Timeout ID reference
  const groupSocketTimeoutRef = useRef(null); // Group Socket Timeout reference
  const editorRef = useRef(null);
  const [isOpenQManager, setIsOpenQManager] = useState(null)
  const [onEditMessage, setOnEditMessage] = useState(null)
  const [messageSize, setMessageSize] = useState(0)
  const {isUserBlocked, show} = useContext(MyContext)
  const [chatImagesToSave, setChatImagesToSave] = useState([]);
  const [isDeleteImage, setIsDeleteImage] = useState(false);

  const { queueChats, addToQueue, processWithNewMessages } = useMessageQueue();
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const lastReadTimestamp = useRef(null)
  const handleUpdateRef = useRef(null);

 



  const getTimestampEnterChat = async (selectedGroup) => {
    try {
      return new Promise((res, rej) => {
        chrome?.runtime?.sendMessage(
          {
            action: "getTimestampEnterChat",
          },
          (response) => {
            if(response && selectedGroup){
              lastReadTimestamp.current = response[selectedGroup] || undefined
              chrome?.runtime?.sendMessage({
                action: "addTimestampEnterChat",
                payload: {
                  timestamp: Date.now(),
                  groupId: selectedGroup,
                },
              }, (response2)=> {
                setTimeout(() => {
                  getTimestampEnterChatParent();
                }, 200);
              })
              res(response);
            }
            rej(response.error);
          }
        );
      });
    } catch (error) {}
  };

  useEffect(()=> {
    if(!selectedGroup) return
    getTimestampEnterChat(selectedGroup)
  }, [selectedGroup])

  const openQManager = useCallback(()=> {
    setIsOpenQManager(true)
  }, [])
  const members = useMemo(() => {
    const uniqueMembers = new Set();

    messages.forEach((message) => {
      if (message?.senderName) {
        uniqueMembers.add(message?.senderName);
      }
    });

    return Array.from(uniqueMembers);
  }, [messages]);

  const onEdit = useCallback((message)=> {
    setOnEditMessage(message)
    setReplyMessage(null)
    editorRef?.current?.chain().focus().setContent(message?.messageText || message?.text || '<p></p>').run();

  }, [])

  const triggerRerender = () => {
    forceUpdate(); // Trigger re-render by updating the state
  };
  const setEditorRef = (editorInstance) => {
    editorRef.current = editorInstance;
  };

  const tempMessages = useMemo(()=> {
    if(!selectedGroup) return []
    if(queueChats[selectedGroup]){
      return queueChats[selectedGroup]?.filter((item)=> !item?.chatReference)
    }
    return []
  }, [selectedGroup, queueChats])
  const tempChatReferences = useMemo(()=> {
    if(!selectedGroup) return []
    if(queueChats[selectedGroup]){
      return queueChats[selectedGroup]?.filter((item)=> !!item?.chatReference)
    }
    return []
  }, [selectedGroup, queueChats])

  const secretKeyRef = useRef(null)

  useEffect(()=> {
    if(secretKey){
      secretKeyRef.current = secretKey
    }
  }, [secretKey])

    // const getEncryptedSecretKey = useCallback(()=> {
    //     const response = getResource()
    //     const decryptResponse = decryptResource()
    //     return
    // }, [])

   
   const checkForFirstSecretKeyNotification = (messages)=> {
    messages?.forEach((message)=> {
      try {
        const decodeMsg =  atob(message.data);
    
        if(decodeMsg === PUBLIC_NOTIFICATION_CODE_FIRST_SECRET_KEY){
          handleSecretKeyCreationInProgress()
          return
        }
      } catch (error) {
        
      }
    })
   }

   const updateChatMessagesWithBlocksFunc = (e) => {
    if(e.detail){
     setMessages((prev)=> prev?.filter((item)=> {
       return !isUserBlocked(item?.sender, item?.senderName)
     }))
    }
  };

  useEffect(() => {
    subscribeToEvent("updateChatMessagesWithBlocks", updateChatMessagesWithBlocksFunc);

    return () => {
      unsubscribeFromEvent("updateChatMessagesWithBlocks", updateChatMessagesWithBlocksFunc);
    };
  }, []);

  const middletierFunc = async (data: any, groupId: string) => {
    try {
      if (hasInitialized.current) {
        const dataRemovedBlock = data?.filter((item)=> !isUserBlocked(item?.sender, item?.senderName))

        decryptMessages(dataRemovedBlock, true);
        return;
      }
      hasInitialized.current = true;
      const url = `${getBaseApiReact()}/chat/messages?txGroupId=${groupId}&encoding=BASE64&limit=0&reverse=false`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const responseData = await response.json();
      const dataRemovedBlock = responseData?.filter((item)=> {
        return !isUserBlocked(item?.sender, item?.senderName)
      })

      decryptMessages(dataRemovedBlock, false);
    } catch (error) {
      console.error(error);
    }
 }

 
 const decryptMessages = (encryptedMessages: any[], isInitiated: boolean )=> {
  try {
    if(!secretKeyRef.current){
      checkForFirstSecretKeyNotification(encryptedMessages)
    }
    return new Promise((res, rej)=> {
      chrome?.runtime?.sendMessage({ action: "decryptSingle", payload: {
        data: encryptedMessages,
        secretKeyObject: secretKey
    }}, (response) => {
            if (!response?.error) {
              const filterUIMessages = encryptedMessages.filter((item) => !isExtMsg(item.data));
              const decodedUIMessages = decodeBase64ForUIChatMessages(filterUIMessages);
        
              const combineUIAndExtensionMsgsBefore = [...decodedUIMessages, ...response];
              const combineUIAndExtensionMsgs = processWithNewMessages(
                combineUIAndExtensionMsgsBefore.map((item) => ({
                  ...item,
                  ...(item?.decryptedData || {}),
                })),
                selectedGroup
              );
              res(combineUIAndExtensionMsgs);
        
              if (isInitiated) {

                const formatted = combineUIAndExtensionMsgs
                  .filter((rawItem) => !rawItem?.chatReference)
                  .map((item) => {
                    const additionalFields = item?.data === 'NDAwMQ==' ? {
                      text: "<p>First group key created.</p>" 
                   } : {}
                    return {
                      ...item,
                      id: item.signature,
                      text: item?.decryptedData?.message || "",
                      repliedTo: item?.repliedTo || item?.decryptedData?.repliedTo,
                      unread: item?.sender === myAddress ? false : !!item?.chatReference ? false : true,
                      isNotEncrypted: !!item?.messageText,
                      ...additionalFields
                    }
                  });
                setMessages((prev) => [...prev, ...formatted]);
        
                setChatReferences((prev) => {
                  const organizedChatReferences = { ...prev };
                  combineUIAndExtensionMsgs
                    .filter((rawItem) => rawItem && rawItem.chatReference && (rawItem?.decryptedData?.type === "reaction" || rawItem?.decryptedData?.type === "edit" || rawItem?.type === "edit" || rawItem?.isEdited || rawItem?.type === "reaction"))
                    .forEach((item) => {
                      try {
                        if(item?.decryptedData?.type === "edit"){
                          organizedChatReferences[item.chatReference] = {
                            ...(organizedChatReferences[item.chatReference] || {}),
                            edit: item.decryptedData,
                          };
                        } else if(item?.type === "edit" || item?.isEdited){
                          organizedChatReferences[item.chatReference] = {
                            ...(organizedChatReferences[item.chatReference] || {}),
                            edit: item,
                          };
                        } else {
                          const content = item?.content ||  item.decryptedData?.content;
                          const sender = item.sender;
                          const newTimestamp = item.timestamp;
                          const contentState = item?.contentState !== undefined ? item?.contentState :  item.decryptedData?.contentState;
          
                          if (!content || typeof content !== "string" || !sender || typeof sender !== "string" || !newTimestamp) {
                            console.warn("Invalid content, sender, or timestamp in reaction data", item);
                            return;
                          }
          
                          organizedChatReferences[item.chatReference] = {
                            ...(organizedChatReferences[item.chatReference] || {}),
                            reactions: organizedChatReferences[item.chatReference]?.reactions || {},
                          };
          
                          organizedChatReferences[item.chatReference].reactions[content] =
                            organizedChatReferences[item.chatReference].reactions[content] || [];
          
                          let latestTimestampForSender = null;
          
                          organizedChatReferences[item.chatReference].reactions[content] = 
                            organizedChatReferences[item.chatReference].reactions[content].filter((reaction) => {
                              if (reaction.sender === sender) {
                                latestTimestampForSender = Math.max(latestTimestampForSender || 0, reaction.timestamp);
                              }
                              return reaction.sender !== sender;
                            });
          
                          if (latestTimestampForSender && newTimestamp < latestTimestampForSender) {
                            return;
                          }
          
                          if (contentState !== false) {
                            organizedChatReferences[item.chatReference].reactions[content].push(item);
                          }
          
                          if (organizedChatReferences[item.chatReference].reactions[content].length === 0) {
                            delete organizedChatReferences[item.chatReference].reactions[content];
                          }
                        }
                      
                      } catch (error) {
                        console.error("Error processing reaction/edit item:", error, item);
                      }
                    });
        
                  return organizedChatReferences;
                });
              } else {
                let firstUnreadFound = false;
                const formatted = combineUIAndExtensionMsgs
                  .filter((rawItem) => !rawItem?.chatReference)
                  .map((item) => {
                    const additionalFields = item?.data === 'NDAwMQ==' ? {
                       text: "<p>First group key created.</p>" 
                    } : {}
                    const divide = lastReadTimestamp.current && !firstUnreadFound && item.timestamp > lastReadTimestamp.current && myAddress !== item?.sender;
                   
                    if(divide){
                      firstUnreadFound = true
                    }
                    return {
                      ...item,
                      id: item.signature,
                      text: item?.decryptedData?.message || "",
                      repliedTo: item?.repliedTo || item?.decryptedData?.repliedTo,
                      isNotEncrypted: !!item?.messageText,
                      unread: false,
                      divide,
                      ...additionalFields
                    }
                  });
                setMessages(formatted);
        
                setChatReferences((prev) => {
                  const organizedChatReferences = { ...prev };
        
                  combineUIAndExtensionMsgs
                    .filter((rawItem) => rawItem && rawItem.chatReference && (rawItem?.decryptedData?.type === "reaction" || rawItem?.decryptedData?.type === "edit" || rawItem?.type === "edit" || rawItem?.isEdited || rawItem?.type === "reaction"))
                    .forEach((item) => {
                      try {
                        if(item?.decryptedData?.type === "edit"){
                          organizedChatReferences[item.chatReference] = {
                            ...(organizedChatReferences[item.chatReference] || {}),
                            edit: item.decryptedData,
                          };
                        } else if(item?.type === "edit" || item?.isEdited){
                          organizedChatReferences[item.chatReference] = {
                            ...(organizedChatReferences[item.chatReference] || {}),
                            edit: item,
                          };
                        } else {
                        const content = item?.content || item.decryptedData?.content;
                        const sender = item.sender;
                        const newTimestamp = item.timestamp;
                        const contentState = item?.contentState !== undefined ? item?.contentState :   item.decryptedData?.contentState;
        
                        if (!content || typeof content !== "string" || !sender || typeof sender !== "string" || !newTimestamp) {
                          console.warn("Invalid content, sender, or timestamp in reaction data", item);
                          return;
                        }
        
                        organizedChatReferences[item.chatReference] = {
                          ...(organizedChatReferences[item.chatReference] || {}),
                          reactions: organizedChatReferences[item.chatReference]?.reactions || {},
                        };
        
                        organizedChatReferences[item.chatReference].reactions[content] =
                          organizedChatReferences[item.chatReference].reactions[content] || [];
        
                        let latestTimestampForSender = null;
        
                        organizedChatReferences[item.chatReference].reactions[content] = 
                          organizedChatReferences[item.chatReference].reactions[content].filter((reaction) => {
                            if (reaction.sender === sender) {
                              latestTimestampForSender = Math.max(latestTimestampForSender || 0, reaction.timestamp);
                            }
                            return reaction.sender !== sender;
                          });
        
                        if (latestTimestampForSender && newTimestamp < latestTimestampForSender) {
                          return;
                        }
        
                        if (contentState !== false) {
                          organizedChatReferences[item.chatReference].reactions[content].push(item);
                        }
        
                        if (organizedChatReferences[item.chatReference].reactions[content].length === 0) {
                          delete organizedChatReferences[item.chatReference].reactions[content];
                        }
                      }
                      } catch (error) {
                        console.error("Error processing reaction item:", error, item);
                      }
                    });
        
                  return organizedChatReferences;
                });
              }
            }
            rej(response.error);
        });
      })  
    } catch (error) {
        
    }
  }

   

    const forceCloseWebSocket = () => {
      if (socketRef.current) {
       
        clearTimeout(timeoutIdRef.current);
        clearTimeout(groupSocketTimeoutRef.current);
        socketRef.current.close(1000, 'forced');
        socketRef.current = null;
      }
    };
  
    const pingGroupSocket = () => {
      try {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send('ping');
          timeoutIdRef.current = setTimeout(() => {
            if (socketRef.current) {
              socketRef.current.close();
              clearTimeout(groupSocketTimeoutRef.current);
            }
          }, 5000); // Close if no pong in 5 seconds
        }
      } catch (error) {
        console.error('Error during ping:', error);
    }
  }
    const initWebsocketMessageGroup = () => {
 

      let socketLink = `${getBaseApiReactSocket()}/websockets/chat/messages?txGroupId=${selectedGroup}&encoding=BASE64&limit=100`
      socketRef.current  = new WebSocket(socketLink)

    
      socketRef.current.onopen = () => {
        setTimeout(pingGroupSocket, 50)
      }
      socketRef.current.onmessage = (e) => {
        try {
          if (e.data === 'pong') {
            clearTimeout(timeoutIdRef.current);
            groupSocketTimeoutRef.current = setTimeout(pingGroupSocket, 45000); // Ping every 45 seconds
          } else {
            middletierFunc(JSON.parse(e.data), selectedGroup)
          setIsLoading(false)
          }
        } catch (error) {
          
        }
      
        
      }
      socketRef.current.onclose = () => {
        clearTimeout(groupSocketTimeoutRef.current);
          clearTimeout(timeoutIdRef.current);
          console.warn(`WebSocket closed: ${event.reason || 'unknown reason'}`);
          if (event.reason !== 'forced' && event.code !== 1000) {
            setTimeout(() => initWebsocketMessageGroup(), 1000); // Retry after 10 seconds
          }
      }
      socketRef.current.onerror = (e) => {
        clearTimeout(groupSocketTimeoutRef.current);
        clearTimeout(timeoutIdRef.current);
        if (socketRef.current) {
          socketRef.current.close();
        }
      }
    }

    useEffect(()=> {
      if(hasInitializedWebsocket.current) return
      if(triedToFetchSecretKey && !secretKey){
        forceCloseWebSocket()
        setMessages([])
        setIsLoading(true)
        initWebsocketMessageGroup()
      }  
    }, [triedToFetchSecretKey, secretKey, isPrivate])

    useEffect(()=> {
      if(isPrivate === null) return
      if(isPrivate === false || !secretKey || hasInitializedWebsocket.current) return
      forceCloseWebSocket()
      setMessages([])
      setIsLoading(true)
      pauseAllQueues()
      setTimeout(() => {
        resumeAllQueues()
      }, 6000);
        initWebsocketMessageGroup()
        hasInitializedWebsocket.current = true
    }, [secretKey, isPrivate])

  
    useEffect(()=> {
      const notifications = messages.filter((message)=> message?.decryptedData
      ?.type === 'notification')
      if(notifications.length === 0) return
      const latestNotification = notifications.reduce((latest, current) => {
        return current.timestamp > latest.timestamp ? current : latest;
      }, notifications[0]);
      handleNewEncryptionNotification(latestNotification)
      
    }, [messages])
  

  const encryptChatMessage = async (data: string, secretKeyObject: any, reactiontypeNumber?: number)=> {
    try {
      return new Promise((res, rej)=> {
        chrome?.runtime?.sendMessage({ action: "encryptSingle", payload: {
          data,
          secretKeyObject,
          typeNumber: reactiontypeNumber
      }}, (response) => {
     
          if (!response?.error) {
            res(response)
          }
          rej(response.error)
        });
      })  
    } catch (error) {
        
    }
}

const sendChatGroup = async ({groupId, typeMessage = undefined, chatReference = undefined, messageText}: any)=> {
  try {
    return new Promise((res, rej)=> {
      chrome?.runtime?.sendMessage({ action: "sendChatGroup", payload: {
        groupId, typeMessage, chatReference, messageText
    }}, (response) => {
    
        if (!response?.error) {
          res(response)
          return
        }
        rej(response.error)
      });
    })  
  } catch (error) {
      throw new Error(error)
  }
}
const clearEditorContent = () => {
  if (editorRef.current) {
    editorRef.current.chain().focus().clearContent().run();
    if(isMobile){
      setTimeout(() => {
        editorRef.current?.chain().blur().run(); 
        setIsFocusedParent(false)
        executeEvent("sent-new-message-group", {})
        setTimeout(() => {
          triggerRerender();
         }, 300);
      }, 200);
    }
  }
};


const sendMessage = async ()=> {
  try {
    if(messageSize > 4000) return
    if(isPrivate === null) throw new Error('Unable to determine if group is private')
    if(isSending) return
    if(+balance < 4) throw new Error('You need at least 4 QORT to send a message')
    pauseAllQueues()
    if (editorRef.current) {
      let htmlContent = editorRef.current.getHTML();
        const deleteImage =
          onEditMessage && isDeleteImage && messageHasImage(onEditMessage);

        const hasImage =
          chatImagesToSave?.length > 0 || onEditMessage?.images?.length > 0;
        if (
          (!htmlContent?.trim() || htmlContent?.trim() === '<p></p>') &&
          !hasImage &&
          !deleteImage
        )
          return;
        if (htmlContent?.trim() === '<p></p>') {
          htmlContent = null;
        }
        setIsSending(true);
        const message =
          isPrivate === false
            ? !htmlContent
              ? '<p></p>'
              : editorRef.current.getJSON()
            : htmlContent;
    const secretKeyObject = await getSecretKey(false, true)

    let repliedTo = replyMessage?.signature

    if (replyMessage?.chatReference) {
      repliedTo = replyMessage?.chatReference
    }
    let chatReference = onEditMessage?.signature

    const publicData = isPrivate ? {} : {
      isEdited : chatReference ? true : false,
    }
    const imagesToPublish = [];
     
        if (deleteImage) {
          const fee = await getFee('ARBITRARY');

          await show({
            publishFee: fee.fee + ' QORT',
            message: 'Would you like to delete your previous chat image?',
          });

          await new Promise((res, rej) => {
            chrome?.runtime?.sendMessage(
              {
                action: "publishOnQDN",
                payload: {
                  data: 'RA==',
                  identifier: onEditMessage?.images[0]?.identifier,
            service: onEditMessage?.images[0]?.service,
            uploadType: 'base64',
                },
              },
              (response) => {
             
                if (!response?.error) {
                  res(response);
                  return
                }
                rej(response.error);
              }
            );
          });
        }
        if (chatImagesToSave?.length > 0) {
          const imageToSave = chatImagesToSave[0];

          const base64ToSave = isPrivate
            ? await encryptChatMessage(imageToSave, secretKeyObject)
            : imageToSave;
          // 1 represents public group, 0 is private
          const identifier = `grp-q-manager_${isPrivate ? 0 : 1}_group_${selectedGroup}_${uidImages.rnd()}`;
          imagesToPublish.push({
            service: 'IMAGE',
            identifier,
            name: myName,
            base64: base64ToSave,
          });

         
         const res = await new Promise((res, rej) => {
            chrome?.runtime?.sendMessage(
              {
                action: "PUBLISH_MULTIPLE_QDN_RESOURCES",
                type: "qortalRequest",
                payload: {
                  resources: imagesToPublish,
                },
              },
              (response) => {
                if (response.error) {
                  rej(response?.message);
                  return;
                } else {
                  res(response);
                  
                }
              }
            );
          });
          if (res?.error) throw new Error('Unable to publish images');
        }

        const images =
          imagesToPublish?.length > 0
            ? imagesToPublish.map((item) => {
                return {
                  name: item.name,
                  identifier: item.identifier,
                  service: item.service,
                  timestamp: Date.now(),
                };
              })
            : chatReference
              ?  isDeleteImage
              ? []
              : onEditMessage?.images || []
              : [];
    const otherData = {
      repliedTo,
      ...(onEditMessage?.decryptedData || {}),
      type: chatReference ? 'edit' : '',
      specialId: uid.rnd(),
      images,
      ...publicData
    }
    const objectMessage = {
      ...(otherData || {}),
      [isPrivate ? 'message' : 'messageText']: message,
      version: 3
    }
    const message64: any = await objectToBase64(objectMessage)
 
    const encryptSingle = isPrivate === false ? JSON.stringify(objectMessage) : await encryptChatMessage(message64, secretKeyObject)
    // const res = await sendChatGroup({groupId: selectedGroup,messageText: encryptSingle})
   
    const sendMessageFunc = async () => {
     return await sendChatGroup({groupId: selectedGroup,messageText: encryptSingle, chatReference})
    };

    // Add the function to the queue
    const messageObj = {
      message: {
        text: htmlContent,
        timestamp: Date.now(),
      senderName: myName,
      sender: myAddress,
         ...(otherData || {})
      },
     chatReference
    }
    addToQueue(sendMessageFunc, messageObj, 'chat',
    selectedGroup );
    setTimeout(() => {
      executeEvent("sent-new-message-group", {})
    }, 150);
    clearEditorContent()
    setReplyMessage(null)
    setOnEditMessage(null)
    setIsDeleteImage(false);
    setChatImagesToSave([]);
    }
    // send chat message
  } catch (error) {
    const errorMsg = error?.message || error
    setInfoSnack({
      type: "error",
      message: errorMsg,
    });
    setOpenSnack(true);
    console.error(error)
  } finally {
    setIsSending(false)
    resumeAllQueues()
  }
}

useEffect(() => {
  if (!editorRef?.current) return;

  handleUpdateRef.current = throttle(async () => {
   try {
    if(isPrivate){
      const htmlContent = editorRef.current.getHTML();
      const message64 =  await objectToBase64(JSON.stringify(htmlContent))
      const secretKeyObject = await getSecretKey(false, true)
      const encryptSingle = await encryptChatMessage(message64, secretKeyObject)
      setMessageSize((encryptSingle?.length || 0) + 200);
    } else {
      const htmlContent = editorRef.current.getJSON();
      const message =  JSON.stringify(htmlContent)
      const size = new Blob([message]).size
      setMessageSize(size + 300);
    }
   
   } catch (error) {
    // calc size error
   }
  }, 1200); 

  const currentEditor = editorRef.current;

  currentEditor.on("update", handleUpdateRef.current);

  return () => {
    currentEditor.off("update", handleUpdateRef.current);
  };
}, [editorRef, setMessageSize, isPrivate]); 

  useEffect(() => {
    if (hide) {
      setTimeout(() => setIsMoved(true), 500); // Wait for the fade-out to complete before moving
    } else {
      setIsMoved(false); // Reset the position immediately when showing
    }
  }, [hide]);
    
  const onReply = useCallback((message)=> {
    if(onEditMessage){
      clearEditorContent()
    }
    setReplyMessage(message)
    setOnEditMessage(null)
    setIsDeleteImage(false);
    setChatImagesToSave([]);
    editorRef?.current?.chain().focus()
  }, [])

  const handleReaction = useCallback(async (reaction, chatMessage, reactionState = true)=> {
    try {
      
      if(isSending) return
      if(+balance < 4) throw new Error('You need at least 4 QORT to send a message')
      pauseAllQueues()
   
     
        setIsSending(true)
      const message = ''
      const secretKeyObject = await getSecretKey(false, true)

     
      const otherData = {
        specialId: uid.rnd(),
        type: 'reaction',
        content: reaction,
        contentState: reactionState
      }
      const objectMessage = {
        message,
        ...(otherData || {})
      }
      const message64: any = await objectToBase64(objectMessage)
      const reactiontypeNumber = RESOURCE_TYPE_NUMBER_GROUP_CHAT_REACTIONS
      const encryptSingle = isPrivate === false ? JSON.stringify(objectMessage) : await encryptChatMessage(message64, secretKeyObject, reactiontypeNumber)
      // const res = await sendChatGroup({groupId: selectedGroup,messageText: encryptSingle})
     
      const sendMessageFunc = async () => {
       return await sendChatGroup({groupId: selectedGroup,messageText: encryptSingle, chatReference: chatMessage.signature})
      };

      // Add the function to the queue
      const messageObj = {
        message: {
          text: message,
          timestamp: Date.now(),
        senderName: myName,
        sender: myAddress,
           ...(otherData || {})
        },
       chatReference: chatMessage.signature
      }
      addToQueue(sendMessageFunc, messageObj, 'chat-reaction',
      selectedGroup );
      // setTimeout(() => {
      //   executeEvent("sent-new-message-group", {})
      // }, 150);
      // clearEditorContent()
      // setReplyMessage(null)

      // send chat message
    } catch (error) {
      const errorMsg = error?.message || error
      setInfoSnack({
        type: "error",
        message: errorMsg,
      });
      setOpenSnack(true);
      console.error(error)
    } finally {
      setIsSending(false)
      resumeAllQueues()
    }
  }, [isPrivate])

  const insertImage = useCallback(
    (img) => {
      if (
        chatImagesToSave?.length > 0 ||
        (messageHasImage(onEditMessage) && !isDeleteImage)
      ) {
        setInfoSnack({
          type: 'error',
          message: 'This message already has an image',
        });
        setOpenSnack(true);
        return;
      }
      setChatImagesToSave((prev) => [...prev, img]);
    },
    [chatImagesToSave, onEditMessage?.images, isDeleteImage]
  );

  
  return (
    <div style={{
      height: isMobile ? '100%' : '100%',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      opacity: hide ? 0 : 1,
      position: hide ? 'absolute' : 'relative',
    left: hide && '-100000px',
    }}>
 
 <ChatList isPrivate={isPrivate} hasSecretKey={!!secretKey} openQManager={openQManager} enableMentions onReply={onReply} onEdit={onEdit} chatId={selectedGroup} initialMessages={messages} myAddress={myAddress} tempMessages={tempMessages} handleReaction={handleReaction} chatReferences={chatReferences} tempChatReferences={tempChatReferences} members={members} myName={myName} selectedGroup={selectedGroup} />
   
 {(!!secretKey || isPrivate === false) && (
      <div style={{
        // position: 'fixed',
        // bottom: '0px',
        backgroundColor: "#232428",
        minHeight: isMobile ? '0px' : '150px',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
        padding: isMobile ? '10px' : '20px',
        position: isFocusedParent ? 'fixed' : 'relative',
        bottom: isFocusedParent ? '0px' : 'unset',
        top: isFocusedParent ? '0px' : 'unset',
        zIndex: isFocusedParent ? 5 : 'unset',
        flexShrink: 0
      }}>
      
      <div style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: isMobile && 1,
            overflow: !isMobile &&  "auto",
            flexShrink: 0,
            width: 'calc(100% - 100px)',
            justifyContent: 'flex-end'
      }}>
        <Box
              sx={{
                alignItems: 'flex-start',
                display: 'flex',
                width: '100%',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              {!isDeleteImage &&
                onEditMessage &&
                messageHasImage(onEditMessage) &&
                onEditMessage?.images?.map((_, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      height: '50px',
                      width: '50px',
                    }}
                  >
                    <ImageIcon
                      
                      sx={{
                        height: '100%',
                        width: '100%',
                        borderRadius: '3px',
                        color:'white'
                      }}
                    />
                    <Tooltip title="Delete image">
                      <IconButton
                        onClick={() => setIsDeleteImage(true)}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: (theme) =>
                            theme.palette.background.paper,
                          color: (theme) => theme.palette.text.primary,
                          borderRadius: '50%',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          boxShadow: (theme) => theme.shadows[2],
                          '&:hover': {
                            backgroundColor: (theme) =>
                              theme.palette.background.default,
                            opacity: 1,
                          },
                          pointerEvents: 'auto',
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                ))}
              {chatImagesToSave.map((imgBase64, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    height: '50px',
                    width: '50px',
                  }}
                >
                  <img
                    src={`data:image/webp;base64,${imgBase64}`}
                    style={{
                      height: '100%',
                      width: '100%',
                      objectFit: 'contain',
                      borderRadius: '3px',
                    }}
                  />
                  <Tooltip title="Remove image">
                    <IconButton
                      onClick={() =>
                        setChatImagesToSave((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: (theme) =>
                          theme.palette.background.paper,
                        color: (theme) => theme.palette.text.primary,
                        borderRadius: '50%',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        boxShadow: (theme) => theme.shadows[2],
                        '&:hover': {
                          backgroundColor: (theme) =>
                            theme.palette.background.default,
                          opacity: 1,
                        },
                        pointerEvents: 'auto',
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
              ))}
            </Box>
        {replyMessage && (
        <Box sx={{
          display: 'flex',
          gap: '5px',
          alignItems: 'flex-start',
          width: '100%'
        }}>
                  <ReplyPreview message={replyMessage} />

           <ButtonBase
               onClick={() => {
                setReplyMessage(null)
              
                setOnEditMessage(null)
                setIsDeleteImage(false);
                setChatImagesToSave([]);

               }}
             >
             <ExitIcon />
             </ButtonBase>
        </Box>
      )}
      {onEditMessage && (
        <Box sx={{
          display: 'flex',
          gap: '5px',
          alignItems: 'flex-start',
          width: '100%'
        }}>
                  <ReplyPreview isEdit message={onEditMessage} />

           <ButtonBase
               onClick={() => {
                setReplyMessage(null)
                setOnEditMessage(null)
                setIsDeleteImage(false);
        setChatImagesToSave([]);
                  clearEditorContent()
                
               }}
             >
             <ExitIcon />
             </ButtonBase>
        </Box>
      )}
     
     
       <Tiptap enableMentions setEditorRef={setEditorRef} onEnter={sendMessage} isChat disableEnter={isMobile ? true : false} isFocusedParent={isFocusedParent} setIsFocusedParent={setIsFocusedParent} membersWithNames={members} insertImage={insertImage} />
       {messageSize > 750 && (
        <Box sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'flex-start',
          position: 'relative',
        }}>
                <Typography sx={{
                  fontSize: '12px',
                  color: messageSize > 4000 ? 'var(--danger)' : 'unset'
                }}>{`Your message size is of ${messageSize} bytes out of a maximum of 4000`}</Typography>

          </Box>
      )}
      </div>
      
      <Box sx={{
        display: 'flex',
        width: '100px',
        gap: '10px',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
      }}>

      <CustomButton
              onClick={()=> {
              
                if(isSending) return
                sendMessage()
              }}
              style={{
                marginTop: 'auto',
                alignSelf: 'center',
                cursor: isSending ? 'default' : 'pointer',
                background: isSending && 'rgba(0, 0, 0, 0.8)',
                flexShrink: 0,
                padding: '5px',
                width: '100px',
                minWidth: 'auto'
                
              }}
            >
              {isSending && (
                <CircularProgress
                size={18}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                  color: 'white'
                }}
              />
              )}
              {` Send`}
            </CustomButton>
           
              </Box>
      </div>
              )}
      {isOpenQManager !== null && (
 <Box sx={{
  position: 'fixed',
  height: '600px',
  
  maxHeight: '100vh',
  width: '400px',
  maxWidth: '100vw',
  backgroundColor: '#27282c',
  zIndex: 100,
  bottom: 0,
  right: 0,
  overflow: 'hidden',
  borderTopLeftRadius: '10px',
  borderTopRightRadius: '10px',
  display:  isOpenQManager === true ? 'block' : 'none',
  boxShadow: 4,
  
}}>
   <Box sx={{
  height: '100%',
  width: '100%',

}}>
  <Box sx={{
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    padding: '5px',

    justifyContent: 'space-between'
  }}>
            <Typography>Q-Manager</Typography>
        <ButtonBase onClick={()=> {
          setIsOpenQManager(false)
        }}><CloseIcon sx={{
          color: 'white'
        }} /></ButtonBase>
  </Box>
  <Divider />
<AppViewerContainer customHeight="560px" app={{
  tabId: '5558588',
  name: 'Q-Manager',
  service: 'APP',
  path: `?groupId=${selectedGroup}`
}} isSelected />
</Box>
</Box>
      )}
      {/* <ChatContainerComp messages={formatMessages} /> */}
      <LoadingSnackbar open={isLoading} info={{
        message: "Loading chat... please wait."
      }} />
             <CustomizedSnackbars open={openSnack} setOpen={setOpenSnack} info={infoSnack} setInfo={setInfoSnack}  />

    </div>
  )
}
