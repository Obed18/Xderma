import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AiChatHistoryMessage,
  AiChatScanContext,
  sendAiChatMessage,
} from '../services/aiChatApi';
import {
  getAiChatConversations,
  saveAiChatConversation,
} from '../services/aiChatHistoryService';
import {
  decryptChatJson,
  encryptChatJson,
  isEncryptedChatPayload,
} from '../utils/chatEncryption';

import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {
  Check,
  ChevronLeft,
  CirclePlus,
  Image as ImageIcon,
  MoreVertical,
  Send,
} from 'lucide-react-native';

type ChatMessage = {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  card?: 'condition' | 'diagnosis' | 'image';
};

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  messages: ChatMessage[];
};

type ConsultationRouteParams = {
  consultation?: {
    initialMessage?: string;
    latestScan?: AiChatScanContext;
  };
};

const CHAT_STORAGE_KEY = 'xderma.ai.conversations';
const CURRENT_CHAT_STORAGE_KEY = 'xderma.ai.currentConversation';
const CHAT_STORAGE_SCOPE = 'ai-local-conversations';
const CURRENT_CHAT_STORAGE_SCOPE = 'ai-local-current-conversation';
const ACTIVE_USER_ID = 'local-xderma-user';

const NAVY = '#b1dcf7';
const WHITE = '#212625';
const INCOMING = '#EFF0F5';
const TEXT = '#20242C';
const SEND_ACTIVE = '#1E90FF';

const promptStarters = [
  { label: 'Explain my diagnosis', prompt: 'Explain my latest diagnosis.' },
  { label: 'What is melanoma?', prompt: 'What is melanoma?' },
  { label: 'Skin care advice', prompt: 'Give me skin care advice.' },
  { label: 'Prevention tips', prompt: 'How can I prevent this condition?' },
];

const followUpChips = [
  'Symptoms',
  'Causes',
  'Treatment',
  'Prevention',
  'Is it contagious?',
];

