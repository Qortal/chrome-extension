import { banFromGroup, gateways, getApiKeyFromStorage, getNameInfoForOthers } from "./background";
import { addForeignServer, addGroupAdminRequest, addListItems, adminAction, banFromGroupRequest, buyNameRequest, cancelGroupBanRequest, cancelGroupInviteRequest, cancelSellNameRequest, cancelSellOrder, createBuyOrder, createGroupRequest, createPoll, createSellOrder, decryptAESGCMRequest, decryptData, decryptDataWithSharingKey, decryptQortalGroupData, deleteHostedData, deleteListItems, deployAt, encryptData, encryptDataWithSharingKey, encryptQortalGroupData, getArrrSyncStatus, getCrossChainServerInfo, getDaySummary, getForeignFee, getHostedData, getListItems, getNodeInfo, getNodeStatus, getServerConnectionHistory, getTxActivitySummary, getUserAccount, getUserWallet, getUserWalletInfo, getUserWalletTransactions, getWalletBalance, inviteToGroupRequest, joinGroup, kickFromGroupRequest, leaveGroupRequest,  multiPaymentWithPrivateData, publishMultipleQDNResources, publishQDNResource, reEncryptQortalKeys, registerNameRequest, removeForeignServer, removeGroupAdminRequest, saveFile, sellNameRequest, sendChatMessage, sendCoin, sessionPermissions, setCurrentForeignServer, showPdfReader, signForeignFees, signTransaction, transferAssetRequest,  updateForeignFee, updateGroupRequest, updateNameRequest, voteOnPoll } from "./qortalRequests/get";

 export const listOfAllQortalRequests = [
   'GET_USER_ACCOUNT',
   'DECRYPT_DATA',
   'SEND_COIN',
   'GET_LIST_ITEMS',
   'ADD_LIST_ITEMS',
   'DELETE_LIST_ITEM',
   'VOTE_ON_POLL',
   'CREATE_POLL',
   'SEND_CHAT_MESSAGE',
   'JOIN_GROUP',
   'DEPLOY_AT',
   'GET_USER_WALLET',
   'GET_WALLET_BALANCE',
   'GET_USER_WALLET_INFO',
   'GET_CROSSCHAIN_SERVER_INFO',
   'GET_TX_ACTIVITY_SUMMARY',
   'GET_FOREIGN_FEE',
   'UPDATE_FOREIGN_FEE',
   'GET_SERVER_CONNECTION_HISTORY',
   'SET_CURRENT_FOREIGN_SERVER',
   'ADD_FOREIGN_SERVER',
   'REMOVE_FOREIGN_SERVER',
   'GET_DAY_SUMMARY',
   'CREATE_TRADE_BUY_ORDER',
   'CREATE_TRADE_SELL_ORDER',
   'CANCEL_TRADE_SELL_ORDER',
   'IS_USING_PUBLIC_NODE',
   'ADMIN_ACTION',
   'SIGN_TRANSACTION',
   'OPEN_NEW_TAB',
   'CREATE_AND_COPY_EMBED_LINK',
   'DECRYPT_QORTAL_GROUP_DATA',
   'DECRYPT_DATA_WITH_SHARING_KEY',
   'DELETE_HOSTED_DATA',
   'GET_HOSTED_DATA', 
   'PUBLISH_MULTIPLE_QDN_RESOURCES',
   'PUBLISH_QDN_RESOURCE',
   'ENCRYPT_DATA',
   'ENCRYPT_DATA_WITH_SHARING_KEY',
   'ENCRYPT_QORTAL_GROUP_DATA',
   'SAVE_FILE',
   'GET_ACCOUNT_DATA',
   'GET_ACCOUNT_NAMES',
   'SEARCH_NAMES',
   'GET_NAME_DATA',
   'GET_QDN_RESOURCE_URL',
   'LINK_TO_QDN_RESOURCE',
   'LIST_QDN_RESOURCES',
   'SEARCH_QDN_RESOURCES',
   'FETCH_QDN_RESOURCE',
   'GET_QDN_RESOURCE_STATUS',
   'GET_QDN_RESOURCE_PROPERTIES',
   'GET_QDN_RESOURCE_METADATA',
   'SEARCH_CHAT_MESSAGES',
   'LIST_GROUPS',
   'GET_BALANCE',
   'GET_AT',
   'GET_AT_DATA',
   'LIST_ATS',
   'FETCH_BLOCK',
   'FETCH_BLOCK_RANGE',
   'SEARCH_TRANSACTIONS',
   'GET_PRICE',
   'SHOW_ACTIONS',
   'REGISTER_NAME',
   'UPDATE_NAME',
   'LEAVE_GROUP',
   'INVITE_TO_GROUP',
   'KICK_FROM_GROUP',
   'BAN_FROM_GROUP',
   'CANCEL_GROUP_BAN',
   'ADD_GROUP_ADMIN',
   'REMOVE_GROUP_ADMIN',
   'DECRYPT_AESGCM',
   'CANCEL_GROUP_INVITE',
   'CREATE_GROUP',
   'GET_USER_WALLET_TRANSACTIONS',
   'GET_NODE_INFO',
   'GET_NODE_STATUS',
   'GET_ARRR_SYNC_STATUS',
    'SHOW_PDF_READER',
    'UPDATE_GROUP',
    'SELL_NAME',
 'CANCEL_SELL_NAME',
 'BUY_NAME',  'MULTI_ASSET_PAYMENT_WITH_PRIVATE_DATA',
 'TRANSFER_ASSET',
 'SIGN_FOREIGN_FEES',
 'GET_PRIMARY_NAME',
   'SESSION_PERMISSIONS',
  'LOCK_TAB',
  'UNLOCK_TAB',
  'WHICH_UI',
   'REENCRYPT_GROUP_KEYS',
 ]

