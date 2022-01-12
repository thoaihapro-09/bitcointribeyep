import { call, put, select } from 'redux-saga/effects'
import { createWatcher } from '../utils/utilities'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DeviceInfo from 'react-native-device-info'
import * as Cipher from '../../common/encryption'
import * as SecureStore from '../../storage/secure-store'
import {
  SETUP_WALLET,
  CREDS_AUTH,
  STORE_CREDS,
  credsStored,
  credsAuthenticated,
  switchSetupLoader,
  switchReLogin,
  INIT_RECOVERY,
  CHANGE_AUTH_CRED,
  RESET_PIN,
  credsChanged,
  pinChangedFailed,
  initializeRecoveryCompleted,
  completedWalletSetup,
  WALLET_SETUP_COMPLETION,
  updateApplication,
  UPDATE_APPLICATION,
  RESET_ENC_PASSWORD,
} from '../actions/setupAndAuth'
import { keyFetched, updateWallet } from '../actions/storage'
import config from '../../bitcoin/HexaConfig'
import { initializeHealthSetup, updateWalletImageHealth } from '../actions/BHR'
import { updateCloudData } from '../actions/cloud'
import { updateCloudBackupWorker } from '../sagas/cloud'
import dbManager from '../../storage/realm/dbManager'
import { setWalletId } from '../actions/preferences'
import { AccountType, ContactInfo, Trusted_Contacts, UnecryptedStreamData, UnecryptedStreams, Wallet } from '../../bitcoin/utilities/Interface'
import * as bip39 from 'bip39'
import crypto from 'crypto'
import { addNewAccountShellsWorker, newAccountsInfo } from './accounts'
import { newAccountShellCreationCompleted, updateAccountSettings } from '../actions/accounts'
import TrustedContactsOperations from '../../bitcoin/utilities/TrustedContactsOperations'
import { PermanentChannelsSyncKind, syncPermanentChannels } from '../actions/trustedContacts'
import AccountVisibility from '../../common/data/enums/AccountVisibility'
import AccountShell from '../../common/data/models/AccountShell'
import semver from 'semver'
import semverLte from 'semver/functions/lte'
import { accountVisibilityResetter, testAccountEnabler } from './upgrades'


function* setupWalletWorker( { payload } ) {
  const { walletName, security }: { walletName: string, security: { questionId: string, question: string, answer: string } } = payload
  const primaryMnemonic = bip39.generateMnemonic( 256 )
  const primarySeed = bip39.mnemonicToSeedSync( primaryMnemonic )
  const walletId = crypto.createHash( 'sha256' ).update( primarySeed ).digest( 'hex' )

  const wallet: Wallet = {
    walletId,
    walletName,
    userName: walletName,
    security,
    primaryMnemonic,
    primarySeed: primarySeed.toString( 'hex' ),
    accounts: {
    },
    version: DeviceInfo.getVersion()
  }

  yield put( updateWallet( wallet ) )
  yield put ( setWalletId( ( wallet as Wallet ).walletId ) )
  yield call( dbManager.createWallet, wallet )
  // prepare default accounts for the wallet
  const accountsInfo: newAccountsInfo[] = [];
  [ AccountType.TEST_ACCOUNT, AccountType.CHECKING_ACCOUNT, AccountType.SWAN_ACCOUNT, AccountType.SAVINGS_ACCOUNT ].forEach( ( accountType ) => {
    const accountInfo: newAccountsInfo = {
      accountType
    }
    accountsInfo.push( accountInfo )
  } )

  yield call( addNewAccountShellsWorker, {
    payload: accountsInfo
  } )
  yield put( newAccountShellCreationCompleted() )
  if( security ) yield put( initializeHealthSetup() )  // initialize health-check schema on relay
  yield put( completedWalletSetup( ) )
}

export const setupWalletWatcher = createWatcher( setupWalletWorker, SETUP_WALLET )

function* credentialsStorageWorker( { payload } ) {
  yield put( switchSetupLoader( 'storingCreds' ) )

  //hash the pin
  const hash = yield call( Cipher.hash, payload.passcode )

  //generate an AES key and ecnrypt it with
  const AES_KEY = yield call( Cipher.generateKey )
  const encryptedKey = yield call( Cipher.encrypt, AES_KEY, hash )
  const uint8array =  yield call( Cipher.stringToArrayBuffer, AES_KEY )
  yield call( dbManager.initDb, uint8array )
  //store the AES key against the hash
  if ( !( yield call( SecureStore.store, hash, encryptedKey ) ) ) {
    yield call( AsyncStorage.setItem, 'hasCreds', 'false' )
    return
  }

  yield put( keyFetched( AES_KEY ) )
  yield call( AsyncStorage.setItem, 'hasCreds', 'true' )
  yield put( credsStored() )
}

export const credentialStorageWatcher = createWatcher(
  credentialsStorageWorker,
  STORE_CREDS,
)

function* resetPasswordWorker( { payload } ) {
  const wallet: Wallet = yield select( state => state.storage.wallet )
  console.log( wallet )
  yield put( updateWallet( {
    ...wallet,
    security: payload
  } ) )
  yield call( dbManager.updateWallet, {
    ...wallet,
    security: payload
  } )
  yield call( updateCloudBackupWorker )
  const levelHealth: LevelHealthInterface[] = yield select( ( state ) => state.bhr.levelHealth )
}

export const resetPasswordWatcher = createWatcher(
  resetPasswordWorker,
  RESET_ENC_PASSWORD,
)

