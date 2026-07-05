import {Redirect} from 'expo-router';
import {useAuth} from '../src/pages/login/AuthContext';
import {ActivityIndicator, View} from 'react-native';
import {AUTH_REQUIRED} from '../src/utility/constants';

export default function Index() {
  const {currentUser, loading} = useAuth();

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!AUTH_REQUIRED || currentUser) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/login" />;
}
