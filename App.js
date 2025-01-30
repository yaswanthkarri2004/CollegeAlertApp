import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [events, setEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', time: '' });
  const [editEvent, setEditEvent] = useState(null);

  useEffect(() => {
    loadEvents();
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    scheduleNotifications();
  }, [events]);

  const loadEvents = async () => {
    try {
      const storedEvents = await AsyncStorage.getItem('events');
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      }
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  const saveEvents = async (eventsToSave) => {
    try {
      await AsyncStorage.setItem('events', JSON.stringify(eventsToSave));
    } catch (error) {
      console.error("Error saving events:", error);
    }
  };

  const addEvent = () => {
    if (!newEvent.title || !newEvent.description || !newEvent.date || !newEvent.time) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    const newEventWithId = { ...newEvent, id: uuidv4() };
    setEvents([...events, newEventWithId]);
    saveEvents([...events, newEventWithId]);
    setNewEvent({ title: '', description: '', date: '', time: '' });
    setModalVisible(false);
  };

  const editEventHandler = (event) => {
    setEditEvent(event);
    setNewEvent({ ...event });
    setModalVisible(true);
  };

  const updateEvent = () => {
    if (!newEvent.title || !newEvent.description || !newEvent.date || !newEvent.time) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    const updatedEvents = events.map(event =>
      event.id === editEvent.id ? { ...newEvent, id: editEvent.id } : event
    );
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
    setEditEvent(null);
    setNewEvent({ title: '', description: '', date: '', time: '' });
    setModalVisible(false);
    
  };

  const deleteEvent = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this event?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: () => {
            const filteredEvents = events.filter(event => event.id !== id);
            setEvents(filteredEvents);
            saveEvents(filteredEvents);
          }
        }
      ]
    );
  };

  

  const scheduleNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  
    for (const event of events) {
      const eventDate = new Date(`${event.date}T${event.time}`);
      const now = new Date();
      const timeUntilEvent = eventDate.getTime() - now.getTime();
  
      if (timeUntilEvent > 0) {
        // Check for missing or empty title/body (Important!)
        const notificationTitle =  "Event Notification"; // Provide a default
        const notificationBody =  "Check out this event!"; // Provide a default
  
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "hai how are", // Use the possibly defaulted title
            body: notificationBody,    // Use the possibly defaulted body
          },
          trigger: { seconds: Math.round(timeUntilEvent / 1000) },
        });
      }
    }
  };

  async function registerForPushNotificationsAsync() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('No notification permissions granted!');
      return;
    }
    // If permission is granted, you can get the token:
    const token = await Notifications.getExpoPushTokenAsync();
    console.log("Expo Push Token:", token.data); // Log the token (for debugging)
    return token;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>College Events</Text>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id} // Correct key extractor
        renderItem={({ item }) => (
          <View style={styles.eventItem}>
            <TouchableOpacity onPress={() => editEventHandler(item)}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text>{item.description}</Text>
              <Text>{item.date} - {item.time}</Text>
            </TouchableOpacity>
            <Button title="Delete" onPress={() => deleteEvent(item.id)} color="red" />
          </View>
        )}
      />

      <TouchableOpacity style={styles.addEventButton} onPress={() => {
        setNewEvent({ title: '', description: '', date: '', time: '' });
        setModalVisible(true);
      }}>
        <Text style={styles.addEventButtonText}>Add Event</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setEditEvent(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={newEvent.title}
              onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              multiline
              value={newEvent.description}
              onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              value={newEvent.date}
              onChangeText={(text) => setNewEvent({ ...newEvent, date: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Time (HH:MM)"
              value={newEvent.time}
              onChangeText={(text) => setNewEvent({ ...newEvent, time: text })}
            />
            <View style={styles.buttonContainer}>
              <Button title={editEvent ? "Update Event" : "Add Event"} onPress={editEvent ? updateEvent : addEvent} />
              <Button title="Cancel" onPress={() => {
                setModalVisible(false);
                setEditEvent(null);
                setNewEvent({ title: '', description: '', date: '', time: '' });
              }} color="red" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  eventItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Distribute space between title and button
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#007AFF', // Example color
    flex: 1, // Allow the title to take up available space
  },
  eventDescription: {
    marginBottom: 5,
    color: '#555',
  },
  eventDateTime: {
    color: '#777',
    fontSize: 12,
  },
  addEventButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addEventButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: '80%', // Adjust width as needed
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  // Add more styles as needed...
});