// Promisify chrome.storage.local.get
function getLocalStorage(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], function (result) {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve(result[key]);
      });
    });
  }
  
  // Promisify chrome.storage.local.set
  function setLocalStorage(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, function () {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve();
      });
    });
  }

  export const isRunningGateway = async ()=> {
    let isGateway = true;
    const apiKey = await getApiKeyFromStorage();
    if (apiKey && (apiKey?.url && !gateways.some(gateway => apiKey?.url?.includes(gateway)))) {
      isGateway = false;
    }
  
    return isGateway
  }

  
  export async function setPermission(key, value) {
    try {
      // Get the existing qortalRequestPermissions object
      const qortalRequestPermissions = (await getLocalStorage('qortalRequestPermissions')) || {};
      
      // Update the permission
      qortalRequestPermissions[key] = value;
      
      // Save the updated object back to storage
      await setLocalStorage({ qortalRequestPermissions });
      
    } catch (error) {
      console.error('Error setting permission:', error);
    }
  }

  export async function getPermission(key) {
    try {
      // Get the qortalRequestPermissions object from storage
      const qortalRequestPermissions = (await getLocalStorage('qortalRequestPermissions')) || {};
      
      // Return the value for the given key, or null if it doesn't exist
      return qortalRequestPermissions[key] || null;
    } catch (error) {
      console.error('Error getting permission:', error);
      return null;
    }
  }

  // In-memory storage for session permissions
const sessionPermissionsStore = new Map<
  string,
  {
    permissions: string[];
    timestamp: number;
  }
>();

// Valid permissions that can be granted in a session
export const VALID_SESSION_PERMISSIONS = [
  'JOIN_GROUP',
  'GET_USER_WALLET',
  'GET_WALLET_BALANCE',
  'GET_USER_WALLET_TRANSACTIONS',
  'GET_USER_WALLET_INFO',
  'UPDATE_FOREIGN_FEE',
  'GET_SERVER_CONNECTION_HISTORY',
  'SET_CURRENT_FOREIGN_SERVER',
  'ADD_FOREIGN_SERVER',
  'REMOVE_FOREIGN_SERVER',
  'LOCK_TAB',
  'INVITE_TO_GROUP',
  'KICK_FROM_GROUP',
  'BAN_FROM_GROUP',
  'CANCEL_GROUP_BAN',
  'REMOVE_GROUP_ADMIN',
  'ADD_GROUP_ADMIN',
  'CREATE_GROUP',
  'PUBLISH_QDN_RESOURCE',
  'PUBLISH_MULTIPLE_QDN_RESOURCES',
  'GET_USER_ACCOUNT',
  'GET_LIST_ITEMS',
  'SIGN_FOREIGN_FEES',
   'REENCRYPT_GROUP_KEYS'
];

// Permissions automatically granted for the session when GET_USER_ACCOUNT is accepted
// These are read-only, low-risk permissions
export const AUTO_GRANTED_PERMISSIONS_ON_AUTH = [
  'GET_USER_ACCOUNT',
  'GET_USER_WALLET',
  'GET_WALLET_BALANCE',
  'GET_USER_WALLET_INFO',
  'GET_USER_WALLET_TRANSACTIONS',
  'GET_LIST_ITEMS',
  'SIGN_FOREIGN_FEES',
];

