import { supabase } from '../utils/supabase';

export interface TelegramConnection {
  id: string;
  specialist_name: string;
  connection_code?: string | null;
  telegram_user_id?: string | null;
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
  telegram_first_name?: string | null;
  telegram_last_name?: string | null;
  status: 'pending' | 'connected' | 'expired' | 'disconnected';
  created_at?: string;
  connected_at?: string | null;
  expires_at?: string;
  updated_at?: string;
}

export interface TelegramConnectionResponse {
  success: boolean;
  connection?: TelegramConnection;
  bot_username?: string;
  bot_link?: string;
  error?: string;
}

export interface SpecialistConsultationMessage {
  id: string;
  patient_user_id: string;
  specialist_connection_id: string;
  direction: 'patient_to_specialist' | 'specialist_to_patient';
  message: string;
  telegram_message_id?: string | null;
  reply_to_telegram_message_id?: string | null;
  created_at: string;
}

type CreateSpecialistTelegramLinkResponse = {
  success: boolean;
  specialist?: {
    id: string;
    name: string;
    status: TelegramConnection['status'];
  };
  connection?: TelegramConnection;
  connection_code?: string;
  telegram_link?: string;
  bot_link?: string;
  bot_username?: string;
  expires_at?: string;
  error?: string;
};

const TELEGRAM_BOT_USERNAME = process.env.EXPO_PUBLIC_TELEGRAM_BOT_USERNAME;

const getSupabaseErrorMessage = async (error: unknown, fallback: string) => {
  if (
    error &&
    typeof error === 'object' &&
    'context' in error &&
    (error as { context?: unknown }).context instanceof Response
  ) {
    try {
      const body = await (error as { context: Response }).context.json();

      if (body && typeof body === 'object' && 'error' in body) {
        return String((body as { error?: unknown }).error);
      }

      if (body && typeof body === 'object' && 'message' in body) {
        return String((body as { message?: unknown }).message);
      }
    } catch {
      // Fall through to the SDK error message below.
    }
  }

  if (error instanceof Error) return error.message;

  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message);
  }

  return fallback;
};

export async function createTelegramConnection(
  specialistName: string,
): Promise<TelegramConnectionResponse> {
  try {
    const name = specialistName.trim();

    if (!name) {
      throw new Error('Specialist name is required.');
    }

    const { data, error } =
      await supabase.functions.invoke<CreateSpecialistTelegramLinkResponse>(
        'create-specialist-telegram-link',
        {
          body: {
            specialist_name: name,
          },
        },
      );

    if (error) {
      throw new Error(
        await getSupabaseErrorMessage(
          error,
          'Unable to create Telegram connection.',
        ),
      );
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Unable to create Telegram connection.');
    }

    const connectionCode = data.connection_code;
    const connection =
      data.connection ??
      (data.specialist
        ? {
            id: data.specialist.id,
            specialist_name: data.specialist.name,
            status: data.specialist.status,
            connection_code: connectionCode ?? null,
            expires_at: data.expires_at,
          }
        : undefined);

    const botLink =
      data.telegram_link ||
      data.bot_link ||
      (TELEGRAM_BOT_USERNAME && connectionCode
        ? getTelegramBotLink(connectionCode) ?? undefined
        : undefined);

    return {
      success: true,
      connection,
      bot_username: data.bot_username || TELEGRAM_BOT_USERNAME,
      bot_link: botLink,
    };
  } catch (error) {
    console.error('createTelegramConnection:', error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Something went wrong while connecting Telegram.',
    };
  }
}

export async function getTelegramConnection(
  connectionId: string,
): Promise<TelegramConnectionResponse> {
  try {
    if (!connectionId) {
      throw new Error('Connection ID is required.');
    }

    const { data, error } = await supabase
      .from('specialist_telegram_connections')
      .select('*')
      .eq('id', connectionId)
      .maybeSingle();

    if (error) {
      throw new Error(
        await getSupabaseErrorMessage(
          error,
          'Unable to check Telegram connection.',
        ),
      );
    }

    return {
      success: true,
      connection: data ?? undefined,
      bot_username: TELEGRAM_BOT_USERNAME,
    };
  } catch (error) {
    console.error('getTelegramConnection:', error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to check Telegram connection.',
    };
  }
}

export async function sendTelegramMessage(params: {
  message: string;
}): Promise<{
  success: boolean;
  consultation_message?: SpecialistConsultationMessage;
  telegram_message_id?: string;
  error?: string;
}> {
  try {
    if (!params.message.trim()) {
      throw new Error('Message cannot be empty.');
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    const { data, error } = await supabase.functions.invoke(
      'send-specialist-telegram-message',
      {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
        body: {
          message: params.message.trim(),
        },
      },
    );

    if (error) {
      throw new Error(
        await getSupabaseErrorMessage(
          error,
          'Unable to send message to specialist.',
        ),
      );
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Unable to send message to specialist.');
    }

    return {
      success: true,
      consultation_message: data.consultation_message,
      telegram_message_id: data.telegram_message_id
        ? String(data.telegram_message_id)
        : undefined,
    };
  } catch (error) {
    console.error('sendTelegramMessage:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unable to send message.',
    };
  }
}

export async function getSpecialistConsultationMessages(patientUserId?: string): Promise<{
  success: boolean;
  messages: SpecialistConsultationMessage[];
  error?: string;
}> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      throw new Error('Please sign in to view specialist messages.');
    }

    const { data: functionData, error: functionError } =
      await supabase.functions.invoke('get-specialist-consultation-messages', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

    if (!functionError && functionData?.success) {
      return {
        success: true,
        messages: (functionData.messages ?? []) as SpecialistConsultationMessage[],
      };
    }

    if (functionError) {
      console.log(
        'getSpecialistConsultationMessages function fallback:',
        await getSupabaseErrorMessage(
          functionError,
          'Unable to load specialist messages.',
        ),
      );
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = patientUserId ?? userData.user?.id;

    if (!userId) {
      throw new Error('Please sign in to view specialist messages.');
    }

    const { data, error } = await supabase
      .from('specialist_consultation_messages')
      .select(
        'id, patient_user_id, specialist_connection_id, direction, message, telegram_message_id, reply_to_telegram_message_id, created_at',
      )
      .eq('patient_user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(
        await getSupabaseErrorMessage(
          error,
          'Unable to load specialist messages.',
        ),
      );
    }

    return {
      success: true,
      messages: (data ?? []) as SpecialistConsultationMessage[],
    };
  } catch (error) {
    console.error('getSpecialistConsultationMessages:', error);

    return {
      success: false,
      messages: [],
      error:
        error instanceof Error
          ? error.message
          : 'Unable to load specialist messages.',
    };
  }
}

export function getTelegramBotLink(connectionCode: string): string | null {
  if (!TELEGRAM_BOT_USERNAME) {
    return null;
  }

  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(
    connectionCode,
  )}`;
}

export async function disconnectTelegram(
  connectionId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!connectionId) {
      throw new Error('Connection ID is required.');
    }

    const { error } = await supabase
      .from('specialist_telegram_connections')
      .update({
        status: 'disconnected',
      })
      .eq('id', connectionId)
      .eq('status', 'connected');

    if (error) {
      throw new Error(
        await getSupabaseErrorMessage(error, 'Unable to disconnect Telegram.'),
      );
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('disconnectTelegram:', error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to disconnect Telegram.',
    };
  }
}