function* credentialsAuthWorker( { payload } ) {
  console.log( payload.passcode )
  console.clear()
  // let t = timer('credentialsAuthWorker')
  yield put( switchSetupLoader( 'authenticating' ) )
  let key
  try {
    const hash = yield call( Cipher.hash, payload.passcode )
    console.log( 'hash', hash )

    const encryptedKey = yield call( SecureStore.fetch, hash )
    console.log( 'encryptedKey', encryptedKey )

    key = yield call( Cipher.decrypt, encryptedKey, hash )
    console.log( 'key', key )

    const uint8array =  yield call( Cipher.stringToArrayBuffer, key )
    yield call( dbManager.initDb, uint8array )
  } catch ( err ) {
    console.log( 'err', err )

    if ( payload.reLogin ) yield put( switchReLogin( false ) )
    else yield put( credsAuthenticated( false ) )
    return
  }
  if ( !key ) throw new Error( 'Key missing' )

  if ( payload.reLogin ) {
    yield put( switchReLogin( true ) )
  } else {
    yield put( credsAuthenticated( true ) )
    // t.stop()
    yield put( keyFetched( key ) )

    // check if the app has been upgraded
    const wallet: Wallet = yield select( state => state.storage.wallet )
    const storedVersion = wallet.version
    const currentVersion = DeviceInfo.getVersion()
    if( currentVersion !== storedVersion ) yield put( updateApplication( currentVersion, storedVersion ) )

    // initialize configuration file
    const { activePersonalNode } = yield select( state => state.nodeSettings )
    if( activePersonalNode ) config.connectToPersonalNode( activePersonalNode )
  }
}

export const credentialsAuthWatcher = createWatcher(
  credentialsAuthWorker,
  CREDS_AUTH,
)

function* changeAuthCredWorker( { payload } ) {
  const { oldPasscode, newPasscode } = payload

  try {
    // verify old pin
    const oldHash = yield call( Cipher.hash, oldPasscode )
    const oldEncryptedKey = yield call( SecureStore.fetch, oldHash )
    const oldKey = yield call( Cipher.decrypt, oldEncryptedKey, oldHash )
    const key = yield select( ( state ) => state.storage.key )
    if ( oldKey !== key ) {
      throw new Error( 'Incorrect Pin' )
    }

    // setup new pin
    const newHash = yield call( Cipher.hash, newPasscode )
    const encryptedKey = yield call( Cipher.encrypt, key, newHash )

    //store the AES key against the hash
    if ( !( yield call( SecureStore.store, newHash, encryptedKey ) ) ) {
      throw new Error( 'Unable to access secure store' )
    }
    yield put( credsChanged( 'changed' ) )
  } catch ( err ) {
    console.log( {
      err
    } )
    yield put( pinChangedFailed( true ) )
    // Alert.alert('Pin change failed!', err.message);
    yield put( credsChanged( 'not-changed' ) )
  }
}

function* resetPinWorker( { payload } ) {
  const { newPasscode } = payload
  try {
    const key = yield select( ( state ) => state.storage.key )
    // setup new pin
    const newHash = yield call( Cipher.hash, newPasscode )
    const encryptedKey = yield call( Cipher.encrypt, key, newHash )

    //store the AES key against the hash
    if ( !( yield call( SecureStore.store, newHash, encryptedKey ) ) ) {
      throw new Error( 'Unable to access secure store' )
    }
    yield put( credsChanged( 'changed' ) )
  } catch ( err ) {
    console.log( {
      err
    } )
    yield put( pinChangedFailed( true ) )
    // Alert.alert('Pin change failed!', err.message);
    yield put( credsChanged( 'not-changed' ) )
  }
}

export const resetPinCredWatcher = createWatcher(
  resetPinWorker,
  RESET_PIN,
)

export const changeAuthCredWatcher = createWatcher(
  changeAuthCredWorker,
  CHANGE_AUTH_CRED,
)


function* applicationUpdateWorker( { payload }: {payload: { newVersion: string, previousVersion: string }} ) {
  const { newVersion } = payload

  const wallet: Wallet = yield select( state => state.storage.wallet )
  const storedVersion = wallet.version


  if( semver.lt( storedVersion, '2.0.66' ) ) yield call( testAccountEnabler )
  if( semver.lt( storedVersion, '2.0.68' ) ) yield call( accountVisibilityResetter )

  // update wallet version
  yield put( updateWallet( {
    ...wallet,
    version: newVersion
  } ) )
  yield call( dbManager.updateWallet, {
    version: newVersion
  } )

  // update permanent channels w/ new version
  const trustedContacts: Trusted_Contacts = yield select( ( state ) => state.trustedContacts.contacts )
  const streamUpdates: UnecryptedStreamData = {
    streamId: TrustedContactsOperations.getStreamId( wallet.walletId ),
    metaData: {
      version: newVersion
    }
  }
  const channelUpdates = []
  for( const channelKey of Object.keys( trustedContacts ) ){
    if( !trustedContacts[ channelKey ].isActive ) continue
    const contactInfo: ContactInfo = {
      channelKey
    }
    const channelUpdate =  {
      contactInfo, streamUpdates
    }
    channelUpdates.push( channelUpdate )
  }

  yield put( syncPermanentChannels( {
    permanentChannelsSyncKind: PermanentChannelsSyncKind.SUPPLIED_CONTACTS,
    channelUpdates,
    metaSync: true
  } ) )
  yield put( updateWalletImageHealth( {
    updateVersion: true
  } ) )
}

export const applicationUpdateWatcher = createWatcher(
  applicationUpdateWorker,
  UPDATE_APPLICATION,
)
