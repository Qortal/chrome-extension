import React, { useCallback,  useEffect,  useRef } from "react";




export const useBlockedAddresses = () => {
  const userBlockedRef = useRef({})
  const userNamesBlockedRef = useRef({})

  const getAllBlockedUsers = useCallback(()=> {

    return {
      names: userNamesBlockedRef.current,
      addresses: userBlockedRef.current
    }
  }, [])

  const isUserBlocked = useCallback((address, name)=> {
    try {
      if(!address) return false
      if(userBlockedRef.current[address]) return true
      return false

     
    } catch (error) {
        //error
    }
  }, [])

  useEffect(()=> {
    const fetchBlockedList = async ()=> {
      try {
      const response =  await new Promise((res, rej) => {
        chrome?.runtime?.sendMessage(
          {
            action: "listActions",
            payload: {
              type: 'get',
              listName: `blockedAddresses`,
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
        })
        const blockedUsers = {}
        response?.forEach((item)=> {
          blockedUsers[item] = true
        })
        userBlockedRef.current = blockedUsers
        const response2 =   await new Promise((res, rej) => {
          chrome?.runtime?.sendMessage(
            {
              action: "listActions",
              payload: {
                type: 'get',
                listName: `blockedNames`,
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
          })

        const blockedUsers2 = {}
        response2?.forEach((item)=> {
          blockedUsers2[item] = true
        })
        userNamesBlockedRef.current = blockedUsers2

        
      } catch (error) {
        console.error(error)
      }
    }
    fetchBlockedList()
  }, [])
  const removeBlockFromList = useCallback(async (address, name)=> {
    if(name){
      await new Promise((res, rej) => {
  
        chrome?.runtime?.sendMessage(
          {
            action: "listActions",
            payload: {
              type: 'remove',
              items:  [name] ,
              listName: 'blockedNames' 
            },
          },
          (response) => {
            if (response.error) {
              rej(response?.message);
              return;
            } else {
              const copyObject = {...userNamesBlockedRef.current}
              delete copyObject[name]
              userNamesBlockedRef.current = copyObject
            
          
            res(response);
            }
          }
        );
      })

      
    }

    if(address){
      await new Promise((res, rej) => {
        chrome?.runtime?.sendMessage(
          {
            action: "listActions",
            payload: {
              type: 'remove',
               items: [address],
            listName: 'blockedAddresses'
            },
          },
          (response) => {
            if (response.error) {
              rej(response?.message);
              return;
            } else {
              const copyObject = {...userBlockedRef.current}
              delete copyObject[address]
              userBlockedRef.current = copyObject
            
          
            res(response);
            }
          }
        );
      })
    }
 
    
  }, [])

  const addToBlockList = useCallback(async (address, name)=> {
    if(name){
      await new Promise((res, rej) => {


        chrome?.runtime?.sendMessage(
          {
            action: "listActions",
            payload: {
              type: 'add',
              items: [name],
              listName: 'blockedNames'
            },
          },
          (response) => {
            if (response.error) {
              rej(response?.message);
              return;
            } else {
              const copyObject = {...userNamesBlockedRef.current}
              copyObject[name] = true
               userNamesBlockedRef.current = copyObject
            
          
            res(response);
            }
          }
        );
      })
    }
    if(address){
      await new Promise((res, rej) => {
        chrome?.runtime?.sendMessage(
          {
            action: "listActions",
            payload: {
              type: 'add',
              items: [address],
              listName: 'blockedAddresses'
            },
          },
          (response) => {
            if (response.error) {
              rej(response?.message);
              return;
            } else {
              const copyObject = {...userBlockedRef.current}
              copyObject[address] = true
               userBlockedRef.current = copyObject
          
            res(response);
            }
          }
        );
      })

  
    }
   
  }, [])

  return {
    isUserBlocked,
    addToBlockList,
    removeBlockFromList,
    getAllBlockedUsers
  };
};
