import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  Check,
  ChevronLeft,
  CirclePlus,
  Image as ImageIcon,
  Mic,
  MoreVertical,
  Send,
} from 'lucide-react-native';

type Message = {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time?: string;
};

// type Message = {
//   id: string;
//   text: string;
//   sender: 'me' | 'specialist';
//   time?: string;
//   createdAt: string;
// };

const NAVY = '#b1dcf7';
const NAVY_DARK = '#06185A';
const WHITE = '#212625';
const INCOMING = '#EFF0F5';
const TEXT = '#20242C';
const MUTED = '#A4A6AE';
const SEND_ACTIVE = '#1E90FF';


const AVATAR =
  '../assets/specialist.png';


const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'them',
    text: `Hey! Are you free next weekend? There's this cool flea market that I want to check out. You would love it, too! It's known for all its great vintage finds!!!`,
    time: '8:15 PM',
  },
  {
    id: '2',
    sender: 'me',
    text: `OMG! You know I have been looking to go to one of those for a while now! I'm so down!!`,
  },
  {
    id: '3',
    sender: 'me',
    text: `I'm free on Saturday, what time were you thinking?`,
  },
  {
    id: '4',
    sender: 'them',
    text: `I have a birthday lunch on Saturday, so I'm thinking we can meet up and go after that! Maybe 1:30?`,
  },
  {
    id: '5',
    sender: 'me',
    text: `1:30 is perfect!!! I can't wait.`,
  },
];

// const [messages, setMessages] = useState<Message[]>([]);
// useEffect(() => {
//   loadMessages();
// }, [conversationId]);

// const loadMessages = async () => {
//   const { data, error } = await supabase
//     .from('specialist_messages')
//     .select('*')
//     .eq('conversation_id', conversationId)
//     .order('created_at', {
//       ascending: true,
//     });

//   if (error) {
//     console.error(error);
//     return;
//   }

//   setMessages(
//     (data ?? []).map(message => ({
//       id: message.id,
//       text: message.message,
//       sender:
//         message.sender_type === 'user'
//           ? 'me'
//           : 'specialist',
//       createdAt: message.created_at,
//     }))
//   );
// };

const AnimatedBubble = Animated.createAnimatedComponent(View);

type MessageBubbleProps = {
  message: Message;
  index: number;
  compact: boolean;
};

function MessageBubble({
  message,
  index,
  compact,
}: MessageBubbleProps) {
  const isMine = message.sender === 'me';

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
          <Image source={require("../assets/specialist.png")} style={styles.avatar} />
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
          {message.text}
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

function Composer({
  value,
  onChangeText,
  onSend,
}: ComposerProps) {
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
        {/* Plus button */}
        <Pressable
          hitSlop={10}
          style={styles.composerIconButton}
          android_ripple={{ color: '#D9DCE5', borderless: true }}
        >
          <CirclePlus
            size={21}
            strokeWidth={2.1}
            color="#242A34"
          />
        </Pressable>

        {/* Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder=""
          placeholderTextColor="#A6A8B0"
          multiline
          maxLength={1000}
          returnKeyType="default"
          style={styles.textInput}
          textAlignVertical="center"
        />

        {/* Image */}
        <Pressable
          hitSlop={8}
          style={styles.composerIconButton}
        >
          <ImageIcon
            size={21}
            strokeWidth={2.15}
            color="#242A34"
          />
        </Pressable>

        {/* Send */}
        <Pressable
          onPress={canSend ? onSend : undefined}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          hitSlop={8}
          disabled={!canSend}
        >
          <Animated.View style={sendAnimatedStyle}>
            <Send
              size={20}
              strokeWidth={2.2}
              color={canSend ? SEND_ACTIVE : '#101B35'}
            />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}


export default function ChatScreen() {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation();

  const [messages, setMessages] =
    useState<Message[]>(INITIAL_MESSAGES);

  const [input, setInput] = useState('');
  const compact = width < 380;

  const horizontalPadding = useMemo(() => {
    if (width >= 700) return Math.min(width * 0.08, 70);
    if (width >= 500) return 28;
    return 16;
  }, [width]);

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();

    if (!trimmed) return;

    const newMessage: Message = {
      id: `${Date.now()}`,
      sender: 'me',
      text: trimmed,
    };

    setMessages(previous => [...previous, newMessage]);
    setInput('');
  }, [input]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={NAVY}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        keyboardVerticalOffset={
          Platform.OS === 'ios' ? 0 : 0
        }
      >

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              hitSlop={12}
              style={styles.backButton}
              onPress={() => navigation.navigate('XDermaChatLanding' as never)}
            >
              <ChevronLeft
                size={25}
                color={WHITE}
                strokeWidth={2.2}
              />
            </Pressable>

            <View style={styles.titleGroup}>
              <Text style={styles.headerTitle}>
                XDerma Specialist
              </Text>
              <View style={styles.verifiedBadge}>
                <Check size={10} color="#FFFFFF" strokeWidth={3} />
              </View>
            </View>
          </View>

          <Pressable hitSlop={12}>
            <MoreVertical
              size={22}
              color={WHITE}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* CHAT                                                             */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.chatSurface}>
          <ScrollView
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
            onContentSizeChange={event => {
              // Scroll behavior is intentionally handled by RN's native
              // content-size system. New messages are also rendered with
              // an entrance animation.
            }}
          >
            {/* Time separator */}
            <Animated.Text
              entering={FadeIn.duration(450)}
              style={styles.timeLabel}
            >
              8:15 PM
            </Animated.Text>

            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                index={index}
                compact={compact}
              />
            ))}
          </ScrollView>

          {/* ---------------------------------------------------------------- */}
          {/* INPUT                                                            */}
          {/* ---------------------------------------------------------------- */}

          <Composer
            value={input}
            onChangeText={setInput}
            onSend={sendMessage}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NAVY,
  },

  container: {
    flex: 1,
    backgroundColor: NAVY,
  },

  /* ---------------------------------------------------------------------- */
  /* Header                                                                 */
  /* ---------------------------------------------------------------------- */

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

  headerBadge: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: '#C92845',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 1,
    marginRight: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  headerBadgeText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '800',
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

  headerBubble: {
    position: 'absolute',
    right: 21,
    bottom: -21,
    backgroundColor: NAVY,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    width: 170,
    zIndex: 2,
  },

  headerBubbleText: {
    color: '#E7EBFF',
    fontSize: 10,
    fontWeight: '500',
  },

  /* ---------------------------------------------------------------------- */
  /* Chat surface                                                            */
  /* ---------------------------------------------------------------------- */

  chatSurface: {
    flex: 1,
    backgroundColor: WHITE,
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

  /* ---------------------------------------------------------------------- */
  /* Messages                                                                */
  /* ---------------------------------------------------------------------- */

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

  /*
   * The screenshot uses slightly tighter outgoing bubbles.
   */
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

  /* ---------------------------------------------------------------------- */
  /* Composer                                                                */
  /* ---------------------------------------------------------------------- */

  composerWrapper: {
    backgroundColor: WHITE,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom:
      Platform.OS === 'ios' ? 9 : 10,
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