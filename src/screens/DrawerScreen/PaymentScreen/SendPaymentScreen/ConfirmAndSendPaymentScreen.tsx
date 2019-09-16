import React from "react";
import { StyleSheet, ImageBackground, View, Platform, SafeAreaView } from "react-native";
import {
    Container,
    Text
} from "native-base";
import { SvgIcon } from "@up-shared/components";
import { RkCard } from "react-native-ui-kitten";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import ImageSVG from "HexaWallet/src/screens/Custome/ImageSVG/ImageSVG";

//TODO: Custome Pages
import CustomeStatusBar from "HexaWallet/src/app/custcompontes/CustomeStatusBar/CustomeStatusBar";
import FullLinearGradientLoadingButton from "HexaWallet/src/app/custcompontes/LinearGradient/Buttons/FullLinearGradientLoadingButton";
import Loader from "HexaWallet/src/app/custcompontes/Loader/ModelLoader";
import HeaderTitle from "HexaWallet/src/app/custcompontes/Header/HeaderTitle/HeaderTitle";


//TODO: Custome model  
import ModelConfirmSendSuccess from "HexaWallet/src/app/custcompontes/Model/ModelPaymentScreen/ModelConfirmSendScreen/ModelConfirmSendSuccess";
import ModelConfirmSendSercureAccountOTP from "HexaWallet/src/app/custcompontes/Model/ModelPaymentScreen/ModelConfirmSendScreen/ModelConfirmSendSercureAccountOTP";


//TODO: Custome Alert 
import AlertSimple from "HexaWallet/src/app/custcompontes/Alert/AlertSimple";
let alert = new AlertSimple();


//TODO: Custome StyleSheet Files       
import globalStyle from "HexaWallet/src/app/manage/Global/StyleSheet/Style";

//TODO: Custome Object
import { colors, images, localDB, svgIcon } from "HexaWallet/src/app/constants/Constants";
var utils = require( "HexaWallet/src/app/constants/Utils" );
import renderIf from "HexaWallet/src/app/constants/validation/renderIf";
var dbOpration = require( "HexaWallet/src/app/manage/database/DBOpration" );




//TODO: Bitcoin class
var bitcoinClassState = require( "HexaWallet/src/app/manage/ClassState/BitcoinClassState" );





export default class ConfirmAndSendPaymentScreen extends React.Component<any, any> {
    constructor ( props: any ) {
        super( props )
        this.state = ( {
            data: [],
            arrModelConfirmSendSuccess: [],
            arr_ModelConfirmSendSercureAccountOTP: [],
            flag_DisableSentBtn: false,
            flag_SentBtnAnimation: false,
            flag_Loading: false
        } )
    }

    async componentWillMount() {
        var data = this.props.navigation.getParam( "data" );
        //console.log( { selectedAccount: data } );
        data = data[ 0 ]
        //console.log( { selectedAccountFirstIndex: data } );
        this.setState( {
            data: data
        } );
    }


    //TODO: Sent amount
    click_SentAmount = async () => {
        //this.setState( { flag_Loading:true})
        this.setState( {
            flag_SentBtnAnimation: true,
            flag_DisableSentBtn: true,
        } )
        let { data } = this.state;
        //console.log( { selectedAccount: data } );
        let date = Date.now();
        let regularAccount = await bitcoinClassState.getRegularClassState();
        let secureAccount = await bitcoinClassState.getSecureClassState();
        let inputs = data.resTransferST.data.inputs;
        let txb = data.resTransferST.data.txb
        //console.log( { inputs, txb } );
        var resTransferST;
        if ( data.selectedAccount.accountName == "Regular Account" ) {
            resTransferST = await regularAccount.transferST2( data.resTransferST.data.inputs, data.resTransferST.data.txb );
            await bitcoinClassState.setRegularClassState( regularAccount );
            // console.log( { resTransferST } );
            if ( resTransferST.status == 200 ) {
                this.setState( {
                    flag_SentBtnAnimation: false,
                    flag_DisableSentBtn: false,
                    arrModelConfirmSendSuccess: [ {
                        modalVisible: true,
                        data: [ {
                            amount: data.amount,
                            tranFee: data.tranFee,
                            accountName: data.accountName,
                            txid: resTransferST.data.txid,
                            date: utils.getUnixToDateFormat1()
                        } ]
                    } ]
                } )
            } else {
                alert.simpleOk( "Oops", resTransferST.err );
            }
        } else {
            resTransferST = await secureAccount.transferST2( data.resTransferST.data.inputs, data.resTransferST.data.txb );
            await bitcoinClassState.setSecureClassState( secureAccount );
            if ( resTransferST.status == 200 ) { //|| resTransferST.status == 400
                this.setState( {
                    flag_SentBtnAnimation: false,
                    flag_DisableSentBtn: false,
                    arr_ModelConfirmSendSercureAccountOTP: [ {
                        modalVisible: true,
                        data: [ {
                            data,
                            resTransferST
                        } ]
                    } ]
                } )

            } else {
                alert.simpleOk( "Oops", resTransferST.err );
            }
        }

    }


