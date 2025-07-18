import { getBaseApi, getKeyPair } from "../background";
import { createSymmetricKeyAndNonce, decryptGroupData, encryptDataGroup, objectToBase64 } from "../qdn/encryption/group-encryption";
import { publishData } from "../qdn/publish/pubish";
import { RequestQueueWithPromise } from "../utils/queue/queue";

const apiEndpoints = [
    "https://api.qortal.org",
    "https://api2.qortal.org",
    "https://appnode.qortal.org",
    "https://apinode.qortalnodes.live",
    "https://apinode1.qortalnodes.live",
    "https://apinode2.qortalnodes.live",
    "https://apinode3.qortalnodes.live",
    "https://apinode4.qortalnodes.live",
];

export const requestQueueGetPublicKeys = new RequestQueueWithPromise(10);

async function findUsableApi() {
    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(`${endpoint}/admin/status`);
        if (!response.ok) throw new Error("Failed to fetch");
  
        const data = await response.json();
        if (data.isSynchronizing === false && data.syncPercent === 100) {
          console.log(`Usable API found: ${endpoint}`);
          return endpoint;
        } else {
          console.log(`API not ready: ${endpoint}`);
        }
      } catch (error) {
        console.error(`Error checking API ${endpoint}:`, error);
      }
    }
  
    throw new Error("No usable API found");
  }


async function getSaveWallet() {
    const res = await chrome.storage.local.get(["walletInfo"]);
    if (res?.walletInfo) {
      return res.walletInfo;
    } else {
      throw new Error("No wallet saved");
    }
  }
  export async function getNameInfo() {
    const wallet = await getSaveWallet();
    const address = wallet.address0;
    const validApi = await getBaseApi();
    const response = await fetch(validApi + '/names/primary/' + address);
    const nameData = await response.json();
    if (nameData?.name) {
      return nameData?.name;
    } else {
      return '';
    }
  }

  export async function getAllUserNames() {
    const wallet = await getSaveWallet();
    const address = wallet.address0;
    const validApi = await getBaseApi();
    const response = await fetch(validApi + '/names/address/' + address);
    const nameData = await response.json();
    return nameData.map((item) => item.name);
  }

// async function getKeyPair() {
//     const res = await chrome.storage.local.get(["keyPair"]);
//     if (res?.keyPair) {
//       return res.keyPair;
//     } else {
//       throw new Error("Wallet not authenticated");
//     }
//   }
const getPublicKeys = async (groupNumber: number) => {
  const validApi = await getBaseApi();
  const response = await fetch(`${validApi}/groups/members/${groupNumber}?limit=0`);
  const groupData = await response.json();

  if (groupData && Array.isArray(groupData.members)) {
    // Use the request queue for fetching public keys
    const memberPromises = groupData.members
      .filter((member) => member.member)
      .map((member) =>
        requestQueueGetPublicKeys.enqueue(async () => {
          const resAddress = await fetch(`${validApi}/addresses/${member.member}`);
          const resData = await resAddress.json();
          return resData.publicKey;
        })
      );

    const members = await Promise.all(memberPromises);
    return members;
  }

  return [];
};

export const getPublicKeysByAddress = async (admins: string[]) => {
  const validApi = await getBaseApi();

  if (Array.isArray(admins)) {
    // Use the request queue to limit concurrent fetches
    const memberPromises = admins
      .filter((address) => address) // Ensure the address is valid
      .map((address) =>
        requestQueueGetPublicKeys.enqueue(async () => {
          const resAddress = await fetch(`${validApi}/addresses/${address}`);
          const resData = await resAddress.json();
          return resData.publicKey;
        })
      );

    const members = await Promise.all(memberPromises);
    return members;
  }

  return []; // Return empty array if admins is not an array
};
export const encryptAndPublishSymmetricKeyGroupChatForAdmins = async ({groupId, previousData, admins}: {
  groupId: number,
  previousData: Object,
}) => {
  try {
      let highestKey = 0
      if(previousData){
         highestKey = Math.max(...Object.keys((previousData || {})).filter(item=> !isNaN(+item)).map(Number));
  
      }
     
      const resKeyPair = await getKeyPair()
      const parsedData = JSON.parse(resKeyPair)

      const privateKey = parsedData.privateKey
      const userPublicKey = parsedData.publicKey
      const groupmemberPublicKeys = await getPublicKeysByAddress(admins.map((admin)=> admin.address))

    
      const symmetricKey = createSymmetricKeyAndNonce()
      const nextNumber = highestKey + 1
      const objectToSave = {
          ...previousData,
          [nextNumber]: symmetricKey
      }
  
      const symmetricKeyAndNonceBase64 = await objectToBase64(objectToSave)
     
      const encryptedData =  encryptDataGroup({
          data64: symmetricKeyAndNonceBase64,
          publicKeys: groupmemberPublicKeys,
          privateKey,
          userPublicKey
      })
      if(encryptedData){
          const registeredName = await getNameInfo()
          const data = await publishData({
              registeredName, data: encryptedData, service: 'DOCUMENT_PRIVATE', identifier: `admins-symmetric-qchat-group-${groupId}`, uploadType: 'base64', withFee: true
          })
          return {
            data,
            numberOfMembers: groupmemberPublicKeys.length
          }
          
      } else {
          throw new Error('Cannot encrypt content')
      }
  } catch (error: any) {
      throw new Error(error.message);
  }
}

