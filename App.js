import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { UserAuthProvider } from './src/context/UserAuthContext';

import HomeScreen from './src/screens/HomeScreen';
import CardScreen from './src/screens/CardScreen';
import CameraScreen from './src/screens/CameraScreen';
import ChallengeScreen from './src/screens/ChallengeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import VoteScreen from './src/screens/VoteScreen';
import ScoreScreen from './src/screens/ScoreScreen';
import ScoreDetailScreen from './src/screens/ScoreDetailScreen';
import StudyPlanScreen from './src/screens/StudyPlanScreen';
import InternshipScreen from './src/screens/InternshipScreen';
import ScoreFormScreen from './src/screens/ScoreFormScreen';

import AdminVoteScreen from './backend/src/screens/AdminVoteScreen';
import AdminStudyPlanScreen from './backend/src/screens/AdminStudyPlanScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CameraTabButton({ children, onPress }) {
  return (
    <TouchableOpacity
      style={styles.cameraButtonWrapper}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cameraButton}>{children}</View>
    </TouchableOpacity>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#ff6600',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Card') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Camera') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Challenge') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Card" component={CardScreen} />
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => <CameraTabButton {...props} />,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'camera' : 'camera-outline'}
              size={28}
              color="#fff"
            />
          ),
        }}
      />
      <Tab.Screen name="Challenge" component={ChallengeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <UserAuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Vote" component={VoteScreen} />
          <Stack.Screen name="AdminVote" component={AdminVoteScreen} />
          <Stack.Screen name="AdminStudyPlan" component={AdminStudyPlanScreen} />
          <Stack.Screen name="StudyPlan" component={StudyPlanScreen} />
          <Stack.Screen name="Score" component={ScoreScreen} />
          <Stack.Screen name="ScoreDetail" component={ScoreDetailScreen} />
          <Stack.Screen name="Internship" component={InternshipScreen} />
          <Stack.Screen name="ScoreForm" component={ScoreFormScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserAuthProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
  cameraButtonWrapper: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff6600',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});