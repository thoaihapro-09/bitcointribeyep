import React, { useState, useEffect, useCallback, Component } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  SafeAreaView,
  StatusBar,
  BackHandler,
  Alert,
  ActivityIndicator,
  AsyncStorage,
} from 'react-native';
import Colors from '../../common/Colors';
import Fonts from '../../common/Fonts';
import { RFValue } from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ToggleSwitch from '../../components/ToggleSwitch';
import { nameToInitials } from '../../common/CommonFunctions';
import { useDispatch, useSelector } from 'react-redux';
import {
  transferST1,
  addTransferDetails,
  removeTransferDetails,
  clearTransfer,
} from '../../store/actions/accounts';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { UsNumberFormat } from '../../common/utilities';
import { ScrollView } from 'react-native-gesture-handler';
import BottomSheet from 'reanimated-bottom-sheet';
import DeviceInfo from 'react-native-device-info';
import ModalHeader from '../../components/ModalHeader';
import RemoveSelectedTransaction from './RemoveSelectedTrasaction';
import SendConfirmationContent from './SendConfirmationContent';
import {
  REGULAR_ACCOUNT,
  SECURE_ACCOUNT,
  TRUSTED_CONTACTS,
  TEST_ACCOUNT,
} from '../../common/constants/serviceTypes';
import { TrustedContactDerivativeAccount } from '../../bitcoin/utilities/Interface';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AccountSelectionModalContents from './AccountSelectionModalContents';
import SmallHeaderModal from '../../components/SmallHeaderModal';
import BottomInfoBox from '../../components/BottomInfoBox';
import Currencies from '../../common/Currencies';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getCurrencyImageByRegion } from '../../common/CommonFunctions/index';
import { getCurrencyImageName } from '../../common/CommonFunctions/index';
import config from '../../bitcoin/HexaConfig';
import { connect } from 'react-redux';
import { withNavigationFocus } from 'react-navigation';
import idx from 'idx';
import {setCurrencyToggleValue} from '../../store/actions/preferences';

const currencyCode = [
  'BRL',
  'CNY',
  'JPY',
  'GBP',
  'KRW',
  'RUB',
  'TRY',
  'INR',
  'EUR',
];

interface SendToContactPropsTypes {
  navigation: any;
  service: any;
  transfer: any;
  accounts: any;
  loading: any;
  transferST1: any;
  removeTransferDetails: any;
  clearTransfer: any;
  addTransferDetails: any;
  currencyCode: any;
  currencyToggleValue: any;
  setCurrencyToggleValue: any;
}

interface SendToContactStateTypes {
  RegularAccountBalance: any;
  SavingAccountBalance: any;
  isFromAddressBook: any;
  isOpen: boolean;
  exchangeRates: any[];
  selectedContact: any;
  serviceType: string;
  averageTxFees: any;
  spendableBalance: any;
  sweepSecure: any;
  removeItem: any;
  switchOn: boolean;
  CurrencyCode: string;
  CurrencySymbol: string;
  bitcoinAmount: string;
  currencyAmount: string;
  isConfirmDisabled: boolean;
  note: string;
  InputStyle: any;
  InputStyle1: any;
  InputStyleNote: any;
  isInvalidBalance: boolean;
  recipients: any[];
  spendableBalances: any;
}

class SendToContact extends Component<
  SendToContactPropsTypes,
  SendToContactStateTypes