export const encryptAndPublishSymmetricKeyGroupChat = async ({groupId, previousData}: {
    groupId: number,
    previousData: Object,
}) => {
    try {
      
        let highestKey = 0
        if(previousData){
           highestKey = Math.max(...Object.keys((previousData || {})).filter(item=> !isNaN(+item)).map(Number));
    
        }
       
        const resKeyPair = await getKeyPair()
        const parsedData = JSON.parse(resKeyPair)
        const privateKey = parsedData.privateKey
        const userPublicKey = parsedData.publicKey
        const groupmemberPublicKeys = await getPublicKeys(groupId)
        const symmetricKey = createSymmetricKeyAndNonce()
        const nextNumber = highestKey + 1
        const objectToSave = {
            ...previousData,
            [nextNumber]: symmetricKey
        }
    
        const symmetricKeyAndNonceBase64 = await objectToBase64(objectToSave)
        
        const encryptedData =  encryptDataGroup({
            data64: symmetricKeyAndNonceBase64,
            publicKeys: groupmemberPublicKeys,
            privateKey,
            userPublicKey
        })
        if(encryptedData){
            const registeredName = await getNameInfo()
            const data = await publishData({
                registeredName, data: encryptedData, service: 'DOCUMENT_PRIVATE', identifier: `symmetric-qchat-group-${groupId}`, uploadType: 'base64',  withFee: true
            })
            return {
              data,
              numberOfMembers: groupmemberPublicKeys.length
            }
            
        } else {
            throw new Error('Cannot encrypt content')
        }
    } catch (error: any) {
        throw new Error(error.message);
    }
}
export const publishGroupEncryptedResource = async ({encryptedData, identifier}) => {
  try {
  
      if(encryptedData && identifier){
          const registeredName = await getNameInfo()
          if(!registeredName) throw new Error('You need a name to publish')
          const data = await publishData({
              registeredName, data: encryptedData, service: 'DOCUMENT', identifier, uploadType: 'base64',  withFee: true
          })
          return data
          
      } else {
          throw new Error('Cannot encrypt content')
      }
  } catch (error: any) {
      throw new Error(error.message);
  }
}
export const publishOnQDN = async ({data,  name = "", identifier, service, title,
	description,
	category,
	tag1,
	tag2,
	tag3,
	tag4,
	tag5,
  uploadType
}) => {

      if(data &&  service){
          const registeredName = name || await getNameInfo()
          if(!registeredName) throw new Error('You need a name to publish')
         
            const res = await publishData({
              registeredName, data: data, service, identifier, uploadType,  withFee: true, title,
              description,
              category,
              tag1,
              tag2,
              tag3,
              tag4,
              tag5
          })
          return res

        
          
      } else {
          throw new Error('Cannot publish content')
      }

}

export function uint8ArrayToBase64(uint8Array: any) {
	const length = uint8Array.length
	let binaryString = ''
	const chunkSize = 1024 * 1024; // Process 1MB at a time
	for (let i = 0; i < length; i += chunkSize) {
		const chunkEnd = Math.min(i + chunkSize, length)
		const chunk = uint8Array.subarray(i, chunkEnd)

        // @ts-ignore
		binaryString += Array.from(chunk, byte => String.fromCharCode(byte)).join('')
	}
	return btoa(binaryString)
}

export function base64ToUint8Array(base64: string) {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    return bytes
  }

export const decryptGroupEncryption = async ({data}: {
    data: string
}) => {
    try {
        const resKeyPair = await getKeyPair()
        const parsedData = JSON.parse(resKeyPair)
        const privateKey = parsedData.privateKey
        const encryptedData =  decryptGroupData(
            data,
            privateKey,
        )
       return {
        data: uint8ArrayToBase64(encryptedData.decryptedData),
        count: encryptedData.count
       }
    } catch (error: any) {
        throw new Error(error.message);
    }
}

export function uint8ArrayToObject(uint8Array: any) {
	// Decode the byte array using TextDecoder
	const decoder = new TextDecoder()
	const jsonString = decoder.decode(uint8Array)
	// Convert the JSON string back into an object
	return JSON.parse(jsonString)
}