function makeConversation(
  title: string,
  messages: ChatMessage[]
): Conversation {
  const now = new Date().toISOString();
  return {
    id: `conversation-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title,
    created_at: now,
    updated_at: now,
    user_id: ACTIVE_USER_ID,
    messages,
  };
}

function generateChatTitle(messages: ChatMessage[]) {
  const firstUserMessage = messages.find(
    (message) => message.sender === 'user'
  );

  if (!firstUserMessage) {
    return null;
  }

  const cleanTitle = firstUserMessage.text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s?-]/g, '')
    .trim();

  if (!cleanTitle) {
    return 'New dermatology chat';
  }

  return cleanTitle.length > 34
    ? `${cleanTitle.slice(0, 31)}...`
    : cleanTitle;
}

type MessageBubbleProps = {
  message: ChatMessage;
  index: number;
  compact: boolean;
};

type FormattedTextToken = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  heading?: boolean;
};

function parseInlineFormattedText(text: string): FormattedTextToken[] {
  const tokens: FormattedTextToken[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const boldMarker = text.startsWith('**', cursor)
      ? '**'
      : text.startsWith('__', cursor)
        ? '__'
        : null;

    if (boldMarker) {
      const end = text.indexOf(boldMarker, cursor + boldMarker.length);

      if (end > cursor + boldMarker.length) {
        tokens.push({
          text: text.slice(cursor + boldMarker.length, end),
          bold: true,
        });
        cursor = end + boldMarker.length;
        continue;
      }
    }

    if (
      text[cursor] === '*' &&
      text[cursor + 1] !== '*' &&
      text[cursor + 1] !== ' '
    ) {
      const end = text.indexOf('*', cursor + 1);

      if (end > cursor + 1 && text[end - 1] !== ' ') {
        tokens.push({
          text: text.slice(cursor + 1, end),
          italic: true,
        });
        cursor = end + 1;
        continue;
      }
    }

    const nextBoldAsterisk = text.indexOf('**', cursor + 1);
    const nextBoldUnderscore = text.indexOf('__', cursor + 1);
    const nextItalic = text.indexOf('*', cursor + 1);
    const nextMarkers = [
      nextBoldAsterisk,
      nextBoldUnderscore,
      nextItalic,
    ].filter((index) => index !== -1);
    const nextCursor =
      nextMarkers.length > 0 ? Math.min(...nextMarkers) : text.length;

    tokens.push({
      text: text.slice(cursor, nextCursor),
    });
    cursor = nextCursor;
  }

  return tokens.filter((token) => token.text.length > 0);
}

function parseFormattedText(text: string): FormattedTextToken[] {
  return text.split('\n').flatMap((line, lineIndex) => {
    const tokens: FormattedTextToken[] = [];

    if (lineIndex > 0) {
      tokens.push({ text: '\n' });
    }

    const headingMatch = line.match(/^\s{0,3}#{1,6}\s+(.+)$/);

    if (headingMatch) {
      tokens.push(
        ...parseInlineFormattedText(headingMatch[1]).map((token) => ({
          ...token,
          bold: true,
          heading: true,
        }))
      );
      return tokens;
    }

    tokens.push(...parseInlineFormattedText(line));
    return tokens;
  });
}

function FormattedMessageText({ text }: { text: string }) {
  return (
    <>
      {parseFormattedText(text).map((token, index) => (
        <Text
          key={`${index}-${token.text}`}
          style={[
            token.bold && styles.formattedBold,
            token.italic && styles.formattedItalic,
            token.heading && styles.formattedHeading,
          ]}
        >
          {token.text}
        </Text>
      ))}
    </>
  );
}

function MessageBubble({ message, index, compact }: MessageBubbleProps) {
  const isMine = message.sender === 'user';

  return (
    <Animated.View
      entering={
        isMine
          ? FadeInUp.duration(350).springify().damping(17)
          : FadeInDown.duration(350).springify().damping(17)
      }
      layout={LinearTransition.springify().damping(18)}
      style={[
        styles.messageRow,
        isMine ? styles.messageRowMine : styles.messageRowThem,
      ]}
    >
      {!isMine && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.avatarWrapper}
        >
          <Image
            source={require('../assets/xderma-icon.png')}
            style={styles.avatar}
          />
        </Animated.View>
      )}

      <View
        style={[
          styles.bubble,
          isMine ? styles.outgoingBubble : styles.incomingBubble,
          compact && styles.compactBubble,
          isMine && index === 1 && styles.firstOutgoingBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isMine ? styles.outgoingText : styles.incomingText,
            compact && styles.compactText,
          ]}
        >
          <FormattedMessageText text={message.text} />
        </Text>
      </View>
    </Animated.View>
  );
}

type ComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
};

const Composer = React.memo(function Composer({ value, onChangeText, onSend }: ComposerProps) {
  const sendScale = useSharedValue(1);

  const sendAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handlePressIn = () => {
    sendScale.value = withSpring(0.88);
  };

  const handlePressOut = () => {
    sendScale.value = withSpring(1);
  };

  const canSend = value.trim().length > 0;

  return (
    <View style={styles.composerWrapper}>
      <View style={styles.composer}>
        <Pressable
          hitSlop={10}
          style={styles.composerIconButton}
          android_ripple={{ color: '#D9DCE5', borderless: true }}
        >
          <CirclePlus size={21} strokeWidth={2.1} color="#242A34" />
        </Pressable>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Message XDerma AI..."
          placeholderTextColor="#A6A8B0"
          multiline
          maxLength={1000}
          returnKeyType="default"
          style={styles.textInput}
          textAlignVertical="center"
        />

        <Pressable hitSlop={8} style={styles.composerIconButton}>
          <ImageIcon size={21} strokeWidth={2.15} color="#242A34" />
        </Pressable>

        <Pressable
          onPress={canSend ? () => onSend() : undefined}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          hitSlop={8}
          disabled={!canSend}
        >
          <Animated.View style={sendAnimatedStyle}>
            <Send size={20} strokeWidth={2.2} color={canSend ? SEND_ACTIVE : '#101B35'} />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
});

const AiChatScreen: React.FC<{ route?: { params?: ConsultationRouteParams } }> = ({
  route,
}) => {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(
    `conversation-${Date.now()}`
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const activeConversationIdRef = useRef(activeConversationId);
  const conversationsRef = useRef<Conversation[]>([]);
  const handledConsultationRef = useRef<string | null>(null);

  const compact = width < 380;
  const hasUserMessages = messages.some((message) => message.sender === 'user');

  const horizontalPadding = useMemo(() => {
    if (width >= 700) return Math.min(width * 0.08, 70);
    if (width >= 500) return 28;
    return 16;
  }, [width]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    const hydrateConversations = async () => {
      try {
        const [storedConversations, storedCurrent] = await Promise.all([
          AsyncStorage.getItem(CHAT_STORAGE_KEY),
          AsyncStorage.getItem(CURRENT_CHAT_STORAGE_KEY),
        ]);

        if (storedConversations) {
          const parsed = isEncryptedChatPayload(storedConversations)
            ? await decryptChatJson<Conversation[]>(
                storedConversations,
                CHAT_STORAGE_SCOPE
              )
            : (JSON.parse(storedConversations) as Conversation[]);

          if (Array.isArray(parsed) && parsed.length > 0) {
            setConversations(parsed);
          }
        }

        if (storedCurrent) {
          const parsedCurrent = isEncryptedChatPayload(storedCurrent)
            ? await decryptChatJson<{
                id: string;
                messages: ChatMessage[];
              }>(storedCurrent, CURRENT_CHAT_STORAGE_SCOPE)
            : (JSON.parse(storedCurrent) as {
                id: string;
                messages: ChatMessage[];
              });

          if (parsedCurrent?.id && Array.isArray(parsedCurrent.messages)) {
            setActiveConversationId(parsedCurrent.id);
            setMessages(parsedCurrent.messages);
          }
        }

        const cloudConversations = await getAiChatConversations();

        if (cloudConversations.length > 0) {
          const cloudConversationList = cloudConversations as Conversation[];
          const latestConversation = cloudConversationList[0];

          setConversations(cloudConversationList);
          setActiveConversationId(latestConversation.id);
          setMessages(latestConversation.messages);
        }
      } catch {
        Alert.alert(
          'Chat History',
          'Your saved chats could not be loaded on this device.'
        );
      } finally {
        setIsHydrated(true);
      }
    };

    hydrateConversations();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void encryptChatJson(conversations, CHAT_STORAGE_SCOPE)
      .then((encryptedConversations) =>
        AsyncStorage.setItem(CHAT_STORAGE_KEY, encryptedConversations)
      )
      .catch((error) => {
        console.log('Could not encrypt AI chat history', error);
      });
  }, [conversations, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void encryptChatJson(
      { id: activeConversationId, messages },
      CURRENT_CHAT_STORAGE_SCOPE
    )
      .then((encryptedCurrentChat) =>
        AsyncStorage.setItem(CURRENT_CHAT_STORAGE_KEY, encryptedCurrentChat)
      )
      .catch((error) => {
        console.log('Could not encrypt current AI chat', error);
      });
  }, [activeConversationId, isHydrated, messages]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages, isThinking]);

  const persistConversationToCloud = useCallback(
    (conversation: Conversation) => {
      void saveAiChatConversation(conversation)
        .then((savedConversation) => {
          if (!savedConversation || savedConversation.id === conversation.id) {
            return;
          }

          const saved = savedConversation as Conversation;

          setConversations((current) => {
            const nextConversations = current.map((item) =>
              item.id === conversation.id ? saved : item
            );
            conversationsRef.current = nextConversations;
            return nextConversations;
          });

          if (activeConversationIdRef.current === conversation.id) {
            activeConversationIdRef.current = saved.id;
            setActiveConversationId(saved.id);
          }
        })
        .catch((error) => {
          console.log('Could not sync AI chat history', error);
        });
    },
    []
  );

  const syncConversation = useCallback((nextMessages: ChatMessage[]) => {
    const savedMessages = nextMessages.filter((message) => message.sender);

    if (savedMessages.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const activeId = activeConversationIdRef.current;
    const current = conversationsRef.current;
    const existing = current.find(
      (conversation) => conversation.id === activeId
    );
    const title =
      existing?.title ?? generateChatTitle(savedMessages) ?? 'New conversation';
    const nextConversation: Conversation = {
      id: activeId,
      title,
      created_at: existing?.created_at ?? now,
      updated_at: now,
      user_id: existing?.user_id ?? ACTIVE_USER_ID,
      messages: savedMessages,
    };
    const nextConversations = [
      nextConversation,
      ...current.filter((conversation) => conversation.id !== activeId),
    ];

    conversationsRef.current = nextConversations;
    setConversations(nextConversations);
    persistConversationToCloud(nextConversation);
  }, [persistConversationToCloud]);

  const handleSend = useCallback(async (
    messageText?: string,
    options?: {
      baseMessages?: ChatMessage[];
      latestScan?: AiChatScanContext;
    }
  ) => {
    const trimmed = (messageText ?? input).trim();

    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toISOString(),
      text: trimmed,
    };

    const userMessages = [...(options?.baseMessages ?? messages), userMessage];
    setMessages(userMessages);
    syncConversation(userMessages);
    setInput('');
    setIsThinking(true);

    try {
      const chatHistory: AiChatHistoryMessage[] = userMessages.map(
        (message) => ({
          sender: message.sender,
          text: message.text,
        })
      );
      const response = await sendAiChatMessage({
        message: trimmed,
        conversationId: activeConversationIdRef.current,
        messages: chatHistory,
        latestScan: options?.latestScan,
      });
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        text: response.message,
      };

      setMessages((current) => {
        const nextMessages = [...current, aiMessage];
        syncConversation(nextMessages);
        return nextMessages;
      });
    } catch (error) {
      const detail =
        error instanceof Error
          ? error.message
          : 'XDerma AI could not answer right now.';
      const aiMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        text: detail,
      };

      setMessages((current) => {
        const nextMessages = [...current, aiMessage];
        syncConversation(nextMessages);
        return nextMessages;
      });
      Alert.alert('XDerma AI', detail);
    } finally {
      setIsThinking(false);
    }
  }, [input, messages, syncConversation]);

  useEffect(() => {
    if (!isHydrated) return;

    const consultation = route?.params?.consultation;
    const initialMessage = consultation?.initialMessage?.trim();

    if (!initialMessage) return;
    if (handledConsultationRef.current === initialMessage) return;

    handledConsultationRef.current = initialMessage;

    syncConversation(messages);
    const nextConversationId = `conversation-consultation-${Date.now()}`;
    activeConversationIdRef.current = nextConversationId;
    setActiveConversationId(nextConversationId);
    setMessages([]);
    setInput('');
    setIsThinking(false);

    void handleSend(initialMessage, {
      baseMessages: [],
      latestScan: consultation?.latestScan,
    });
  }, [
    handleSend,
    isHydrated,
    messages,
    route?.params?.consultation,
    syncConversation,
  ]);

  const handleNewChat = () => {
    syncConversation(messages);
    const nextConversationId = `conversation-${Date.now()}`;
    activeConversationIdRef.current = nextConversationId;
    setActiveConversationId(nextConversationId);
    setMessages([]);
    setInput('');
    setIsThinking(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable hitSlop={12} style={styles.backButton}>
              <ChevronLeft size={25} color={WHITE} strokeWidth={2.2} />
            </Pressable>

            <View style={styles.titleGroup}>
              <Text style={styles.headerTitle}>XDerma AI</Text>
              <View style={styles.verifiedBadge}>
                <Check size={10} color="#FFFFFF" strokeWidth={3} />
              </View>
            </View>
          </View>

          <Pressable hitSlop={12} onPress={handleNewChat}>
            <MoreVertical size={22} color={WHITE} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.chatSurface}>
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={[
              styles.messagesContent,
              {
                paddingHorizontal: horizontalPadding,
                paddingBottom: 22,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets
          >
            {messages.length === 0 ? (
              <Animated.View
                entering={FadeIn.duration(400)}
                style={styles.emptyState}
              >
                <Text style={styles.emptyGreeting}>Hello!</Text>
                <Text style={styles.emptyTitle}>
                  How can I help you today?
                </Text>

                <View style={styles.promptGrid}>
                  {promptStarters.map((item) => (
                    <Pressable
                      key={item.label}
                      style={styles.promptButton}
                      onPress={() => {
                        handleSend(item.prompt);
                      }}
                    >
                      <Text style={styles.promptText}>{item.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            ) : (
              <>
                <Animated.Text
                  entering={FadeIn.duration(450)}
                  style={styles.timeLabel}
                >
                  Today
                </Animated.Text>

                {messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    index={index}
                    compact={compact}
                  />
                ))}

                {isThinking ? (
                  <Animated.View
                    entering={FadeInUp.duration(350).springify().damping(17)}
                    style={styles.thinkingRow}
                  >
                    <Animated.View
                      entering={FadeIn.duration(300)}
                      style={styles.avatarWrapper}
                    >
                      <Image
                        source={require('../assets/xderma-icon.png')}
                        style={styles.avatar}
                      />
                    </Animated.View>
                    <View style={[styles.bubble, styles.incomingBubble]}>
                      <Text style={[styles.messageText, styles.incomingText]}>
                        Analyzing your question...
                      </Text>
                    </View>
                  </Animated.View>
                ) : null}

                {!isThinking && hasUserMessages ? (
                  <View style={styles.chipRow}>
                    {followUpChips.map((chip) => (
                      <Pressable
                        key={chip}
                        style={styles.followUpChip}
                        onPress={() => {
                          setInput(chip);
                        }}
                      >
                        <Text style={styles.followUpText}>{chip}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>

          <Composer
            value={input}
            onChangeText={setInput}
            onSend={handleSend}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AiChatScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NAVY,
  },

  container: {
    flex: 1,
    backgroundColor: "NAVY",
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
    letterSpacing: -0.2,
  },

  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1E90FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#1E90FF',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  chatSurface: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    overflow: 'hidden',
  },

  messages: {
    flex: 1,
  },

  messagesContent: {
    paddingTop: 47,
  },

  timeLabel: {
    alignSelf: 'center',
    color: '#9C9EA6',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 27,
  },

  messageRow: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 16,
  },

  messageRowThem: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },

  messageRowMine: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },

  thinkingRow: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
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

  firstOutgoingBubble: {
    marginTop: -1,
  },

  compactBubble: {
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  messageText: {
    fontSize: 12.5,
    lineHeight: 17,
    letterSpacing: -0.05,
  },

  incomingText: {
    color: TEXT,
    fontWeight: '500',
  },

  outgoingText: {
    color: WHITE,
    fontWeight: '500',
  },

  compactText: {
    fontSize: 12,
    lineHeight: 16,
  },

  formattedBold: {
    fontWeight: '800',
  },

  formattedItalic: {
    fontStyle: 'italic',
  },

  formattedHeading: {
    fontSize: 13.5,
    lineHeight: 19,
  },

  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 42,
  },

  emptyGreeting: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
  },

  emptyTitle: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 24,
    marginTop: 6,
  },

  promptGrid: {
    gap: 10,
    width: '100%',
  },

  promptButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },

  promptText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },

  followUpChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },

  followUpText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '800',
  },

  composerWrapper: {
    backgroundColor: "#fff",
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
    paddingHorizontal: 8,
  },

  composerIconButton: {
    width: 30,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
});