> {
  constructor(props) {
    super(props);
    this.state = {
      RegularAccountBalance: 0,
      SavingAccountBalance: 0,
      isFromAddressBook: this.props.navigation.getParam('isFromAddressBook')
        ? this.props.navigation.getParam('isFromAddressBook')
        : null,
      isOpen: false,
      exchangeRates: [],
      selectedContact: this.props.navigation.getParam('selectedContact'),
      serviceType: this.props.navigation.getParam('serviceType'),
      averageTxFees: this.props.navigation.getParam('averageTxFees'),
      spendableBalance: this.props.navigation.getParam('spendableBalance'),
      sweepSecure: this.props.navigation.getParam('sweepSecure'),
      removeItem: {},
      switchOn: true,
      CurrencyCode: 'USD',
      CurrencySymbol: '$',
      bitcoinAmount: props.navigation.getParam('bitcoinAmount')
        ? props.navigation.getParam('bitcoinAmount')
        : '',
      currencyAmount: '',
      isConfirmDisabled: true,
      note: '',
      InputStyle: styles.textBoxView,
      InputStyle1: styles.textBoxView,
      InputStyleNote: styles.textBoxView,
      isInvalidBalance: false,
      recipients: [],
      spendableBalances: {
        testBalance: 0,
        regularBalance: 0,
        secureBalance: 0,
      },
    };
  }

  componentDidMount = () => {
    const { accounts } = this.props;
    const {
      bitcoinAmount,
      averageTxFees,
      serviceType,
      spendableBalance,
      spendableBalances,
    } = this.state;
    BackHandler.addEventListener('hardwareBackPress', () => {
      this.checkRecordsHavingPrice();
    });
    this.setState({ exchangeRates: accounts && accounts.exchangeRates });
    this.getBalances();
    this.setCurrencyCodeFromAsync();
    if (bitcoinAmount) this.convertBitCoinToCurrency(bitcoinAmount);
    if (!averageTxFees) this.storeAverageTxFees();

    if (serviceType == REGULAR_ACCOUNT) {
      this.setState({ RegularAccountBalance: spendableBalance });
    } else if (serviceType == SECURE_ACCOUNT) {
      this.setState({ SavingAccountBalance: spendableBalance });
    }

    this.updateSpendableBalance();

    this.amountCalculation();
  };

  updateSpendableBalance = () => {
    const { serviceType, spendableBalances } = this.state;
    if (serviceType === TEST_ACCOUNT) {
      this.setState({ spendableBalance: spendableBalances.testBalance });
    } else if (serviceType == REGULAR_ACCOUNT) {
      this.setState({ spendableBalance: spendableBalances.regularBalance });
    } else if (serviceType == SECURE_ACCOUNT) {
      this.setState({ spendableBalance: spendableBalances.secureBalance });
    }
  };

  componentDidUpdate = (prevProps, prevState) => {
    if (prevProps.accounts !== this.props.accounts) {
      this.getBalances();
    }

    if (
      prevProps.service[this.state.serviceType].service !==
      this.props.service[this.state.serviceType].service
    ) {
      this.storeAverageTxFees();
    }

    if (prevState.spendableBalance !== this.state.spendableBalance) {
      if (this.state.serviceType == REGULAR_ACCOUNT) {
        this.setState({ RegularAccountBalance: this.state.spendableBalance });
      } else if (this.state.serviceType == SECURE_ACCOUNT) {
        this.setState({ SavingAccountBalance: this.state.spendableBalance });
      }
      this.updateSpendableBalance();
    }

    if (prevState.serviceType !== this.state.serviceType) {
      this.updateSpendableBalance();
    }

    if (
      prevProps.accounts.exchangeRates !== this.props.accounts.exchangeRates
    ) {
      this.setState({
        exchangeRates: this.props.accounts && this.props.accounts.exchangeRates,
      });
    }

    if (
      prevState.bitcoinAmount !== this.state.bitcoinAmount ||
      prevState.currencyAmount !== this.state.currencyAmount ||
      prevState.spendableBalance !== this.state.spendableBalance ||
      prevProps.transfer[this.state.serviceType].transfer.details.length !==
        this.props.transfer[this.state.serviceType].transfer.details.length
    ) {
      this.amountCalculation();
    }

    if (
      prevProps.transfer[this.state.serviceType].transfer !==
      this.props.transfer[this.state.serviceType].transfer
    ) {
      this.sendConfirmation();
    }
  };

  getBalances = () => {
    const { spendableBalance, serviceType } = this.state;
    const { accounts } = this.props;

    const testBalance = accounts[TEST_ACCOUNT].service
      ? accounts[TEST_ACCOUNT].service.hdWallet.balances.balance
      : // +  accounts[TEST_ACCOUNT].service.hdWallet.balances.unconfirmedBalance
        0;

    let regularBalance = accounts[REGULAR_ACCOUNT].service
      ? accounts[REGULAR_ACCOUNT].service.hdWallet.balances.balance
      : // +  accounts[REGULAR_ACCOUNT].service.hdWallet.balances.unconfirmedBalance
        0;

    // regular derivative accounts
    for (const dAccountType of Object.keys(config.DERIVATIVE_ACC)) {
      const derivativeAccount =
        accounts[REGULAR_ACCOUNT].service.hdWallet.derivativeAccounts[
          dAccountType
        ];
      if (derivativeAccount.instance.using) {
        for (
          let accountNumber = 1;
          accountNumber <= derivativeAccount.instance.using;
          accountNumber++
        ) {
          if (derivativeAccount[accountNumber].balances) {
            regularBalance += derivativeAccount[accountNumber].balances.balance;
            // + derivativeAccount[accountNumber].balances.unconfirmedBalance;
          }
        }
      }
    }

    let secureBalance = accounts[SECURE_ACCOUNT].service
      ? accounts[SECURE_ACCOUNT].service.secureHDWallet.balances.balance
      : // + accounts[SECURE_ACCOUNT].service.secureHDWallet.balances
        //      .unconfirmedBalance
        0;

    // secure derivative accounts
    for (const dAccountType of Object.keys(config.DERIVATIVE_ACC)) {
      if (dAccountType === TRUSTED_CONTACTS) continue;

      const derivativeAccount =
        accounts[SECURE_ACCOUNT].service.secureHDWallet.derivativeAccounts[
          dAccountType
        ];
      if (derivativeAccount.instance.using) {
        for (
          let accountNumber = 1;
          accountNumber <= derivativeAccount.instance.using;
          accountNumber++
        ) {
          // console.log({
          //   accountNumber,
          //   balances: trustedAccounts[accountNumber].balances,
          //   transactions: trustedAccounts[accountNumber].transactions,
          // });
          if (derivativeAccount[accountNumber].balances) {
            secureBalance += derivativeAccount[accountNumber].balances.balance;
            // +derivativeAccount[accountNumber].balances.unconfirmedBalance;
          }
        }
      }
    }
    this.setState({
      spendableBalances: {
        testBalance,
        regularBalance,
        secureBalance,
      },
    });
  };

  setCurrencyCodeFromAsync = async () => {
    let currencyToggleValueTmp = this.props.currencyToggleValue;
    // await AsyncStorage.getItem(
    //   'currencyToggleValue',
    // );
    let currencyCodeTmp = this.props.currencyCode; 
    //await AsyncStorage.getItem('currencyCode');
    this.setState({
      switchOn: currencyToggleValueTmp ? true : false,
      CurrencyCode: currencyCodeTmp ? currencyCodeTmp : 'USD',
    });
    for (let i = 0; i < Currencies.length; i++) {
      if (Currencies[i].code.includes(currencyCodeTmp)) {
        this.setState({ CurrencySymbol: Currencies[i].symbol });
      }
    }
  };

  checkRecordsHavingPrice = () => {
    const { transfer, removeTransferDetails } = this.props;
    const { serviceType, selectedContact } = this.state;
    if (
      transfer[serviceType].transfer.details &&
      transfer[serviceType].transfer.details.length
    ) {
      for (let i = 0; i < transfer[serviceType].transfer.details.length; i++) {
        if (
          !transfer[serviceType].transfer.details[
            i
          ].selectedContact.hasOwnProperty('bitcoinAmount') &&
          !transfer[serviceType].transfer.details[
            i
          ].selectedContact.hasOwnProperty('currencyAmount') &&
          selectedContact.id ==
            transfer[serviceType].transfer.details[i].selectedContact.id
        ) {
          removeTransferDetails(
            serviceType,
            transfer[serviceType].transfer.details[i],
          );
        }
      }
    }
  };

  convertBitCoinToCurrency = (value) => {
    const { switchOn, exchangeRates, CurrencyCode } = this.state;
    let temp = value;
    if (switchOn) {
      let result = exchangeRates
        ? ((value / 1e8) * exchangeRates[CurrencyCode].last).toFixed(2)
        : 0;
      this.setState({ bitcoinAmount: temp, currencyAmount: result.toString() });
    } else {
      let currency = exchangeRates
        ? value / exchangeRates[CurrencyCode].last
        : 0;
      currency = currency < 1 ? currency * 1e8 : currency;
      this.setState({
        currencyAmount: temp,
        bitcoinAmount: currency.toFixed(0),
      });
    }
  };

  storeAverageTxFees = async () => {
    const { service } = this.props;
    const { serviceType } = this.state;
    const storedAverageTxFees = await AsyncStorage.getItem(
      'storedAverageTxFees',
    );
    if (storedAverageTxFees) {
      const { averageTxFees, lastFetched } = JSON.parse(storedAverageTxFees);
      if (Date.now() - lastFetched < 1800000) {
        this.setState({ averageTxFees: averageTxFees });
        return;
      } // maintaining a half an hour difference b/w fetches
    }
    const instance =
      service[serviceType].service.hdWallet ||
      service[serviceType].service.secureHDWallet;
    const averageTxFees = await instance.averageTransactionFee();
    this.setState({ averageTxFees: averageTxFees });
    await AsyncStorage.setItem(
      'storedAverageTxFees',
      JSON.stringify({ averageTxFees, lastFetched: Date.now() }),
    );
  };

  amountCalculation = () => {
    const {
      bitcoinAmount,
      currencyAmount,
      serviceType,
      spendableBalance,
      selectedContact,
    } = this.state;
    const { transfer } = this.props;
    if (
      bitcoinAmount &&
      currencyAmount &&
      transfer[serviceType].transfer.details.length
    ) {
      let amountStacked = 0;
      transfer[serviceType].transfer.details.forEach((recipient) => {
        if (
          recipient.bitcoinAmount &&
          recipient.selectedContact.id !== selectedContact.id
        ) {
          amountStacked += parseInt(recipient.bitcoinAmount);
        }
      });
      if (spendableBalance - amountStacked < Number(bitcoinAmount)) {
        this.setState({ isInvalidBalance: true, isConfirmDisabled: true });
      } else this.setState({ isConfirmDisabled: false, isInvalidBalance: false });
    } else {
      this.setState({ isConfirmDisabled: true });
      if (!transfer[serviceType].transfer.details.length) {
        this.props.navigation.goBack();
      }
    }
  };

  sendConfirmation = () => {
    const {
      recipients,
      serviceType,
      sweepSecure,
      spendableBalance,
      averageTxFees,
    } = this.state;
    const { transfer } = this.props;
    if (!recipients.length) return;
    if (transfer[serviceType].transfer.stage1.failed) {
      this.setState({ isConfirmDisabled: false });
      setTimeout(() => {
      (this.refs.SendUnSuccessBottomSheet as any).snapTo(1);
      }, 2)
    } else if (transfer[serviceType].transfer.executed === 'ST1') {
      if (transfer[serviceType].transfer.details.length) {
        this.props.navigation.navigate('SendConfirmation', {
          serviceType,
          sweepSecure,
          spendableBalance,
          recipients,
          averageTxFees,
        });
      }
    }
  };

  handleTrasferST1 = () => {
    const {
      selectedContact,
      bitcoinAmount,
      currencyAmount,
      note,
      serviceType,
      averageTxFees,
    } = this.state;
    const { transfer, service, transferST1 } = this.props;

    const recipients = [];
    const currentRecipientInstance = {
      selectedContact,
      bitcoinAmount,
      currencyAmount,
      note,
    };

    const recipientsList = [];
    transfer[serviceType].transfer.details.forEach((instance) => {
      if (
        instance.bitcoinAmount &&
        instance.selectedContact.id !== selectedContact.id
      )
        recipientsList.push(instance);
    });
    recipientsList.push(currentRecipientInstance);
    const instance =
      service[serviceType].service.hdWallet ||
      service[serviceType].service.secureHDWallet;

    recipientsList.map((item) => {
      const recipientId = item.selectedContact.id;
      const isValidAddress = instance.isValidAddress(recipientId);
      if (isValidAddress) {
        // recipient: explicit address
        recipients.push({
          id: recipientId,
          address: recipientId,
          amount: parseInt(item.bitcoinAmount),
        });
      } else {
        if (recipientId === REGULAR_ACCOUNT || recipientId === SECURE_ACCOUNT) {
          // recipient: sibling account
          recipients.push({
            id: recipientId,
            address: null,
            amount: parseInt(item.bitcoinAmount),
          });
        } else {
          // recipient: trusted contact
          const contactName = `${item.selectedContact.firstName} ${
            item.selectedContact.lastName ? item.selectedContact.lastName : ''
          }`.toLowerCase();
          recipients.push({
            id: contactName,
            address: null,
            amount: parseInt(item.bitcoinAmount),
          });
        }
      }
    });
    this.setState({ recipients: recipients });
    transferST1(serviceType, recipients, averageTxFees);
  };

  onConfirm = () => {
    const {
      clearTransfer,
      transfer,
      removeTransferDetails,
      addTransferDetails,
    } = this.props;
    const { bitcoinAmount, currencyAmount, note } = this.state;
    const { serviceType, selectedContact } = this.state;
    clearTransfer(serviceType, 'stage1');
    this.setState({ isConfirmDisabled: false });
    if (
      transfer[serviceType].transfer.details &&
      transfer[serviceType].transfer.details.length
    ) {
      for (let i = 0; i < transfer[serviceType].transfer.details.length; i++) {
        if (
          transfer[serviceType].transfer.details[i].selectedContact.id ==
          selectedContact.id
        ) {
          removeTransferDetails(
            serviceType,
            transfer[serviceType].transfer.details[i],
          );
        }
      }
      addTransferDetails(serviceType, {
        selectedContact,
        bitcoinAmount,
        currencyAmount,
        note,
      });
    }
    setTimeout(() => {
      this.handleTrasferST1();
    }, 10);
  };

  getBalanceText = () => {
    const {
      serviceType,
      spendableBalance,
      RegularAccountBalance,
      SavingAccountBalance,
      switchOn,
      exchangeRates,
      CurrencyCode,
      spendableBalances,
    } = this.state;
    let balance = spendableBalance;
    if (serviceType == REGULAR_ACCOUNT) balance = RegularAccountBalance;
    if (serviceType == SECURE_ACCOUNT) balance = SavingAccountBalance;
    if (serviceType == REGULAR_ACCOUNT)
      balance = spendableBalances.regularBalance;
    if (serviceType == SECURE_ACCOUNT)
      balance = spendableBalances.secureBalance;

    return serviceType == TEST_ACCOUNT
      ? UsNumberFormat(balance)
      : switchOn
      ? UsNumberFormat(balance)
      : exchangeRates
      ? ((balance / 1e8) * exchangeRates[CurrencyCode].last).toFixed(2)
      : null;
  };

  render() {
    const {
      isFromAddressBook,
      isOpen,
      exchangeRates,
      selectedContact,
      serviceType,
      removeItem,
      switchOn,
      CurrencyCode,
      CurrencySymbol,
      bitcoinAmount,
      currencyAmount,
      isConfirmDisabled,
      note,
      InputStyle,
      InputStyle1,
      InputStyleNote,
      isInvalidBalance,
      recipients,
      spendableBalances,
    } = this.state;
    const {
      transfer,
      accounts,
      loading,
      transferST1,
      removeTransferDetails,
      clearTransfer,
      addTransferDetails,
    } = this.props;

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.white,
        }}
      >
        <SafeAreaView style={{ flex: 0 }} />
        <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
        <View style={styles.modalHeaderTitleView}>
          <View
            style={styles.view}
          >
            <TouchableOpacity
              onPress={() => {
                this.checkRecordsHavingPrice();
                this.props.navigation.goBack();
              }}
              style={styles.backArrow}
            >
              <FontAwesome
                name="long-arrow-left"
                color={Colors.blue}
                size={17}
              />
            </TouchableOpacity>
            <Image
              source={
                serviceType == TEST_ACCOUNT
                  ? require('../../assets/images/icons/icon_test.png')
                  : serviceType == REGULAR_ACCOUNT
                  ? require('../../assets/images/icons/icon_regular.png')
                  : require('../../assets/images/icons/icon_secureaccount.png')
              }
              style={{ width: wp('10%'), height: wp('10%') }}
            />
            <View style={{ marginLeft: wp('2.5%') }}>
              <Text style={styles.modalHeaderTitleText}>{'Send'}</Text>
              <Text
                style={styles.sendText}
              >
                {serviceType == TEST_ACCOUNT
                  ? 'Test Account'
                  : serviceType == REGULAR_ACCOUNT
                  ? 'Checking Account'
                  : 'Savings Account'}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={styles.availableToSpendView}
        >
          <TouchableOpacity
            activeOpacity={10}
            onPress={() => {
              if (isFromAddressBook)
                (this.refs.AccountSelectionBottomSheet as any).snapTo(1);
            }}
            style={{ flexDirection: 'row', alignItems: 'flex-end' }}
          >
            <Text
              style={{
                color: Colors.blue,
                fontSize: RFValue(12),
                fontFamily: Fonts.FiraSansItalic,
              }}
            >
              {serviceType == 'TEST_ACCOUNT'
                ? 'Test Account'
                : serviceType == 'SECURE_ACCOUNT'
                ? 'Savings Account'
                : serviceType == 'REGULAR_ACCOUNT'
                ? 'Checking Account'
                : serviceType == 'S3_SERVICE'
                ? 'S3 Service'
                : ''}
            </Text>
            <Text
              style={styles.availableToSpendText}
            >
              {' (Available to spend '}
              <Text
                style={styles.balanceText}
              >
                {this.getBalanceText()}
              </Text>
              <Text
                style={styles.textTsats}
              >
                {serviceType == TEST_ACCOUNT
                  ? ' t-sats )'
                  : switchOn
                  ? ' sats )'
                  : ' ' + CurrencyCode.toLocaleLowerCase() + ' )'}
              </Text>
            </Text>
            {isFromAddressBook && (
              <Ionicons
                style={{ marginLeft: 5 }}
                name={isOpen ? 'ios-arrow-up' : 'ios-arrow-down'}
                size={RFValue(15)}
                color={Colors.blue}
              />
            )}
          </TouchableOpacity>
        </View>
        <View style={{ width: wp('85%'), alignSelf: 'center' }}>
          {transfer[serviceType].transfer.details &&
          transfer[serviceType].transfer.details.length > 0 ? (
            <ScrollView horizontal={true}>
              {transfer[serviceType].transfer.details.map((item) => {
                //console.log('ITEM in list', item);
                return (
                  <View
                    style={styles.view1}
                  >
                    <View style={{ flexDirection: 'row' }}>
                      {item.selectedContact &&
                      item.selectedContact.account_name ? (
                        <Image
                          source={
                            item.selectedContact.account_name ===
                            'Checking Account'
                              ? require('../../assets/images/icons/icon_regular.png')
                              : item.selectedContact.account_name ===
                                'Savings Account'
                              ? require('../../assets/images/icons/icon_secureaccount.png')
                              : item.selectedContact.account_name ===
                                'Test Account'
                              ? require('../../assets/images/icons/icon_test_white.png')
                              : require('../../assets/images/icons/icon_user.png')
                          }
                          style={styles.circleShapeView}
                        />
                      ) : item.selectedContact.image ? (
                        <Image
                          source={item.selectedContact.image}
                          style={styles.circleShapeView}
                        />
                      ) : (
                        <View
                          style={{
                            ...styles.circleShapeView,
                            backgroundColor: Colors.shadowBlue,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {item.selectedContact &&
                          item.selectedContact.firstName ? (
                            <Text
                              style={{
                                textAlign: 'center',
                                fontSize: 13,
                                lineHeight: 13, //... One for top and one for bottom alignment
                              }}
                            >
                              {item && item.selectedContact
                                ? nameToInitials(
                                    item.selectedContact.firstName &&
                                      item.selectedContact.lastName
                                      ? item.selectedContact.firstName +
                                          ' ' +
                                          item.selectedContact.lastName
                                      : item.selectedContact.firstName &&
                                        !item.selectedContact.lastName
                                      ? item.selectedContact.firstName
                                      : !item.selectedContact.firstName &&
                                        item.selectedContact.lastName
                                      ? item.selectedContact.lastName
                                      : '',
                                  )
                                : ''}
                            </Text>
                          ) : item &&
                            item.selectedContact &&
                            item.selectedContact.id ? (
                            <Text
                              style={{
                                textAlign: 'center',
                                fontSize: 18,
                                lineHeight: 18, //... One for top and one for bottom alignment
                              }}
                            >
                              @
                            </Text>
                          ) : (
                            <Image
                              source={require('../../assets/images/icons/icon_user.png')}
                              style={styles.circleShapeView}
                            />
                          )}
                        </View>
                      )}
                      {/* {getImageIcon(item.selectedContact)} */}
                      <TouchableOpacity
                        style={styles.closeMarkStyle}
                        onPress={() => {
                          setTimeout(() => {
                            this.setState({ removeItem: item });
                          }, 2);
                          (this.refs.RemoveBottomSheet as any).snapTo(1);
                        }}
                      >
                        <AntDesign
                          size={16}
                          color={Colors.blue}
                          name={'closecircle'}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text
                      style={styles.name}
                      numberOfLines={1}
                    >
                      {item.selectedContact.name ||
                        item.selectedContact.account_name ||
                        item.selectedContact.id}
                    </Text>
                    <Text
                      style={styles.amountText}
                    >
                     {switchOn
            ? `${item.bitcoinAmount ? item.bitcoinAmount : bitcoinAmount}` +
              `${serviceType == TEST_ACCOUNT ? 't-sats' : 'sats'}`
            : CurrencySymbol +
              ' ' +
              `${item.currencyAmount ? item.currencyAmount : currencyAmount}`}
                    </Text>
                  </View>
                );
              })}
              {/* renderMultipleContacts(item))} */}
            </ScrollView>
          ) : null}
        </View>
        <View
          style={styles.dividerView}
        />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS == 'ios' ? 'padding' : ''}
          enabled
        >
          <View
            style={styles.parentView}
          >
            <ScrollView>
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <View style={{ flex: 1, flexDirection: 'column' }}>
                  <TouchableOpacity
                    style={{
                      ...InputStyle1,
                      marginBottom: wp('1.5%'),
                      marginTop: wp('1.5%'),
                      flexDirection: 'row',
                      width: wp('70%'),
                      height: wp('13%'),
                      backgroundColor: !switchOn
                        ? Colors.white
                        : Colors.backgroundColor,
                    }}
                    // onPress={()=>setSwitchOn(!switchOn)}
                  >
                    <View style={styles.amountInputImage}>
                      {currencyCode.includes(CurrencyCode) ? (
                        <View
                          style={styles.currencyImageView}
                        >
                          <MaterialCommunityIcons
                            name={getCurrencyImageName(CurrencyCode)}
                            color={Colors.currencyGray}
                            size={wp('6%')}
                          />
                        </View>
                      ) : (
                        <Image
                          style={{
                            ...styles.textBoxImage,
                          }}
                          source={getCurrencyImageByRegion(
                            CurrencyCode,
                            'gray',
                          )}
                        />
                      )}
                      {/* <Image
            style={styles.textBoxImage}
            source={require('../../assets/images/icons/dollar_grey.png')}
          /> */}
                    </View>
                    <View
                      style={styles.convertText}
                    />
                    <TextInput
                      style={{
                        ...styles.textBox,
                        paddingLeft: 10,
                        flex: 1,
                        height: wp('13%'),
                        width: wp('45%'),
                      }}
                      editable={!switchOn}
                      placeholder={
                        switchOn
                          ? 'Converted amount in ' + CurrencyCode
                          : 'Enter amount in ' + CurrencyCode
                      }
                      value={currencyAmount}
                      returnKeyLabel="Done"
                      returnKeyType="done"
                      keyboardType={'numeric'}
                      onChangeText={(value) => {
                        this.convertBitCoinToCurrency(value);
                      }}
                      placeholderTextColor={Colors.borderColor}
                      onFocus={() => {
                        this.setState({ InputStyle1: styles.inputBoxFocused });
                      }}
                      onBlur={() => {
                        this.setState({ InputStyle1: styles.textBoxView });
                      }}
                      onKeyPress={(e) => {
                        if (e.nativeEvent.key === 'Backspace') {
                          setTimeout(() => {
                            this.setState({ isInvalidBalance: false });
                          }, 10);
                        }
                      }}
                    />
                  </TouchableOpacity>
                  {/* {renderUSDInputText()} */}
                  {isInvalidBalance ? (
                    <View style={{ marginLeft: 'auto' }}>
                      <Text style={styles.errorText}>Insufficient balance</Text>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={{
                      ...InputStyle,
                      marginBottom: wp('1.5%'),
                      marginTop: wp('1.5%'),
                      flexDirection: 'row',
                      width: wp('70%'),
                      height: wp('13%'),
                      backgroundColor: switchOn
                        ? Colors.white
                        : Colors.backgroundColor,
                    }}
                    // onPress={()=>setSwitchOn(!switchOn)}
                  >
                    <View style={styles.amountInputImage}>
                      <Image
                        style={styles.textBoxImage}
                        source={require('../../assets/images/icons/icon_bitcoin_gray.png')}
                      />
                    </View>
                    <View
                      style={styles.enterAmountView}
                    />
                    <TextInput
                      style={{
                        ...styles.textBox,
                        flex: 1,
                        paddingLeft: 10,
                        height: wp('13%'),
                        width: wp('45%'),
                      }}
                      placeholder={
                        switchOn
                        ? serviceType == TEST_ACCOUNT
                          ? 'Enter amount in t-sats'
                          : 'Enter amount in sats'
                        : serviceType == TEST_ACCOUNT
                        ? 'Converted amount in t-sats'
                        : 'Converted amount in sats'
                      }
                      editable={switchOn}
                      value={bitcoinAmount}
                      returnKeyLabel="Done"
                      returnKeyType="done"
                      keyboardType={'numeric'}
                      onChangeText={(value) => {
                        this.convertBitCoinToCurrency(value);
                      }}
                      placeholderTextColor={Colors.borderColor}
                      onFocus={() => {
                        this.setState({ InputStyle: styles.inputBoxFocused });
                      }}
                      onBlur={() => {
                        this.setState({ InputStyle: styles.textBoxView });
                      }}
                      onKeyPress={(e) => {
                        if (e.nativeEvent.key === 'Backspace') {
                          setTimeout(() => {
                            this.setState({ isInvalidBalance: false });
                          }, 10);
                        }
                      }}
                    />
                  </TouchableOpacity>
                  {/* {renderBitCoinInputText()} */}
                </View>
                <View
                  style={styles.toggleSwitchView}
                >
                  <ToggleSwitch
                    currencyCodeValue={CurrencyCode}
                    onpress={async () => {
                      this.setState({ switchOn: !switchOn });
                      let temp = !switchOn ? 'true' : '';
                      this.props.setCurrencyToggleValue(temp);

                      //await AsyncStorage.setItem('currencyToggleValue', temp);
                    }}
                    toggle={switchOn}
                    transform={true}
                  />
                </View>
              </View>
              {serviceType == TEST_ACCOUNT ? (
                <View
                  style={styles.bottomInfoView}
                >
                  <BottomInfoBox
                    title={'Value of your test-sats'}
                    infoText={
                      'The corresponding ' +
                      CurrencySymbol +
                      ' value shown here is for illustration only. Test-sats have no ' +
                      CurrencySymbol +
                      ' value'
                    }
                  />
                </View>
              ) : null}
              <View
                style={{
                  ...InputStyleNote,
                  marginBottom: wp('1.5%'),
                  marginTop: wp('1.5%'),
                  flexDirection: 'row',
                  height: wp('13%'),
                }}
              >
                <TextInput
                  style={{
                    ...styles.textBox,
                    paddingLeft: 15,
                    flex: 1,
                    height: wp('13%'),
                  }}
                  returnKeyLabel="Done"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  keyboardType={
                    Platform.OS == 'ios' ? 'ascii-capable' : 'visible-password'
                  }
                  placeholder={'Add a Note ( Optional )'}
                  value={note}
                  onChangeText={(text) => this.setState({ note: text })}
                  placeholderTextColor={Colors.borderColor}
                  onFocus={() => {
                    this.setState({ InputStyleNote: styles.inputBoxFocused });
                  }}
                  onBlur={() => {
                    this.setState({ InputStyleNote: styles.textBoxView });
                  }}
                />
              </View>
              <View
                style={styles.confirmView}
              >
                <TouchableOpacity
                  onPress={() => {
                    this.onConfirm();
                  }}
                  disabled={
                    isConfirmDisabled || loading[serviceType].loading.transfer
                  }
                  style={{
                    ...styles.confirmButtonView,
                    backgroundColor: Colors.blue,
                    elevation: 10,
                    shadowColor: Colors.shadowBlue,
                    shadowOpacity: 1,
                    shadowOffset: { width: 15, height: 15 },
                    opacity: isConfirmDisabled ? 0.5 : 1,
                  }}
                >
                  {/* {loading[serviceType].loading.transfer && !isInvalidBalance ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : ( */}
                  {loading[serviceType].loading.transfer ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Text style={styles.buttonText}>{'Confirm & Proceed'}</Text>
                  )}
                  {/* )} */}
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                      ...styles.confirmButtonView,
                      width: wp('30%'),
                      marginLeft: 10,
                    }}
                    disabled={
                      isConfirmDisabled || loading[serviceType].loading.transfer
                    }
                    onPress={() => {
                      if (
                        transfer[serviceType].transfer.details &&
                        transfer[serviceType].transfer.details.length
                      ) {
                        for (
                          let i = 0;
                          i < transfer[serviceType].transfer.details.length;
                          i++
                        ) {
                          if (
                            transfer[serviceType].transfer.details[i]
                              .selectedContact.id == selectedContact.id
                          ) {
                            removeTransferDetails(
                              serviceType,
                              transfer[serviceType].transfer.details[i],
                            );
                          }
                        }
                        addTransferDetails(serviceType, {
                          selectedContact,
                          bitcoinAmount,
                          currencyAmount,
                          note,
                        });
                        this.props.navigation.goBack();
                      }
                    }}
                  >
                    <Text style={{ ...styles.buttonText, color: Colors.blue }}>
                      Add Recipient
                    </Text>
                  </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
        <BottomSheet
          enabledInnerScrolling={true}
          ref={'RemoveBottomSheet'}
          snapPoints={[
            -50,
            Platform.OS == 'ios' && DeviceInfo.hasNotch()
              ? hp('50%')
              : hp('50%'),
          ]}
          renderContent={() => {
            if (
              Object.keys(removeItem).length != 0 &&
              removeItem.constructor === Object
            ) {
              return (
                <RemoveSelectedTransaction
                  selectedContact={removeItem}
                  onPressBack={() => {
                    if (this.refs.RemoveBottomSheet)
                      (this.refs.RemoveBottomSheet as any).snapTo(0);
                  }}
                  onPressDone={() => {
                    setTimeout(() => {
                      removeTransferDetails(serviceType, removeItem);
                    }, 2);
                    (this.refs.RemoveBottomSheet as any).snapTo(0);
                  }}
                  serviceType={serviceType}
                />
              );
            }
          }}
          renderHeader={() => {
            if (
              Object.keys(removeItem).length === 0 &&
              removeItem.constructor === Object
            ) {
              return (
                <ModalHeader
                  onPressHeader={() => {
                    if (this.refs.RemoveBottomSheet)
                      (this.refs.RemoveBottomSheet as any).snapTo(0);
                  }}
                />
              );
            }
          }}
        />
        <BottomSheet
          onCloseStart={() => {
            (this.refs.SendUnSuccessBottomSheet as any).snapTo(0);
          }}
          enabledInnerScrolling={true}
          ref={'SendUnSuccessBottomSheet'}
          snapPoints={[-50, hp('65%')]}
          renderContent={() => (
            <SendConfirmationContent
              title={'Sent Unsuccessful'}
              info={
                'There seems to be a problem' +
                '\n' +
                transfer[serviceType].transfer.stage1.failed
                  ? transfer[serviceType].transfer.stage1.err ===
                    'Insufficient balance'
                    ? // `Insufficient balance to compensate the transfer amount: ${netAmount} and the transaction fee: ${fee}` +
                      //   `\n\nPlease reduce the transfer amount by ${(
                      //     parseFloat(netAmount) +
                      //     parseFloat(fee) -
                      //     parseFloat(balance)
                      //   ).toFixed(
                      //     switchOn ? 0 : 2,
                      //   )} in order to conduct this transaction`
                      'Insufficient balance to complete the transaction plus fee.\nPlease reduce the amount and try again.'
                    : transfer[serviceType].transfer.stage1.err
                  : 'Something went wrong'
              }
              userInfo={transfer[serviceType].transfer.details}
              isFromContact={false}
              okButtonText={'Try Again'}
              cancelButtonText={'Back'}
              isCancel={true}
              onPressOk={() => {
                //dispatch(clearTransfer(serviceType));
                if (this.refs.SendUnSuccessBottomSheet)
                  (this.refs.SendUnSuccessBottomSheet as any).snapTo(0);
              }}
              onPressCancel={() => {
                clearTransfer(serviceType);
                if (this.refs.SendUnSuccessBottomSheet)
                  (this.refs.SendUnSuccessBottomSheet as any).snapTo(0);

                this.props.navigation.navigate('Accounts');
              }}
              isUnSuccess={true}
            />
          )}
          renderHeader={() => (
            <ModalHeader
              onPressHeader={() => {
                //  dispatch(clearTransfer(serviceType));
                if (this.refs.SendUnSuccessBottomSheet)
                  (this.refs.SendUnSuccessBottomSheet as any).snapTo(0);
              }}
            />
          )}
        />
        <BottomSheet
          enabledInnerScrolling={true}
          ref={'AccountSelectionBottomSheet'}
          snapPoints={[
            -50,
            Platform.OS == 'ios' && DeviceInfo.hasNotch()
              ? hp('55%')
              : hp('60%'),
          ]}
          renderContent={() => (
            <AccountSelectionModalContents
              RegularAccountBalance={spendableBalances.regularBalance}
              SavingAccountBalance={spendableBalances.secureBalance}
              onPressBack={() => {
                (this.refs.AccountSelectionBottomSheet as any).snapTo(0);
              }}
              onPressConfirm={(type) => {
                if (transfer.details && transfer.details.length) {
                  for (let i = 0; i < transfer.details.length; i++) {
                    if (
                      transfer.details[i].selectedContact.id ==
                      selectedContact.id
                    ) {
                      this.props.removeTransferDetails(
                          serviceType,
                          transfer.details[i],
                        )
                      break;
                    }
                  }
                  this.props.addTransferDetails(type, {
                      selectedContact,
                      bitcoinAmount,
                      currencyAmount,
                      note,
                    })
                }
                (this.refs.AccountSelectionBottomSheet as any).snapTo(0);
                setTimeout(() => {
                  this.setState({ serviceType: type });
                }, 2);
              }}
            />
          )}
          renderHeader={() => (
            <SmallHeaderModal
              onPressHeader={() => {
                (this.refs.AccountSelectionBottomSheet as any).snapTo(0);
              }}
            />
          )}
        />
      </View>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    service: idx(state, (_) => _.accounts),
    transfer: idx(state, (_) => _.accounts),
    loading: idx(state, (_) => _.accounts),
    accounts: state.accounts || [],
    currencyCode: idx(state, (_) => _.preferences.currencyCode),
    currencyToggleValue: idx(state, (_) => _.preferences.currencyToggleValue),

  };
};

