import { action, reaction, observable } from 'mobx'
import SettingsStore from './SettingsStore'
import RESTUtils from '../utils/ln/RESTUtils'

export default class BalanceStore {
    @observable public totalBlockchainBalance: number | string;
    @observable public confirmedBlockchainBalance: number | string;
    @observable public unconfirmedBlockchainBalance: number | string;
    @observable public loading = false;
    @observable public error = false;
    @observable public pendingOpenBalance: number | string;
    @observable public lightningBalance: number | string;
    settingsStore: SettingsStore;

    constructor( settingsStore: SettingsStore ) {
      this.settingsStore = settingsStore

      reaction(
        () => this.settingsStore.settings,
        () => {
          if ( this.settingsStore.hasCredentials() ) {
            this.getBlockchainBalance()
            this.getLightningBalance()
          }
        }
      )
    }

    reset = () => {
      this.resetLightningBalance()
      this.resetBlockchainBalance()
      this.error = false
    };

    resetBlockchainBalance = () => {
      this.unconfirmedBlockchainBalance = 0
      this.confirmedBlockchainBalance = 0
      this.totalBlockchainBalance = 0
    };

    resetLightningBalance = () => {
      this.pendingOpenBalance = 0
      this.lightningBalance = 0
    };

    balanceError = () => {
      this.error = true
      this.loading = false
    };

    @action
    public getBlockchainBalance = () => {
      this.loading = true
      this.resetBlockchainBalance()
      RESTUtils.getBlockchainBalance()
        .then( ( data: any ) => {
          this.unconfirmedBlockchainBalance = Number(
            data.unconfirmed_balance
          )
          this.confirmedBlockchainBalance = Number(
            data.confirmed_balance
          )
          this.totalBlockchainBalance = Number( data.total_balance )
          this.loading = false
        } )
        .catch( ( e ) => {
          console.log( 'getBlockchainBalance', e )

          this.balanceError()
        } )
    };

    @action
    public getLightningBalance = () => {
      this.loading = true
      this.resetLightningBalance()
      RESTUtils.getLightningBalance()
        .then( ( data: any ) => {
          this.pendingOpenBalance = Number( data.pending_open_balance )
          this.lightningBalance = Number( data.balance )
          this.loading = false
        } )
        .catch( () => {
          this.balanceError()
        } )
    };
}
