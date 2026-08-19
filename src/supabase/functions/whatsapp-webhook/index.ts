// import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers":
//     "authorization, x-client-info, apikey, content-type",
// };

// const VERIFY_TOKEN = process.env.get("WHATSAPP_VERIFY_TOKEN");

// const SUPABASE_URL = process.env.get("SUPABASE_URL")!;
// const SUPABASE_SERVICE_ROLE_KEY = process.env.get(
//   "SUPABASE_SERVICE_ROLE_KEY"
// )!;

// const supabase = createClient(
//   SUPABASE_URL,
//   SUPABASE_SERVICE_ROLE_KEY
// );

// serve(async (req: Request) => {
//   try {
//     /*
//      * ------------------------------------------------------------
//      * CORS
//      * ------------------------------------------------------------
//      */

//     if (req.method === "OPTIONS") {
//       return new Response("ok", {
//         headers: corsHeaders,
//       });
//     }

//     /*
//      * ------------------------------------------------------------
//      * META WEBHOOK VERIFICATION
//      *
//      * Meta sends:
//      *
//      * hub.mode
//      * hub.verify_token
//      * hub.challenge
//      * ------------------------------------------------------------
//      */

//     if (req.method === "GET") {
//       const url = new URL(req.url);

//       const mode = url.searchParams.get("hub.mode");
//       const token = url.searchParams.get("hub.verify_token");
//       const challenge = url.searchParams.get("hub.challenge");

//       console.log("Webhook verification request");

//       if (
//         mode === "subscribe" &&
//         token === VERIFY_TOKEN &&
//         challenge
//       ) {
//         console.log("Webhook verified successfully");

//         return new Response(challenge, {
//           status: 200,
//           headers: {
//             ...corsHeaders,
//             "Content-Type": "text/plain",
//           },
//         });
//       }

//       console.error("Webhook verification failed");

//       return new Response("Forbidden", {
//         status: 403,
//         headers: corsHeaders,
//       });
//     }

//     /*
//      * ------------------------------------------------------------
//      * WHATSAPP WEBHOOK EVENTS
//      * ------------------------------------------------------------
//      */

//     if (req.method === "POST") {
//       const body = await req.json();

//       console.log(
//         "WhatsApp webhook event:",
//         JSON.stringify(body, null, 2)
//       );

//       /*
//        * Meta sends different types of events.
//        *
//        * We're interested in:
//        *
//        * entry
//        *   └── changes
//        *       └── value
//        *           └── messages
//        */

//       const entries = body?.entry ?? [];

//       for (const entry of entries) {
//         const changes = entry?.changes ?? [];

//         for (const change of changes) {
//           const value = change?.value;

//           if (!value) continue;

//           /*
//            * ------------------------------------------------------
//            * INCOMING MESSAGES
//            * ------------------------------------------------------
//            */

//           const messages = value?.messages ?? [];

//           for (const message of messages) {
//             await processIncomingMessage(
//               message,
//               value
//             );
//           }

//           /*
//            * ------------------------------------------------------
//            * MESSAGE STATUS UPDATES
//            * ------------------------------------------------------
//            */

//           const statuses = value?.statuses ?? [];

//           for (const status of statuses) {
//             await processMessageStatus(status);
//           }
//         }
//       }

//       /*
//        * IMPORTANT:
//        *
//        * WhatsApp expects a successful response quickly.
//        */

//       return new Response("EVENT_RECEIVED", {
//         status: 200,
//         headers: {
//           ...corsHeaders,
//           "Content-Type": "text/plain",
//         },
//       });
//     }

//     /*
//      * ------------------------------------------------------------
//      * UNSUPPORTED METHOD
//      * ------------------------------------------------------------
//      */

//     return new Response("Method Not Allowed", {
//       status: 405,
//       headers: corsHeaders,
//     });
//   } catch (error) {
//     console.error(
//       "WhatsApp webhook error:",
//       error
//     );

//     /*
//      * Even if our internal processing fails, we should be
//      * careful about repeatedly returning errors to Meta.
//      *
//      * We'll improve retry/error handling later.
//      */

//     return new Response("EVENT_RECEIVED", {
//       status: 200,
//       headers: {
//         ...corsHeaders,
//         "Content-Type": "text/plain",
//       },
//     });
//   }
// });


// /*
//  * =================================================================
//  * PROCESS INCOMING WHATSAPP MESSAGE
//  * =================================================================
//  */

// async function processIncomingMessage(
//   message: any,
//   value: any
// ) {
//   console.log(
//     "Incoming WhatsApp message:",
//     JSON.stringify(message, null, 2)
//   );