    //TODO: Amount Sent Success
    click_GoToDailyAccount = async () => {
        let { data } = this.state;
        let accountType = data.selectedAccount.accountName;
        let orignalBal = data.bal;
        let sendBal = parseFloat( data.amount ) + parseFloat( data.tranFee );
        let totalBal = orignalBal - sendBal;
        let resUpdateAccountBalR = await dbOpration.updateAccountBalAccountTypeWise(
            localDB.tableName.tblAccount,
            accountType,
            totalBal
        );
        if ( resUpdateAccountBalR ) {
            this.setState( {
                arrModelConfirmSendSuccess: [ {
                    modalVisible: false,
                    data: []
                } ]
            } );
            this.props.navigation.navigate( "TabbarBottom", { id: 1 } )
        }
    }


    render() {
        //array 
        let { data, arrModelConfirmSendSuccess, arr_ModelConfirmSendSercureAccountOTP } = this.state;
        //flag  
        let { flag_DisableSentBtn, flag_SentBtnAnimation, flag_Loading } = this.state;
        return (
            <Container>
                <ImageBackground source={ images.WalletSetupScreen.WalletScreen.backgoundImage } style={ styles.container }>
                    <HeaderTitle title="Confirm And Send"
                        pop={ () => this.props.navigation.pop() }
                    />
                    <SafeAreaView style={ [ styles.container, { backgroundColor: 'transparent' } ] }>
                        <KeyboardAwareScrollView
                            enableAutomaticScroll
                            automaticallyAdjustContentInsets={ true }
                            keyboardOpeningTime={ 0 }
                            enableOnAndroid={ true }
                            contentContainerStyle={ { flexGrow: 1 } }
                        >
                            <View style={ { flex: 1, marginTop: 20, alignItems: "center" } }>
                                <Text note>FUNDS BEING TRANSFERRED TO</Text>
                                <Text style={ [ { margin: 10, fontWeight: "bold", textAlign: "center", fontSize: 14 } ] }>{ data.respAddress }</Text>
                                <Text note style={ { textAlign: "center", margin: 10 } }>Kindly confirm the address. Funds once transferred can not be recovered.</Text>
                            </View>
                            <View style={ { flex: 1 } }>
                                <View style={ { flex: 1, justifyContent: "center", marginLeft: 20, marginRight: 20 } }>
                                    <View style={ { flexDirection: "row" } }>
                                        <ImageSVG
                                            size={ 50 }
                                            source={
                                                svgIcon.walletScreen[ data.selectedAccount.accountName == "Regular Account" ? Platform.OS == "ios" ? "dailyAccountSVG" : "dailyAccountPNG" : Platform.OS == "ios" ? "secureAccountSVG" : "secureAccountPNG" ]
                                            }
                                        />
                                        <View style={ { flexDirection: "column" } }>
                                            <Text style={ [ globalStyle.ffFiraSansBold, { fontSize: 16 } ] }>{ data.accountName }</Text>
                                            <View style={ { flexDirection: "row", alignItems: "center" } }>
                                                <Text note style={ [ { fontSize: 12 } ] }>Available balance</Text>
                                                <SvgIcon
                                                    name="icon_bitcoin"
                                                    color="#D0D0D0"
                                                    size={ 15 }
                                                />
                                                <Text note style={ { fontSize: 12, marginLeft: -0.01 } }>{ data.bal }</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                                <View style={ { flex: 1 } }>
                                    <RkCard
                                        rkType="shadowed"
                                        style={ {
                                            flex: 1,
                                            margin: 10,
                                            padding: 10,
                                            borderRadius: 10
                                        } }
                                    >
                                        <View
                                            rkCardBody
                                        >
                                            <View style={ { flex: 1, alignItems: "center", flexDirection: "row" } }>
                                                <SvgIcon
                                                    name="icon_bitcoin"
                                                    color="#D0D0D0"
                                                    size={ 40 }
                                                    style={ { flex: 0.3, marginLeft: 20 } }
                                                />
                                                <View>
                                                    <Text style={ [ globalStyle.ffFiraSansBold, { fontSize: 30 } ] }> { data.amount }</Text>

                                                    <View style={ { flexDirection: "row", alignItems: "center" } }>
                                                        <Text note style={ [ { fontSize: 12 } ] }>Transaction Fee</Text>
                                                        <SvgIcon
                                                            name="icon_bitcoin"
                                                            color="#D0D0D0"
                                                            size={ 15 }
                                                        />
                                                        <Text note style={ { fontSize: 12, marginLeft: -0.01 } }>{ data.tranFee }</Text>

                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </RkCard>
                                    { renderIf( data.memo != "" )(
                                        <RkCard
                                            rkType="shadowed"
                                            style={ {
                                                flex: 1,
                                                margin: 10,
                                                padding: 10,
                                                borderRadius: 10
                                            } }
                                        >
                                            <View
                                                rkCardBody
                                            >
                                                <View style={ { flex: 1 } }>
                                                    <Text style={ [ globalStyle.ffFiraSansRegular, { fontSize: 14, margin: 14 } ] }>{ data.memo }</Text>
                                                </View>
                                            </View>
                                        </RkCard>
                                    ) }
                                </View>
                                <View style={ { flex: 1 } }>
                                    <Text style={ { margin: 15 } }>Transaction Priority</Text>
                                    <RkCard
                                        rkType="shadowed"
                                        style={ {
                                            flex: 1,
                                            margin: 10,
                                            padding: 10,
                                            borderRadius: 10
                                        } }
                                    >
                                        <View
                                            rkCardBody
                                        >
                                            <View style={ { flex: 1, padding: 10 } }>
                                                <Text style={ [ globalStyle.ffFiraSansBold, { fontSize: 14 } ] }>{ data.priority } Priority</Text>
                                            </View>
                                        </View>
                                    </RkCard>
                                </View>
                            </View>
                            <View style={ { flex: 1 } }>
                                <FullLinearGradientLoadingButton
                                    style={ [ flag_DisableSentBtn == true ? { opacity: 0.4 } : { opacity: 1 }, { borderRadius: 10, margin: 10 } ] }
                                    disabled={ flag_DisableSentBtn }
                                    animating={ flag_SentBtnAnimation }
                                    title=" Send"
                                    click_Done={ () => this.click_SentAmount() }
                                />
                            </View>
                        </KeyboardAwareScrollView>
                    </SafeAreaView>
                </ImageBackground>
                <ModelConfirmSendSuccess data={ arrModelConfirmSendSuccess }
                    click_GoToDailyAccount={ () => {
                        this.click_GoToDailyAccount();
                    } }
                />
                <ModelConfirmSendSercureAccountOTP data={ arr_ModelConfirmSendSercureAccountOTP }
                    closeModal={ () => {
                        this.setState( {
                            arr_ModelConfirmSendSercureAccountOTP: [ {
                                modalVisible: false
                            } ]
                        } );
                        this.props.navigation.pop();
                    } }
                    click_Next={ ( txId: any ) => {
                        //console.log( { data, txId } );
                        this.setState( {
                            arr_ModelConfirmSendSercureAccountOTP: [ {
                                modalVisible: false,
                            } ],
                            arrModelConfirmSendSuccess: [ {
                                modalVisible: true,
                                data: [ {
                                    amount: data.amount,
                                    tranFee: data.tranFee,
                                    accountName: data.accountName,
                                    txid: txId.txid,
                                    date: utils.getUnixToDateFormat1()
                                } ]
                            } ]
                        } )
                    } }
                />
                <Loader loading={ flag_Loading } color={ colors.appColor } size={ 30 } />
                <CustomeStatusBar backgroundColor={ colors.white } hidden={ false } barStyle="light-content" />
            </Container >
        );
    }
}

const styles = StyleSheet.create( {
    container: {
        flex: 1,
    }
} );
