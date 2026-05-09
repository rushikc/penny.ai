import React, {useState} from 'react';
import {View, StyleSheet, ActivityIndicator} from 'react-native';
import {Button, Text, useTheme} from 'react-native-paper';
import {useAuth} from '../src/pages/login/AuthContext';
import {useRouter} from 'expo-router';
import {MaterialCommunityIcons} from '@expo/vector-icons';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const {signInWithGoogle} = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      router.replace('/(tabs)/home');
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={[styles.card, {backgroundColor: theme.colors.surface}]}>
        <MaterialCommunityIcons
          name="cash-multiple"
          size={80}
          color={theme.colors.primary}
          style={styles.icon}
        />
        <Text variant="headlineLarge" style={[styles.title, {color: theme.colors.onSurface}]}>
          penny.ai
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, {color: theme.colors.onSurfaceVariant}]}>
          Track your expenses wisely
        </Text>

        {error ? (
          <Text style={[styles.error, {color: theme.colors.error}]}>{error}</Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleGoogleSignIn}
          disabled={loading}
          icon="google"
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {loading ? <ActivityIndicator color="white" /> : 'Sign in with Google'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
  },
  error: {
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
