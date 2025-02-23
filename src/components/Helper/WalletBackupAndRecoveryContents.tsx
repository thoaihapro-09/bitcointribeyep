import React from 'react'
import { View, Image, Text, StyleSheet } from 'react-native'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen'
import Colors from '../../common/Colors'
import Fonts from '../../common/Fonts'
import { RFValue } from 'react-native-responsive-fontsize'
import { AppBottomSheetTouchableWrapper } from '../AppBottomSheetTouchableWrapper'
import { ScrollView } from 'react-native-gesture-handler'

export default function WalletBackupAndRecoveryContents( props ) {
  return (
    <ScrollView style={styles.modalContainer}>
      <View style={{
        justifyContent: 'center', alignItems: 'center'
      }}>
        {/* <AppBottomSheetTouchableWrapper onPress={()=>props.onPressManageBackup()} style={{
                width: wp('50%'), height: wp('13%'), backgroundColor: Colors.homepageButtonColor,
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: hp('2%'), marginBottom: hp('2%')
            }} > */}
        <Text
          style={{
            color: Colors.white,
            fontFamily: Fonts.Medium,
            fontSize: RFValue( 20 ),
            marginTop: hp( '1%' ),
            marginBottom: hp( '1%' ),
          }}
        >
          Manage Backup
        </Text>
        {/* </AppBottomSheetTouchableWrapper> */}
      </View>
      <View style={{
        justifyContent: 'center', alignItems: 'center'
      }}>
        <Image
          source={require( '../../assets/images/icons/shieldWithRoundBorder.png' )}
          style={{
            width: wp( '50%' ), height: wp( '50%' ), resizeMode: 'contain'
          }}
        />
      </View>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: hp( '2%' ),
        }}
      >
        <Text
          style={{
            textAlign: 'center',
            color: Colors.white,
            fontSize: RFValue( 13 ),
            fontFamily: Fonts.Regular,
          }}
        >
          With{' '}
          <Text
            style={{
              textAlign: 'center',
              color: Colors.white,
              fontSize: RFValue( 13 ),
              fontFamily: Fonts.Medium,
            }}
          >
            Bitcoin Tribe
          </Text>
          , you have full control over your bitcoin.{'\n'}This gives you{' '}
          <Text
            style={{
              color: Colors.white,
              fontSize: RFValue( 13 ),
              fontFamily: Fonts.Medium,
            }}
          >
            better privacy and security
          </Text>
        </Text>
      </View>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: hp( '2%' ),
          marginBottom: hp( '2%' ),
        }}
      >
        <Image
          source={require( '../../assets/images/icons/mobileWithCircle.png' )}
          style={{
            width: wp( '25%' ), height: wp( '25%' ), resizeMode: 'contain'
          }}
        />
      </View>
      <View style={{
        justifyContent: 'center', alignItems: 'center'
      }}>
        <Text
          style={{
            textAlign: 'center',
            color: Colors.white,
            fontSize: RFValue( 13 ),
            fontFamily: Fonts.Regular,
          }}
        >
          As only you can access your wallet, it is important to manage your backup health for easy recovery in case you lose your phone.
        </Text>
      </View>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: hp( '5%' ),
        }}
      >
        <Text
          style={{
            textAlign: 'center',
            color: Colors.white,
            fontSize: RFValue( 13 ),
            fontFamily: Fonts.Regular,
          }}
        >
          Once backed up, Bitcoin Tribe's automated health check process ensures you have access to the backup anytime!
        </Text>
        <Text
          style={{
            marginTop: 5,
            textAlign: 'center',
            color: Colors.white,
            fontSize: RFValue( 13 ),
            fontFamily: Fonts.Medium,
          }}
        >
          The Health Shield tells you{'\n'}how ready your backup is.
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          marginTop: hp( '2%' ),
          marginBottom: hp( '2%' ),
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <AppBottomSheetTouchableWrapper
          onPress={() => props.onStartBackup()}
          style={{
            width: wp( '30%' ),
            height: wp( '13%' ),
            backgroundColor: Colors.white,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: Colors.blue,
              fontSize: RFValue( 13 ),
              fontFamily: Fonts.Regular,
            }}
          >
            Start Backup
          </Text>
        </AppBottomSheetTouchableWrapper>
        <AppBottomSheetTouchableWrapper
          onPress={() => props.onSkip()}
          style={{
            width: wp( '20%' ),
            height: wp( '13%' ),
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: Colors.white,
              fontSize: RFValue( 13 ),
              fontFamily: Fonts.Regular,
            }}
          >
            Skip
          </Text>
        </AppBottomSheetTouchableWrapper>
      </View>
      <View
        style={{
          position: 'relative',
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            borderStyle: 'dotted',
            borderWidth: 1,
            borderRadius: 1,
            borderColor: Colors.white,
            width: wp( '30%' ),
            height: 0,
          }}
        />
        <Text
          style={{
            textAlign: 'center',
            color: Colors.white,
            fontSize: RFValue( 16 ),
            fontFamily: Fonts.Medium,
          }}
        >
          How It Works
        </Text>
        <View
          style={{
            borderStyle: 'dotted',
            borderWidth: 1,
            borderRadius: 1,
            borderColor: Colors.white,
            width: wp( '30%' ),
            height: 0,
          }}
        />
      </View>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: hp( '4%' ),
        }}
      >
        <Text
          style={{
            textAlign: 'center',
            color: Colors.white,
            fontSize: RFValue( 13 ),
            fontFamily: Fonts.Regular,
          }}
        >
          The app creates five Recovery Keys for your wallet.
        </Text>
      </View>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: hp( '4%' ),
        }}
      >
        <Text
          style={{
            textAlign: 'center',
            color: Colors.white,
            fontSize: RFValue( 13 ),
            fontFamily: Fonts.Regular,
          }}
        >
          All you need to do is follow the outlined steps and send these Keys to five different locations, or "Keepers".
        </Text>
      </View>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: hp( '2%' ),
        }}
      >
        <Text
          style={{
            textAlign: 'center',
            color: Colors.white,
            fontSize: RFValue( 13 ),
            fontFamily: Fonts.Regular,
          }}
        >
          Keepers can only help you recover your wallet and cannot see your balance or use your bitcoin.
        </Text>
      </View>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: hp( '2%' ),
          marginBottom: hp( '2%' ),
        }}
      >
        <Image
          source={require( '../../assets/images/icons/walletBackupIllutration.png' )}
          style={{
            width: wp( '90%' ), height: wp( '80%' ), resizeMode: 'contain'
          }}
        />
      </View>
      <View
        style={{
          backgroundColor: Colors.homepageButtonColor,
          height: 1,
          marginLeft: wp( '5%' ),
          marginRight: wp( '5%' ),
        }}
      />
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: hp( '5%' ),
        }}
      >
        <Text
          style={{
            textAlign: 'center',
            color: Colors.white,
            fontSize: RFValue( 13 ),
            fontFamily: Fonts.Regular,
          }}
        >
          If you lose your phone, all you have to do is request{' '}
          <Text
            style={{
              marginTop: 5,
              textAlign: 'center',
              color: Colors.white,
              fontSize: RFValue( 13 ),
              fontFamily: Fonts.Medium,
            }}
          >
            three of the five
          </Text>{' '}
          Recovery Keys held by your Keepers
        </Text>
      </View>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: hp( '2%' ),
          marginBottom: hp( '2%' ),
        }}
      >
        <Image
          source={require( '../../assets/images/icons/walletbackupRequestBackupThree.png' )}
          style={{
            width: wp( '90%' ), height: wp( '80%' ), resizeMode: 'contain'
          }}
        />
      </View>
      <View style={{
        justifyContent: 'center', alignItems: 'center'
      }}>
        <Text
          style={{
            textAlign: 'center',
            color: Colors.white,
            fontSize: RFValue( 13 ),
            fontFamily: Fonts.Regular,
          }}
        >
          Once you answer your Security Question, the wallet is recreated and you can use Bitcoin Tribe from your new device!
        </Text>
      </View>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: hp( '1%' ),
          marginBottom: hp( '2%' ),
        }}
      >
        <Image
          source={require( '../../assets/images/icons/Walletbackupwalletrecreate.png' )}
          style={{
            width: wp( '90%' ), height: wp( '50%' ), resizeMode: 'contain'
          }}
        />
      </View>
      <View
        style={{
          backgroundColor: Colors.homepageButtonColor,
          height: 1,
          marginLeft: wp( '5%' ),
          marginRight: wp( '5%' ),
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          marginTop: hp( '2%' ),
          marginBottom: hp( '2%' ),
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <AppBottomSheetTouchableWrapper
          onPress={() => props.onStartBackup()}
          style={{
            width: wp( '30%' ),
            height: wp( '13%' ),
            backgroundColor: Colors.white,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: Colors.blue,
              fontSize: RFValue( 13 ),
              fontFamily: Fonts.Regular,
            }}
          >
            Start Backup
          </Text>
        </AppBottomSheetTouchableWrapper>
        <AppBottomSheetTouchableWrapper
          onPress={() => props.onSkip()}
          style={{
            width: wp( '20%' ),
            height: wp( '13%' ),
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: Colors.white,
              fontSize: RFValue( 13 ),
              fontFamily: Fonts.Regular,
            }}
          >
            Skip
          </Text>
        </AppBottomSheetTouchableWrapper>
      </View>
    </ScrollView>
  )
}
const styles = StyleSheet.create( {
  modalContainer: {
    height: '100%',
    backgroundColor: Colors.blue,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: hp( '4%' ),
    elevation: 10,
    shadowColor: Colors.borderColor,
    shadowOpacity: 10,
    shadowOffset: {
      width: 0, height: 2
    },
  },
} )