export default withNavigationFocus(
  connect(mapStateToProps, {
    transferST1,
    removeTransferDetails,
    clearTransfer,
    addTransferDetails,
    setCurrencyToggleValue
  })(SendToContact),
);

const styles = StyleSheet.create({
  modalHeaderTitleText: {
    color: Colors.blue,
    fontSize: RFValue(18),
    fontFamily: Fonts.FiraSansRegular,
  },
  view:{
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  view1:{
    marginRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: wp('15%'),
  },
  name:{
    color: Colors.textColorGrey,
    fontSize: RFValue(13),
    fontFamily: Fonts.FiraSansRegular,
    textAlign: 'center',
    marginTop: 5,
    width: wp('15%'),
  },
  amountText:{
    color: Colors.blue,
    fontSize: RFValue(10),
    fontFamily: Fonts.FiraSansRegular,
  },
  dividerView:{
    alignSelf: 'center',
    width: wp('90%'),
    borderBottomWidth: 1,
    borderColor: Colors.borderColor,
    marginBottom: hp('1%'),
    marginTop: hp('2%'),
  },
  parentView:{ paddingLeft: 20, paddingRight: 20, paddingTop: wp('5%') },
  backArrow:{
    height: 30,
    width: 30,
    justifyContent: 'center',
  },
  sendText:{
    color: Colors.textColorGrey,
    fontFamily: Fonts.FiraSansRegular,
    fontSize: RFValue(12),
  },
  confirmView:{
    flexDirection: 'row',
    marginTop: hp('3%'),
    marginBottom: hp('5%'),
  },
  currencyImageView:{
    width: wp('6%'),
    height: wp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  convertText:{
    width: 2,
    height: '60%',
    backgroundColor: Colors.borderColor,
    marginRight: 5,
    marginLeft: 5,
    alignSelf: 'center',
  },
  enterAmountView:{
    width: 2,
    height: '60%',
    backgroundColor: Colors.borderColor,
    marginRight: 5,
    marginLeft: 5,
    alignSelf: 'center',
  },
  toggleSwitchView:{
    marginLeft: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomInfoView:{
    marginTop: wp('1.5%'),
    marginBottom: -25,
    padding: -20,
    marginLeft: -20,
    marginRight: -20,
  },
  availableToSpendView:{
    alignSelf: 'center',
    width: wp('90%'),
    marginBottom: hp('2%'),
    marginTop: hp('2%'),
    flexDirection: 'row',
    paddingBottom: hp('1.5%'),
    paddingTop: hp('1%'),
  },
  availableToSpendText:{
    color: Colors.blue,
    fontSize: RFValue(10),
    fontFamily: Fonts.FiraSansItalic,
    lineHeight: 15,
    textAlign: 'center',
  },
  balanceText:{
    color: Colors.blue,
    fontSize: RFValue(10),
    fontFamily: Fonts.FiraSansItalic,
  },
  textTsats:{
  color: Colors.textColorGrey,
  fontSize: RFValue(7),
  fontFamily: Fonts.FiraSansMediumItalic,
},
  errorText: {
    fontFamily: Fonts.FiraSansMediumItalic,
    color: Colors.red,
    fontSize: RFValue(11),
    fontStyle: 'italic',
    marginRight: 10,
  },
  modalHeaderTitleView: {
    borderBottomWidth: 1,
    borderColor: Colors.borderColor,
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    paddingRight: 10,
    paddingBottom: hp('1.5%'),
    paddingTop: hp('1%'),
    marginBottom: hp('0.5%'),
    width: wp('90%'),
  },
  textBoxView: {
    borderWidth: 0.5,
    borderRadius: 10,
    borderColor: Colors.borderColor,
  },
  inputBoxFocused: {
    borderRadius: 10,
    elevation: 10,
    borderColor: Colors.borderColor,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowColor: Colors.borderColor,
    backgroundColor: Colors.white,
  },
  textBoxImage: {
    width: wp('6%'),
    height: wp('6%'),
    resizeMode: 'contain',
  },
  amountInputImage: {
    width: 40,
    height: wp('13%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  textBox: {
    fontSize: RFValue(13),
    color: Colors.textColorGrey,
    fontFamily: Fonts.FiraSansRegular,
  },
  confirmButtonView: {
    width: wp('50%'),
    height: wp('13%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonText: {
    color: Colors.white,
    fontSize: RFValue(13),
    fontFamily: Fonts.FiraSansMedium,
  },
  circleShapeView: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('14%') / 2,
    borderColor: Colors.white,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.7,
    shadowColor: Colors.borderColor,
    elevation: 10,
  },
  closeMarkStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    right: 0,
    elevation: 10,
  },
});