export function setSessionPermissions(tabId, qapName, permissions) {
  try {
    const key = `${tabId}-${qapName}`;

    // Get existing permissions for this tab+app
    const existing = sessionPermissionsStore.get(key);
    const existingPermissions = existing?.permissions || [];

    // Validate new permissions
    const validPermissions = permissions.filter((permission) =>
      VALID_SESSION_PERMISSIONS.includes(permission)
    );

    // Merge with existing permissions (deduplicate using Set)
    const mergedPermissions = [
      ...new Set([...existingPermissions, ...validPermissions]),
    ];

    sessionPermissionsStore.set(key, {
      permissions: mergedPermissions,
      timestamp: Date.now(),
    });

    return mergedPermissions;
  } catch (error) {
    console.error('Error setting session permissions:', error);
    throw error;
  }
}

export function getSessionPermissions(tabId, qapName) {
  try {
    const key = `${tabId}-${qapName}`;
    const sessionData = sessionPermissionsStore.get(key);

    return sessionData?.permissions || [];
  } catch (error) {
    console.error('Error getting session permissions:', error);
    return [];
  }
}

export function hasSessionPermission(tabId, qapName, requestType) {
  try {
    const permissions = getSessionPermissions(tabId, qapName);
    return permissions.includes(requestType);
  } catch (error) {
    console.error('Error checking session permission:', error);
    return false;
  }
}

export function clearSessionPermissions(tabId, qapName) {
  try {
    const key = `${tabId}-${qapName}`;
    sessionPermissionsStore.delete(key);
  } catch (error) {
    console.error('Error clearing session permissions:', error);
    throw error;
  }
}

export function clearAllSessionPermissions() {
  try {
    sessionPermissionsStore.clear();
  } catch (error) {
    console.error('Error clearing all session permissions:', error);
    throw error;
  }
}

