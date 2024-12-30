// @ts-nocheck

import { Buffer } from "buffer"
import Base58 from "../../deps/Base58"
import nacl from "../../deps/nacl-fast"
import utils from "../../utils/utils"
import {  createEndpoint, getBaseApi, getKeyPair } from "../../background";

export async function reusableGet(endpoint){
	const validApi = await getBaseApi();
  
	const response = await fetch(validApi + endpoint);
	const data = await response.json();
	return data
  }
  
  async function reusablePost(endpoint,  _body){
	// const validApi = await findUsableApi();
	const url = await createEndpoint(endpoint)
	const response = await fetch(url, {
	  method: 'POST',
	  headers: {
		  'Content-Type': 'application/json'
	  },
	  body: _body
  });
  let data 
  try {
	data = await response.clone().json()
  } catch (e) {
	data = await response.text()
  }
  return data
  }

// async function getKeyPair() {
// 	const res = await chrome.storage.local.get(["keyPair"]);
// 	if (res?.keyPair) {
// 	  return res.keyPair;
// 	} else {
// 	  throw new Error("Wallet not authenticated");
// 	}
//   }

export const publishData = async ({
	registeredName,
	file,
	service,
	identifier,
	uploadType,
	isBase64,
	filename,
	withFee,
	title,
	description,
	category,
	tag1,
	tag2,
	tag3,
	tag4,
	tag5,
	feeAmount
}: any) => {
	
	const validateName = async (receiverName: string) => {
		return await reusableGet(`/names/${receiverName}`) 
	}

	const convertBytesForSigning = async (transactionBytesBase58: string) => {
        return await reusablePost('/transactions/convert', transactionBytesBase58)
	}

	const getArbitraryFee = async () => {
		const timestamp = Date.now()

        let fee = await reusableGet(`/transactions/unitfee?txType=ARBITRARY&timestamp=${timestamp}`) 

		return {
			timestamp,
			fee: Number(fee),
			feeToShow: (Number(fee) / 1e8).toFixed(8)
		}
	}

    const signArbitraryWithFee = (arbitraryBytesBase58, arbitraryBytesForSigningBase58, keyPair) => {
        if (!arbitraryBytesBase58) {
            throw new Error('ArbitraryBytesBase58 not defined')
        }
    
        if (!keyPair) {
            throw new Error('keyPair not defined')
        }
    
        const arbitraryBytes = Base58.decode(arbitraryBytesBase58)
        const _arbitraryBytesBuffer = Object.keys(arbitraryBytes).map(function (key) { return arbitraryBytes[key]; })
        const arbitraryBytesBuffer = new Uint8Array(_arbitraryBytesBuffer)
        const arbitraryBytesForSigning = Base58.decode(arbitraryBytesForSigningBase58)
        const _arbitraryBytesForSigningBuffer = Object.keys(arbitraryBytesForSigning).map(function (key) { return arbitraryBytesForSigning[key]; })
        const arbitraryBytesForSigningBuffer = new Uint8Array(_arbitraryBytesForSigningBuffer)
        const signature = nacl.sign.detached(arbitraryBytesForSigningBuffer, keyPair.privateKey)
    
        return utils.appendBuffer(arbitraryBytesBuffer, signature)
    }

     const processTransactionVersion2 = async (bytes) => {

        return await reusablePost('/transactions/process?apiVersion=2', Base58.encode(bytes))
     } 

	const signAndProcessWithFee = async (transactionBytesBase58: string) => {
		let convertedBytesBase58 = await convertBytesForSigning(
			transactionBytesBase58
		)

		if (convertedBytesBase58.error) {
			throw new Error('Error when signing')
		}


        const resKeyPair = await getKeyPair()
        const parsedData = JSON.parse(resKeyPair)
        const uint8PrivateKey = Base58.decode(parsedData.privateKey);
        const uint8PublicKey = Base58.decode(parsedData.publicKey);
        const keyPair = {
          privateKey: uint8PrivateKey,
          publicKey: uint8PublicKey
        };

        let signedArbitraryBytes =  signArbitraryWithFee(transactionBytesBase58, convertedBytesBase58, keyPair)
        const response = await processTransactionVersion2(signedArbitraryBytes)

		let myResponse = { error: '' }

		if (response === false) {
			throw new Error('Error when signing')
		} else {
			myResponse = response
		}

		return myResponse
	}

	const validate = async () => {
		let validNameRes = await validateName(registeredName)

		if (validNameRes.error) {
			throw new Error('Name not found')
		}

		let fee = null

		if (withFee && feeAmount) {
			fee = feeAmount
		} else if (withFee) {
			const res = await getArbitraryFee()
			if (res.fee) {
				fee = res.fee
			} else {
				throw new Error('unable to get fee')
			}
		}
		
		let transactionBytes = await uploadData(registeredName, file, fee)
		if (!transactionBytes || transactionBytes.error) {
			throw new Error(transactionBytes?.message || 'Error when uploading')
		} else if (transactionBytes.includes('Error 500 Internal Server Error')) {
			throw new Error('Error when uploading')
		}

		let signAndProcessRes

		if (withFee) {
			signAndProcessRes = await signAndProcessWithFee(transactionBytes)
		}

		if (signAndProcessRes?.error) {
			throw new Error('Error when signing')
		}

		return signAndProcessRes
	}

	const uploadData = async (registeredName: string, file:any, fee: number) => {

			let postBody = ''
			let urlSuffix = ''

			if (file != null) {
				// If we're sending zipped data, make sure to use the /zip version of the POST /arbitrary/* API
				if (uploadType === 'zip') {
					urlSuffix = '/zip'
				}

				// If we're sending file data, use the /base64 version of the POST /arbitrary/* API
				else if (uploadType === 'file') {
					urlSuffix = '/base64'
				}

				// Base64 encode the file to work around compatibility issues between javascript and java byte arrays
				if (isBase64) {
					postBody = file
				}

				if (!isBase64) {
					let fileBuffer = new Uint8Array(await file.arrayBuffer())
					postBody = Buffer.from(fileBuffer).toString("base64")
				}

			}
			
			let uploadDataUrl = `/arbitrary/${service}/${registeredName}${urlSuffix}`
			if (identifier?.trim().length > 0) {
				uploadDataUrl = `/arbitrary/${service}/${registeredName}/${identifier}${urlSuffix}`
			}
			
				uploadDataUrl = uploadDataUrl + `?fee=${fee}`
			

			if (filename != null && filename != 'undefined') {
				uploadDataUrl = uploadDataUrl + '&filename=' + encodeURIComponent(filename)
			}

			if (title != null && title != 'undefined') {
				uploadDataUrl = uploadDataUrl + '&title=' + encodeURIComponent(title)
			}

			if (description != null && description != 'undefined') {
				uploadDataUrl = uploadDataUrl + '&description=' + encodeURIComponent(description)
			}

			if (category != null && category != 'undefined') {
				uploadDataUrl = uploadDataUrl + '&category=' + encodeURIComponent(category)
			}

			if (tag1 != null && tag1 != 'undefined') {
				uploadDataUrl = uploadDataUrl + '&tags=' + encodeURIComponent(tag1)
			}

			if (tag2 != null && tag2 != 'undefined') {
				uploadDataUrl = uploadDataUrl + '&tags=' + encodeURIComponent(tag2)
			}

			if (tag3 != null && tag3 != 'undefined') {
				uploadDataUrl = uploadDataUrl + '&tags=' + encodeURIComponent(tag3)
			}

			if (tag4 != null && tag4 != 'undefined') {
				uploadDataUrl = uploadDataUrl + '&tags=' + encodeURIComponent(tag4)
			}

			if (tag5 != null && tag5 != 'undefined') {
				uploadDataUrl = uploadDataUrl + '&tags=' + encodeURIComponent(tag5)
			}

            return await reusablePost(uploadDataUrl, postBody)
		
	}

	try {
		return await validate()
	} catch (error: any) {
		throw new Error(error?.message)
	}
}