//   const whatsappMessageId = message?.id;

//   const whatsappPhone = message?.from;

//   if (!whatsappMessageId || !whatsappPhone) {
//     console.warn(
//       "Incoming message missing ID or phone number"
//     );

//     return;
//   }

//   /*
//    * --------------------------------------------------------------
//    * Currently we support text messages.
//    * --------------------------------------------------------------
//    */

//   let messageText = "";

//   if (message.type === "text") {
//     messageText =
//       message?.text?.body?.trim() ?? "";
//   }

//   /*
//    * Later we can support:
//    *
//    * image
//    * document
//    * audio
//    * video
//    *
//    * from WhatsApp.
//    */

//   if (!messageText) {
//     console.log(
//       `Unsupported/empty WhatsApp message type: ${message.type}`
//     );

//     return;
//   }

//   /*
//    * --------------------------------------------------------------
//    * FIND XDERMA CONVERSATION
//    * --------------------------------------------------------------
//    */

//   const { data: conversation, error } =
//     await supabase
//       .from("specialist_conversations")
//       .select("id, user_id, analysis_id")
//       .eq("whatsapp_phone", whatsappPhone)
//       .eq("status", "active")
//       .maybeSingle();

//   if (error) {
//     console.error(
//       "Failed to find conversation:",
//       error
//     );

//     throw error;
//   }

//   if (!conversation) {
//     console.warn(
//       `No XDerma conversation found for WhatsApp number ${whatsappPhone}`
//     );

//     /*
//      * For now we simply ignore the message.
//      *
//      * Later we can create an "unmatched WhatsApp message"
//      * workflow for specialists.
//      */

//     return;
//   }

//   /*
//    * --------------------------------------------------------------
//    * PREVENT DUPLICATE MESSAGES
//    * --------------------------------------------------------------
//    */

//   const { data: existingMessage } =
//     await supabase
//       .from("specialist_messages")
//       .select("id")
//       .eq(
//         "whatsapp_message_id",
//         whatsappMessageId
//       )
//       .maybeSingle();

//   if (existingMessage) {
//     console.log(
//       "Message already processed:",
//       whatsappMessageId
//     );

//     return;
//   }

//   /*
//    * --------------------------------------------------------------
//    * SAVE SPECIALIST RESPONSE
//    * --------------------------------------------------------------
//    */

//   const { error: insertError } =
//     await supabase
//       .from("specialist_messages")
//       .insert({
//         conversation_id: conversation.id,
//         sender_type: "specialist",
//         message: messageText,
//         whatsapp_message_id:
//           whatsappMessageId,
//         created_at: new Date().toISOString(),
//       });

//   if (insertError) {
//     console.error(
//       "Failed to save specialist message:",
//       insertError
//     );

//     throw insertError;
//   }

//   /*
//    * --------------------------------------------------------------
//    * UPDATE CONVERSATION
//    * --------------------------------------------------------------
//    */

//   const { error: updateError } =
//     await supabase
//       .from("specialist_conversations")
//       .update({
//         updated_at: new Date().toISOString(),
//       })
//       .eq("id", conversation.id);

//   if (updateError) {
//     console.error(
//       "Failed to update conversation:",
//       updateError
//     );
//   }

//   console.log(
//     `Specialist response saved for conversation ${conversation.id}`
//   );
// }


// /*
//  * =================================================================
//  * PROCESS WHATSAPP MESSAGE STATUS
//  * =================================================================
//  */

// async function processMessageStatus(
//   status: any
// ) {
//   console.log(
//     "WhatsApp message status:",
//     JSON.stringify(status, null, 2)
//   );

//   const whatsappMessageId = status?.id;

//   const statusValue = status?.status;

//   if (!whatsappMessageId || !statusValue) {
//     return;
//   }

//   /*
//    * WhatsApp statuses can include:
//    *
//    * sent
//    * delivered
//    * read
//    * failed
//    */

//   if (
//     statusValue === "delivered"
//   ) {
//     await supabase
//       .from("specialist_messages")
//       .update({
//         delivered_at:
//           new Date().toISOString(),
//       })
//       .eq(
//         "whatsapp_message_id",
//         whatsappMessageId
//       );
//   }

//   if (statusValue === "read") {
//     await supabase
//       .from("specialist_messages")
//       .update({
//         read_at:
//           new Date().toISOString(),
//       })
//       .eq(
//         "whatsapp_message_id",
//         whatsappMessageId
//       );
//   }

//   if (statusValue === "failed") {
//     console.error(
//       "WhatsApp message failed:",
//       JSON.stringify(status, null, 2)
//     );
//   }
// }