export function clearSessionPermissionsByTabId(tabId) {
  try {
    // Find all keys that start with this tabId and remove them
    const keysToDelete = [];
    for (const key of sessionPermissionsStore.keys()) {
      if (key.startsWith(`${tabId}-`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => sessionPermissionsStore.delete(key));
  } catch (error) {
    console.error('Error clearing session permissions by tabId:', error);
    throw error;
  }
}


  // TODO: GET_FRIENDS_LIST
  // NOT SURE IF TO IMPLEMENT: LINK_TO_QDN_RESOURCE, QDN_RESOURCE_DISPLAYED, SET_TAB_NOTIFICATIONS
  
chrome?.runtime?.onMessage.addListener((request, sender, sendResponse) => {
  if (request) {
    const isFromExtension = request?.isExtension
    const appInfo = request?.appInfo;
    const skipAuth = request?.skipAuth
    switch (request.action) {
      case "GET_USER_ACCOUNT": {
        getUserAccount({isFromExtension, appInfo, skipAuth})
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: "Unable to get user account" });
          });

        break;
      }
      case "ENCRYPT_DATA": {
        const data = request.payload;
        
        encryptData(data, sender)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "WHICH_UI": {
        
        sendResponse('EXTENSION');

        break;
      }
     
      case "DECRYPT_DATA": {
        const data = request.payload;
        
        decryptData(data)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "GET_LIST_ITEMS": {
        const data = request.payload;
        
        getListItems(data, appInfo, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "ADD_LIST_ITEMS": {
        const data = request.payload;
        
        addListItems(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "DELETE_LIST_ITEM": {
        const data = request.payload;
        
        deleteListItems(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "PUBLISH_QDN_RESOURCE": {
        const data = request.payload;
        
        publishQDNResource(data, sender, isFromExtension, appInfo)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "PUBLISH_MULTIPLE_QDN_RESOURCES": {
        const data = request.payload;
        
        publishMultipleQDNResources(data, sender, isFromExtension, appInfo)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "VOTE_ON_POLL": {
        const data = request.payload;
        
        voteOnPoll(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "CREATE_POLL": {
        const data = request.payload;
        
        createPoll(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "SEND_CHAT_MESSAGE": {
        const data = request.payload;
        sendChatMessage(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "JOIN_GROUP": {
        const data = request.payload;
      
        joinGroup(data, isFromExtension, appInfo)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "SAVE_FILE": {
        const data = request.payload;
      
        saveFile(data, sender, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "DEPLOY_AT": {
        const data = request.payload;
      
        deployAt(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "GET_USER_WALLET": {
        const data = request.payload;
      
        getUserWallet(data, isFromExtension, appInfo)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "GET_WALLET_BALANCE": {
        const data = request.payload;
      
        getWalletBalance(data, false, isFromExtension, appInfo)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }

      case "GET_USER_WALLET_INFO": {
        const data = request.payload;
      
        getUserWalletInfo(data, isFromExtension, appInfo)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "GET_CROSSCHAIN_SERVER_INFO": {
        const data = request.payload;
      
        getCrossChainServerInfo(data)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "GET_TX_ACTIVITY_SUMMARY": {
        const data = request.payload;
    
        getTxActivitySummary(data)
            .then((res) => {
                sendResponse(res);
            })
            .catch((error) => {
                sendResponse({ error: error.message });
            });
    
        break;
    }
    
    case "GET_FOREIGN_FEE": {
        const data = request.payload;
    
        getForeignFee(data)
            .then((res) => {
                sendResponse(res);
            })
            .catch((error) => {
                sendResponse({ error: error.message });
            });
    
        break;
    }
    
    case "UPDATE_FOREIGN_FEE": {
        const data = request.payload;
    
        updateForeignFee(data, isFromExtension, appInfo)
            .then((res) => {
                sendResponse(res);
            })
            .catch((error) => {
                sendResponse({ error: error.message });
            });
    
        break;
    }
    
    case "GET_SERVER_CONNECTION_HISTORY": {
        const data = request.payload;
    
        getServerConnectionHistory(data)
            .then((res) => {
                sendResponse(res);
            })
            .catch((error) => {
                sendResponse({ error: error.message });
            });
    
        break;
    }
    
    case "SET_CURRENT_FOREIGN_SERVER": {
        const data = request.payload;
    
        setCurrentForeignServer(data, isFromExtension, appInfo)
            .then((res) => {
                sendResponse(res);
            })
            .catch((error) => {
                sendResponse({ error: error.message });
            });
    
        break;
    }
    
    case "ADD_FOREIGN_SERVER": {
        const data = request.payload;
    
        addForeignServer(data, isFromExtension, appInfo)
            .then((res) => {
                sendResponse(res);
            })
            .catch((error) => {
                sendResponse({ error: error.message });
            });
    
        break;
    }
    
    case "REMOVE_FOREIGN_SERVER": {
        const data = request.payload;
    
        removeForeignServer(data, isFromExtension, appInfo)
            .then((res) => {
                sendResponse(res);
            })
            .catch((error) => {
                sendResponse({ error: error.message });
            });
    
        break;
    }
    
    case "GET_DAY_SUMMARY": {
        const data = request.payload;
    
        getDaySummary(data)
            .then((res) => {
                sendResponse(res);
            })
            .catch((error) => {
                sendResponse({ error: error.message });
            });
    
        break;
    }
    
      case "SEND_COIN": {
        const data = request.payload;
      
        sendCoin(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "CREATE_TRADE_BUY_ORDER": {
        const data = request.payload;

      
          createBuyOrder(data, isFromExtension).then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }

      case "CREATE_TRADE_SELL_ORDER": {
        const data = request.payload;
        createSellOrder(data, isFromExtension).then((res) => {
          sendResponse(res);
        })
        .catch((error) => {
          sendResponse({ error: error.message });
        });

        break;
      }

      case "CANCEL_TRADE_SELL_ORDER": {
        const data = request.payload;
        cancelSellOrder(data, isFromExtension).then((res) => {
          sendResponse(res);
        })
        .catch((error) => {
          sendResponse({ error: error.message });
        });
       
        break;
      }
      case "IS_USING_PUBLIC_NODE": {
        isRunningGateway().then((res) => {
          sendResponse(res);
        })
        .catch((error) => {
          sendResponse({ error: 'unable to determine if using gateway' });
        });
        break;
      }

      case "ADMIN_ACTION": {
        const data = request.payload;

        adminAction(data, isFromExtension).then((res) => {
          sendResponse(res);
        })
        .catch((error) => {
          sendResponse({ error: error?.message });
        });

        break;
      }

      case "SIGN_TRANSACTION": {
        const data = request.payload;

        signTransaction(data, isFromExtension).then((res) => {
          sendResponse(res);
        })
        .catch((error) => {
          sendResponse({ error: error?.message });
        });

        break;
      }

      case "DECRYPT_QORTAL_GROUP_DATA": {
        const data = request.payload;

        decryptQortalGroupData(data, isFromExtension).then((res) => {
          sendResponse(res);
        })
        .catch((error) => {
          sendResponse({ error: error?.message });
        });

        break;
      }

      case "ENCRYPT_DATA_WITH_SHARING_KEY": {
        const data = request.payload;

        encryptDataWithSharingKey(data, isFromExtension).then((res) => {
          sendResponse(res);
        })
        .catch((error) => {
          sendResponse({ error: error?.message });
        });

        break;
      }
      case "DECRYPT_DATA_WITH_SHARING_KEY": {
        const data = request.payload;

        decryptDataWithSharingKey(data, isFromExtension).then((res) => {
          sendResponse(res);
        })
        .catch((error) => {
          sendResponse({ error: error?.message });
        });

        break;
      }
      case "ENCRYPT_QORTAL_GROUP_DATA": {
        const data = request.payload;

        encryptQortalGroupData(data, isFromExtension).then((res) => {
          sendResponse(res);
        })
        .catch((error) => {
          sendResponse({ error: error?.message });
        });

        break;
      }

      case "DELETE_HOSTED_DATA": {
        const data = request.payload;
      
        deleteHostedData(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }

      case "GET_HOSTED_DATA": {
        const data = request.payload;
      
        getHostedData(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });

        break;
      }
      case "SHOW_ACTIONS" : {
        sendResponse(listOfAllQortalRequests)
        break;
      }

      case "REGISTER_NAME" : {
        const data = request.payload;
      
        registerNameRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "UPDATE_NAME" : {
        const data = request.payload;
      
        updateNameRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }

      case "LEAVE_GROUP" : {
        const data = request.payload;
      
        leaveGroupRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "INVITE_TO_GROUP" : {
        const data = request.payload;
      
        inviteToGroupRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "KICK_FROM_GROUP" : {
        const data = request.payload;
      
        kickFromGroupRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "CANCEL_GROUP_BAN" : {
        const data = request.payload;
      
        cancelGroupBanRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "ADD_GROUP_ADMIN" : {
        const data = request.payload;
      
        addGroupAdminRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "REMOVE_GROUP_ADMIN" : {
        const data = request.payload;
      
        removeGroupAdminRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "CANCEL_GROUP_INVITE" : {
        const data = request.payload;
      
        cancelGroupInviteRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "DECRYPT_AESGCM" : {
        const data = request.payload;
      
        decryptAESGCMRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "CREATE_GROUP" : {
        const data = request.payload;
      
        createGroupRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }

      case "GET_USER_WALLET_TRANSACTIONS" : {
        const data = request.payload;
      
        getUserWalletTransactions(data, isFromExtension, appInfo)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }

      case "GET_NODE_INFO" : {
      
        getNodeInfo()
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "GET_NODE_STATUS" : {
      
        getNodeStatus()
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "GET_ARRR_SYNC_STATUS" : {
      
        getArrrSyncStatus()
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }

      case "UPDATE_GROUP" : {
        const data = request.payload;
      
        updateGroupRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "BUY_NAME" : {
        const data = request.payload;
      
        buyNameRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "SELL_NAME" : {
        const data = request.payload;
      
        sellNameRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "CANCEL_SELL_NAME" : {
        const data = request.payload;
      
        cancelSellNameRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "MULTI_ASSET_PAYMENT_WITH_PRIVATE_DATA": {
        const data = request.payload;
      
        multiPaymentWithPrivateData(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      
      case "TRANSFER_ASSET": {
        const data = request.payload;
      
        transferAssetRequest(data, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      
      case "SIGN_FOREIGN_FEES": {
        const data = request.payload;
      
        signForeignFees(data, appInfo, isFromExtension)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
        case "SESSION_PERMISSIONS": {
        const data = request.payload;
      
        sessionPermissions(data,  isFromExtension, appInfo)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
      case "GET_PRIMARY_NAME": {
        const data = request.payload;
      
        getNameInfoForOthers(data?.address)
          .then((res) => {
            const resData = res ? res : "";
            sendResponse(resData);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }

       case "REENCRYPT_GROUP_KEYS": {
        const data = request.payload;
      
        reEncryptQortalKeys(data,  isFromExtension, appInfo)
          .then((res) => {
            sendResponse(res);
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        break;
      }
     
    }
  }
  return true;
});
