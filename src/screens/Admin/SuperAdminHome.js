import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

const SuperAdminHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cafeName, setCafeName] = useState('');

  useEffect(() => {
    const fetchCafeName = async () => {
      const userId = auth().currentUser.uid;
      const snapshot = await database().ref(`users/${userId}`).once('value');
      const userData = snapshot.val();
      setCafeName(userData?.cafename || '');
    };

    fetchCafeName();
  }, []);

  useEffect(() => {
    if (!cafeName) return;

    const fetchStats = async () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const statsRef = database().ref(`cafeStats/${cafeName}`);

      statsRef.on('value', snapshot => {
        const data = snapshot.val() || {};

        // Calculate statistics
        const todayStats = data[today] || {coffeeCount: 0, giftCount: 0};

        // Calculate unique users
        const uniqueUsers = new Set();
        Object.values(data).forEach(dayData => {
          if (dayData.users) {
            Object.keys(dayData.users).forEach(userId =>
              uniqueUsers.add(userId),
            );
          }
        });

        // Calculate monthly and yearly stats
        let monthlyStats = {coffeeCount: 0, giftCount: 0};
        let yearlyStats = {coffeeCount: 0, giftCount: 0};

        Object.entries(data).forEach(([date, dayData]) => {
          const [year, month] = date.split('-').map(Number);

          if (year === currentYear && month === currentMonth) {
            monthlyStats.coffeeCount += dayData.coffeeCount || 0;
            monthlyStats.giftCount += dayData.giftCount || 0;
          }

          if (year === currentYear) {
            yearlyStats.coffeeCount += dayData.coffeeCount || 0;
            yearlyStats.giftCount += dayData.giftCount || 0;
          }
        });

        setStats({
          uniqueUsers: uniqueUsers.size,
          today: todayStats,
          monthly: monthlyStats,
          yearly: yearlyStats,
        });
        setLoading(false);
      });

      return () => statsRef.off();
    };

    fetchStats();
  }, [cafeName]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A3428" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{cafeName}</Text>

      <View style={styles.statCard}>
        <Text style={styles.cardTitle}>Toplam Müşteri Sayısı</Text>
        <Text style={styles.statNumber}>{stats?.uniqueUsers || 0}</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.cardTitle}>Bugün</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Satılan Kahve:</Text>
          <Text style={styles.statValue}>{stats?.today.coffeeCount || 0}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Verilen Hediye:</Text>
          <Text style={styles.statValue}>{stats?.today.giftCount || 0}</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.cardTitle}>Bu Ay</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Toplam Satılan:</Text>
          <Text style={styles.statValue}>
            {stats?.monthly.coffeeCount || 0}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Toplam Hediye:</Text>
          <Text style={styles.statValue}>{stats?.monthly.giftCount || 0}</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.cardTitle}>Bu Yıl</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Toplam Satılan:</Text>
          <Text style={styles.statValue}>{stats?.yearly.coffeeCount || 0}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Toplam Hediye:</Text>
          <Text style={styles.statValue}>{stats?.yearly.giftCount || 0}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A3428',
    marginBottom: 20,
    textAlign: 'center',
  },
  statCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3428',
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A3428',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4A3428',
    textAlign: 'center',
  },
});

export default SuperAdminHome;
