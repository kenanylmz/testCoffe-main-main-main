import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

const Dogrulama = ({route, navigation}) => {
  const [loading, setLoading] = useState(false);
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [timer, setTimer] = useState(30); // Yeni e-posta gönderimi için sayaç

  const email = route.params?.email;
  const fromRegistration = route.params?.fromRegistration || false;
  const requiresVerification = route.params?.requiresVerification || false;

  // Geri tuşunu devre dışı bırak
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (requiresVerification) {
          return true; // Geri tuşunu engelle
        }
        return false;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [requiresVerification]),
  );

  // Sayaç için useEffect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Otomatik doğrulama kontrolü
  useEffect(() => {
    if (requiresVerification) {
      const checkInterval = setInterval(checkVerificationStatus, 3000);
      return () => clearInterval(checkInterval);
    }
  }, [requiresVerification]);

  const checkVerificationStatus = async () => {
    if (!auth().currentUser) return;

    setVerificationChecking(true);
    try {
      await auth().currentUser.reload();
      if (auth().currentUser.emailVerified) {
        clearInterval();
        Alert.alert(
          'Başarılı',
          'E-posta adresiniz doğrulandı!',
          [
            {
              text: 'Devam Et',
              onPress: () => navigation.replace('Kafeler'),
            },
          ],
          {cancelable: false},
        );
      }
    } catch (error) {
      console.error('Doğrulama kontrolü hatası:', error);
    } finally {
      setVerificationChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (!auth().currentUser || timer > 0) return;

    setLoading(true);
    try {
      await auth().currentUser.sendEmailVerification();
      Alert.alert('Başarılı', 'Doğrulama e-postası tekrar gönderildi.');
      setTimer(30); // Sayacı yeniden başlat
    } catch (error) {
      Alert.alert('Hata', 'E-posta gönderimi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  const openEmail = () => {
    Linking.openURL('mailto:');
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>E-posta Doğrulama</Text>

        <Text style={styles.description}>
          {email
            ? `${email} adresine gönderilen doğrulama e-postasını onaylayın.`
            : 'E-posta adresinize gönderilen doğrulama linkine tıklayın.'}
        </Text>

        {verificationChecking && (
          <ActivityIndicator style={styles.loader} color="#000" />
        )}

        <TouchableOpacity style={styles.button} onPress={openEmail}>
          <Text style={styles.buttonText}>E-posta Uygulamasını Aç</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, timer > 0 && styles.disabledButton]}
          onPress={handleResendEmail}
          disabled={timer > 0 || loading}>
          <Text style={styles.buttonText}>
            {loading
              ? 'Gönderiliyor...'
              : timer > 0
              ? `Yeniden Gönder (${timer}s)`
              : 'Tekrar Gönder'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.infoText}>
          Doğrulama e-postası gelmediyse spam klasörünü kontrol edin.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C8B39E82',
  },
  innerContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: 'black',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
  },
  infoText: {
    marginTop: 20,
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Dogrulama;
