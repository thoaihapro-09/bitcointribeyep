import { useEffect } from 'react'
import useSendingState from '../hooks/state-selectors/sending/UseSendingState'


export default function useAccountSendST2CompletionEffect( callbacks: {
  onSuccess?: ( txid: string | null ) => void;
  onFailure?: ( errorMessage: string | null ) => void;
} ) {
  const {
    sendST2: {
      txid,
      isSuccessful,
      hasFailed,
      failedErrorMessage,
    },
  } = useSendingState()

  useEffect( () => {
    if ( isSuccessful && callbacks.onSuccess ) {
      callbacks.onSuccess( txid )
    } else if ( hasFailed && callbacks.onFailure ) {
      callbacks.onFailure( failedErrorMessage )
    }
  }, [ hasFailed, isSuccessful ] )
}
