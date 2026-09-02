import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Check, ChevronLeft, Send } from 'lucide-react-native';

import {
  getSpecialistConsultationMessages,
  sendTelegramMessage,
  SpecialistConsultationMessage,
} from '../services/telegram';
import { supabase } from '../utils/supabase';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'specialist' | 'system';
  createdAt: string;
  status?: 'sending' | 'sent' | 'failed';
};

const NAVY = '#b1dcf7';
const WHITE = '#212625';
const SURFACE = '#FFFFFF';
const INCOMING = '#EFF0F5';
const TEXT = '#20242C';
const MUTED = '#8A8F98';
const SEND_ACTIVE = '#1E90FF';
const ERROR = '#B42318';
const SHOW_CHAT_SYNC_DEBUG = true;

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    sender: 'specialist',
    text: 'Hi, you are connected with an XDerma specialist. Send your question and we will review it carefully.',
    createdAt: new Date().toISOString(),
    status: 'sent',
  },
];

function mapConsultationMessage(message: SpecialistConsultationMessage): Message {
  return {
    id: message.id,
    sender:
      message.direction === 'patient_to_specialist' ? 'user' : 'specialist',
    text: message.message,
    createdAt: message.created_at,
    status: 'sent',
  };
}

function mergePersistedMessages(
  current: Message[],
  persisted: SpecialistConsultationMessage[],
): Message[] {
  const persistedMessages = persisted.map(mapConsultationMessage);
  const persistedIds = new Set(persistedMessages.map((message) => message.id));
  const pendingMessages = current.filter(
    (message) =>
      message.id !== 'welcome' &&
      message.status !== 'sent' &&
      !persistedIds.has(message.id),
  );

  return [...INITIAL_MESSAGES, ...persistedMessages, ...pendingMessages];
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.messageRow,
        isUser ? styles.messageRowUser : styles.messageRowSpecialist,
      ]}
    >
      {!isUser && (
        <View style={styles.avatarWrapper}>
          <Image
            source={require('../assets/specialist.png')}
            style={styles.avatar}
          />
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isUser ? styles.outgoingBubble : styles.incomingBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser ? styles.outgoingText : styles.incomingText,
          ]}
        >
          {message.text}
        </Text>

        {isUser && message.status !== 'sent' && (
          <Text
            style={[
              styles.messageStatus,
              message.status === 'failed' && styles.failedStatus,
            ]}
          >
            {message.status === 'failed' ? 'Not sent' : 'Sending...'}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function SpecialistChatScreen() {
  const navigation = useNavigation();
  const listRef = useRef<FlatList<Message>>(null);
  const { width } = useWindowDimensions();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [loadedMessageCount, setLoadedMessageCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadChatUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUserId = sessionData.session?.user.id;

      if (sessionUserId) {
        if (isMounted) {
          setChatUserId(sessionUserId);
        }

        return;
      }

      const { data } = await supabase.auth.getUser();

      if (isMounted) {
        setChatUserId(data.user?.id ?? null);
      }
    };

    void loadChatUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setChatUserId(session?.user.id ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const syncMessages = useCallback(async () => {
    if (!chatUserId) {
      setMessages(INITIAL_MESSAGES);
      setLoadedMessageCount(0);
      setErrorMessage('Please sign in to view specialist messages.');
      return;
    }

    const response = await getSpecialistConsultationMessages(chatUserId);

    if (response.success) {
      setMessages((current) =>
        mergePersistedMessages(current, response.messages),
      );
      setLoadedMessageCount(response.messages.length);
      setLastSyncedAt(new Date().toLocaleTimeString());
      setErrorMessage('');
    } else {
      setLoadedMessageCount(0);
      setErrorMessage(response.error || 'Unable to load messages.');
    }
  }, [chatUserId]);

  useFocusEffect(
    useCallback(() => {
      void syncMessages();
    }, [syncMessages]),
  );

  useEffect(() => {
    if (!chatUserId) return;

    const refreshWhenActive = () => {
      if (AppState.currentState === 'active') {
        void syncMessages();
      }
    };

    const refreshInterval = setInterval(refreshWhenActive, 8000);
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextState) => {
        if (nextState === 'active') {
          void syncMessages();
        }
      },
    );

    return () => {
      clearInterval(refreshInterval);
      appStateSubscription.remove();
    };
  }, [chatUserId, syncMessages]);

  useEffect(() => {
    if (!chatUserId) {
      setMessages(INITIAL_MESSAGES);
      return;
    }

    void syncMessages();

    const channel = supabase
      .channel(`specialist-consultations:${chatUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'specialist_consultation_messages',
          filter: `patient_user_id=eq.${chatUserId}`,
        },
        (payload) => {
          const nextMessage = payload.new as SpecialistConsultationMessage;

          setMessages((current) => {
            if (current.some((message) => message.id === nextMessage.id)) {
              return current;
            }

            return [...current, mapConsultationMessage(nextMessage)];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chatUserId, syncMessages]);

  const horizontalPadding = useMemo(() => {
    if (width >= 700) return Math.min(width * 0.08, 70);
    if (width >= 500) return 28;
    return 16;
  }, [width]);

  const goBack = () => {
    navigation.navigate('XDermaChatLanding' as never);
  };

  const updateMessageStatus = useCallback(
    (messageId: string, status: Message['status']) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, status } : message,
        ),
      );
    },
    [],
  );

  const refreshMessages = useCallback(async () => {
    setIsRefreshing(true);
    await syncMessages();
    setIsRefreshing(false);
  }, [syncMessages]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();

    if (!trimmed || isSending) return;

    const messageId = `${Date.now()}`;
    const outgoingMessage: Message = {
      id: messageId,
      sender: 'user',
      text: trimmed,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((current) => [...current, outgoingMessage]);
    setInput('');
    setErrorMessage('');
    setIsSending(true);

    const response = await sendTelegramMessage({
      message: trimmed,
    });

    if (response.success) {
      if (response.consultation_message?.id) {
        const savedMessage = mapConsultationMessage(
          response.consultation_message,
        );

        setMessages((current) => {
          const savedMessageAlreadyExists = current.some(
            (message) => message.id === savedMessage.id,
          );

          if (savedMessageAlreadyExists) {
            return current.filter((message) => message.id !== messageId);
          }

          return current.map((message) =>
            message.id === messageId ? savedMessage : message,
          );
        });
      } else {
        updateMessageStatus(messageId, 'sent');
      }
    } else {
      updateMessageStatus(messageId, 'failed');
      setErrorMessage(response.error || 'Unable to send message.');
    }

    setIsSending(false);
  }, [input, isSending, updateMessageStatus]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable hitSlop={12} style={styles.backButton} onPress={goBack}>
              <ChevronLeft size={25} color={WHITE} strokeWidth={2.2} />
            </Pressable>

            <View style={styles.titleGroup}>
              <Text style={styles.headerTitle}>XDerma Specialist</Text>
              <View style={styles.verifiedBadge}>
                <Check size={10} color="#FFFFFF" strokeWidth={3} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.chatSurface}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(message) => message.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            style={styles.messages}
            contentContainerStyle={[
              styles.messagesContent,
              {
                paddingHorizontal: horizontalPadding,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshMessages}
                tintColor={SEND_ACTIVE}
                colors={[SEND_ACTIVE]}
              />
            }
            onContentSizeChange={() => {
              listRef.current?.scrollToEnd({ animated: true });
            }}
          />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {SHOW_CHAT_SYNC_DEBUG ? (
            <View style={styles.syncDebugRow}>
              <Text style={styles.syncDebugText}>
                Chat user: {chatUserId ?? 'none'} | Loaded:{' '}
                {loadedMessageCount} | Sync: {lastSyncedAt ?? 'not yet'}
              </Text>

              <Pressable
                onPress={refreshMessages}
                disabled={isRefreshing}
                style={styles.syncDebugButton}
              >
                <Text style={styles.syncDebugButtonText}>
                  {isRefreshing ? 'Loading' : 'Reload'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.composerWrapper}>
            <View style={styles.composer}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Message specialist"
                placeholderTextColor="#A6A8B0"
                multiline
                maxLength={1000}
                returnKeyType="default"
                style={styles.textInput}
                textAlignVertical="center"
              />

              <Pressable
                onPress={sendMessage}
                hitSlop={8}
                disabled={!input.trim() || isSending}
                style={styles.sendButton}
              >
                {isSending ? (
                  <ActivityIndicator color={SEND_ACTIVE} size="small" />
                ) : (
                  <Send
                    size={20}
                    strokeWidth={2.2}
                    color={input.trim() ? SEND_ACTIVE : '#101B35'}
                  />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NAVY,
  },
  container: {
    flex: 1,
    backgroundColor: NAVY,
  },
  header: {
    height: 88,
    backgroundColor: NAVY,
    paddingHorizontal: 18,
    paddingTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 32,
    height: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '700',
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: SEND_ACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: SEND_ACTIVE,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  chatSurface: {
    flex: 1,
    backgroundColor: SURFACE,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    overflow: 'hidden',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: 34,
    paddingBottom: 22,
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 16,
  },
  messageRowSpecialist: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    marginRight: 13,
    marginTop: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  bubble: {
    maxWidth: '76%',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  incomingBubble: {
    backgroundColor: INCOMING,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 19,
    borderBottomRightRadius: 19,
    borderBottomLeftRadius: 19,
  },
  outgoingBubble: {
    backgroundColor: NAVY,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    shadowColor: NAVY,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  messageText: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  incomingText: {
    color: TEXT,
    fontWeight: '500',
  },
  outgoingText: {
    color: WHITE,
    fontWeight: '500',
  },
  messageStatus: {
    color: 'rgba(33,38,37,0.55)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 5,
    textAlign: 'right',
  },
  failedStatus: {
    color: ERROR,
  },
  systemRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  systemText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  composerWrapper: {
    backgroundColor: SURFACE,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 9 : 10,
  },
  composer: {
    minHeight: 42,
    borderRadius: 23,
    backgroundColor: '#F0F1F5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    paddingHorizontal: 5,
    paddingVertical: 8,
    color: TEXT,
    fontSize: 14,
    fontWeight: '500',
  },
  sendButton: {
    width: 34,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: ERROR,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  syncDebugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  syncDebugText: {
    flex: 1,
    color: MUTED,
    fontSize: 10,
    lineHeight: 14,
  },
  syncDebugButton: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7F4FC',
  },
  syncDebugButtonText: {
    color: SEND_ACTIVE,
    fontSize: 10,
    fontWeight: '700',
  },
});
