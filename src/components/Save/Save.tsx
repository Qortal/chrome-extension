import React, { useContext, useMemo, useState } from 'react'
import { useRecoilState } from 'recoil';
import isEqual from 'lodash/isEqual'; // Import deep comparison utility
import { canSaveSettingToQdnAtom, oldPinnedAppsAtom, settingsLocalLastUpdatedAtom, settingsQDNLastUpdatedAtom, sortablePinnedAppsAtom } from '../../atoms/global';
import { ButtonBase } from '@mui/material';
import { objectToBase64 } from '../../qdn/encryption/group-encryption';
import { MyContext } from '../../App';
import { getFee } from '../../background';
import { CustomizedSnackbars } from '../Snackbar/Snackbar';
import { SaveIcon } from '../../assets/svgs/SaveIcon';
export const Save = () => {
    const [pinnedApps, setPinnedApps] = useRecoilState(sortablePinnedAppsAtom);
    const [settingsQdnLastUpdated, setSettingsQdnLastUpdated] = useRecoilState(settingsQDNLastUpdatedAtom);
    const [settingsLocalLastUpdated] = useRecoilState(settingsLocalLastUpdatedAtom);

    const [canSave] = useRecoilState(canSaveSettingToQdnAtom);
    const [openSnack, setOpenSnack] = useState(false);
    const [isLoading, setIsLoading] = useState(false)
  const [infoSnack, setInfoSnack] = useState(null);
  const [oldPinnedApps, setOldPinnedApps] =  useRecoilState(oldPinnedAppsAtom)
    console.log('oldpin', {oldPinnedApps, pinnedApps}, settingsQdnLastUpdated,  settingsLocalLastUpdated, settingsQdnLastUpdated < settingsLocalLastUpdated,)
    const { show } = useContext(MyContext);

    const hasChanged = useMemo(()=> {
      const newChanges = {
        sortablePinnedApps: pinnedApps.map((item)=> {
          return {
            name: item?.name,
            service: item?.service
          }
        })
      }
      const oldChanges = {
        sortablePinnedApps: oldPinnedApps.map((item)=> {
          return {
            name: item?.name,
            service: item?.service
          }
        })
      }
      console.log('!isEqual(oldChanges, newChanges)', !isEqual(oldChanges, newChanges))
      if(settingsQdnLastUpdated === -100) return false
        return !isEqual(oldChanges, newChanges) && settingsQdnLastUpdated < settingsLocalLastUpdated
    }, [oldPinnedApps, pinnedApps, settingsQdnLastUpdated,  settingsLocalLastUpdated])

    const saveToQdn = async ()=> {
      try {
        setIsLoading(true)
        const data64 = await objectToBase64({
          sortablePinnedApps: pinnedApps.map((item)=> {
            return {
              name: item?.name,
              service: item?.service
            }
          })
        })
        const encryptData = await new Promise((res, rej) => {
          chrome?.runtime?.sendMessage(
            {
              action: "ENCRYPT_DATA",
              type: "qortalRequest",
              payload: {
                data64
              },
            },
            (response) => {
              console.log("response", response);
              if (response.error) {
                rej(response?.message);
                return;
              } else {
                res(response);
                
              }
            }
          );
        });
        if(encryptData && !encryptData?.error){
          const fee = await getFee('ARBITRARY')

          await show({
            message: "Would you like to publish your settings to QDN (encrypted) ?" ,
            publishFee: fee.fee + ' QORT'
          })
         const response =  await new Promise((res, rej) => {
            chrome?.runtime?.sendMessage(
              {
                action: "publishOnQDN",
                payload: {
                  data: encryptData,
                  identifier: "ext_saved_settings",
                  service: 'DOCUMENT_PRIVATE'
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
          console.log('saved', response)
          if(response?.identifier){
            setOldPinnedApps(pinnedApps)
            setSettingsQdnLastUpdated(Date.now())
            setInfoSnack({
              type: "success",
              message:
                 "Sucessfully published to QDN",
            });
            setOpenSnack(true);
          }
        }
        console.log('save encryptedData', encryptData)
      } catch (error) {
        setInfoSnack({
          type: "error",
          message:
            error?.message || "Unable to save to QDN",
        });
        setOpenSnack(true);
      } finally {
        setIsLoading(false)
      }
    }
    console.log('settingsQdnLastUpdated', settingsQdnLastUpdated)
  return (
    <>
    <ButtonBase  onClick={saveToQdn} disabled={!hasChanged || !canSave || isLoading || settingsQdnLastUpdated === -100}>
      <SaveIcon
        color={settingsQdnLastUpdated === -100 ? '#8F8F91' : (hasChanged && !isLoading) ? '#5EB049' : '#8F8F91'}
       />
      </ButtonBase>
     <CustomizedSnackbars
        duration={3500}
        open={openSnack}
        setOpen={setOpenSnack}
        info={infoSnack}
        setInfo={setInfoSnack}
      />
    </>
    
  )
}