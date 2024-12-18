import jwt from "jsonwebtoken";
import { pusher } from "../services/pusherClient.js";
import { supabase } from "../services/supabaseClient.js";

const setChat = async (req, res) => {
    const { username, message, chatId, time, token } = req.body;
    
    if (token) {
      const decoded = jwt.verify(token, "secretKey");
      const user_id = decoded.id
    // Envía el mensaje a Pusher
    pusher.trigger(`chat-channel-${chatId}`, "new-message", {
        created_at: time,
        message,
        read: false,
        user_id,
    });

    const { error } = await supabase.from('message').insert([
      { chat_id: chatId, user_id, message },
    ]);

    if (error) {
      res.status(500).send('Error guardando mensaje:', error);
    }
    res.status(200).send("Message sent");
  } else {
    res.status(500).json({ message: 'Error guardando mensaje' });
  }
}

const readMessage = async (req, res) => {
  const { chatId, userId } = req.body;

  // Envía el mensaje a Pusher
  pusher.trigger(`chat-channel-${chatId}`, "message-read", {
    chatId,
    userId,
  });

  const { error } = await supabase
    .from('message')
    .update({ read: true} )
    .eq("chat_id", chatId)
    .eq("user_id", userId)

  if (error) {
    console.error('Error al actualizar el estado del mensaje:', error);
    return res.status(500).send('Error procesando');
  }

  res.status(200).send("Messages read");
}

/*const listenMessagesWebhook = async (req, res) => {
  const { events } = req.body;

  for (const event of events) {
    if (event.event === 'new-message') {
      const { channel, data } = event;
      const chatId = channel.replace('chat-', ''); // Extraer el ID del chat
      const { user_id, message } = JSON.parse(data);

      // Guarda el mensaje en Supabase
      const { error } = await supabase.from('message').insert([
        { chat_id: chatId, user_id, message },
      ]);

      if (error) {
        console.error('Error guardando mensaje:', error);
      } else {
        console.log(`Mensaje guardado en chat ${chatId}:`, message);
      }
    }
  }

  res.status(200).send('OK');
}*/

/*const readMessagesWebhook = async (req, res) => {

  const { events } = req.body; // Los eventos enviados por Pusher

  // Procesar cada evento recibido
  for (const event of events) {
    if (event.name === 'message-read') {
      const { chatId, userId } = event.data;

      // Actualizar el estado del mensaje en la base de datos
      const { error } = await supabase
        .from('message')
        .update({ read: true} )
        .eq("chat_id", chatId)
        .eq("user_id", userId)

      if (error) {
        console.error('Error al actualizar el estado del mensaje:', error);
        return res.status(500).send('Error procesando el webhook');
      }

      console.log(`Mensajes de chat ${chatId} marcado como leído por usuario ${userId}`);
    }
  }

  res.status(200).send('Webhook procesado correctamente');
}*/

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.body;

    const { data: messages, error: messagesError } = await supabase
      .from("message")
      .select("user_id, message, created_at, read")
      .eq("chat_id", chatId);

    if (messagesError) throw messagesError;

    const orderedMessages = messages.sort(
      (a, b) =>
        new Date(a.created_at) -
        new Date(b.created_at)
    );

    console.log("ordered messages", orderedMessages)

    res.status(200).json(orderedMessages);
  } catch(error) {
    return res.status(500).json({ message: "Error al obtener mensajes" });
  }
}

const getChats = async (req, res) => {

  const { token } = req.body;

  if (token) {
    try {
      const decoded = jwt.verify(token, "secretKey");
      const userId = decoded.id

      /*const { data: chatsIdData, error: chatsIdError } = await supabase  
        .from("chat_participant")
        .select("chat_id")
        .eq("user_id", user_id)

      if (chatsIdError) throw chatsIdError

      const { data: otherParticipant, error: otherParticipantError } = await supabase
        .from("chat_participant")
        .select("chat_id", "user_id", "accepted")
        .in("user_id", chatsIdData)

      if (otherParticipantError) throw otherParticipantError

      const { data: lastMessage, error: lastMessageError } = await supabase
        .from("message")
        .select("chat_id", "message", "created_at")
        .
      */

    // Paso 1: Obtener los chat_id donde el usuario participa
    const { data: chatsIdData, error: chatsIdError } = await supabase
      .from("chat_participant")
      .select("chat_id")
      .eq("user_id", userId);

    if (chatsIdError) throw chatsIdError;

    //console.log("Chats id data", chatsIdData)

    const chatIds = chatsIdData.map((chat) => chat.chat_id);

    //console.log("Chats id", chatIds)

    if (chatIds.length === 0) {
      return []; // El usuario no participa en ningún chat
    }

    // Paso 2: Obtener los detalles de los chats
    const userChats = await Promise.all(
      chatIds.map(async (chatId) => {
        // Obtener el mensaje más reciente del chat
        const { data: latestMessageData, error: latestMessageError } = await supabase
          .from("message")
          .select("message, created_at, user_id")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestMessageError) throw latestMessageError;

        //console.log("Latest message", latestMessageData)

        // Obtener el otro participante del chat
        const { data: participantsData, error: participantsError } = await supabase
          .from("chat_participant")
          .select("user_id, user:appuser(username, profile_picture:image(base64image))")
          .eq("chat_id", chatId)
          .neq("user_id", userId);

        if (participantsError) throw participantsError;

        //console.log("Participant data", participantsData)

        /*const { data: messageId, error: messageIdError } = await supabase
          .from("message_read")
          .select("message_id")
          .eq("user_id", userId);

        if (messageIdError) throw messageIdError

        const readMessageIds = messageId?.map((row) => row.message_id) || [];

        console.log("Final Array for `not.in`:", readMessageIds);*/

        // Contar los mensajes no leídos del otro participante
        const { count: unreadCount, error: unreadCountError } = await supabase
          .from("message")
          .select("id", { count: "exact" })
          .eq("chat_id", chatId)
          .eq("user_id", participantsData[0].user_id)
          .eq("read", false);

        if (unreadCountError) throw unreadCountError;

        return {
          chat_id: chatId,
          latest_message: latestMessageData?.message || "",
          latest_message_timestamp: latestMessageData?.created_at || null,
          other_username: participantsData[0]?.user?.username || null,
          user_id: participantsData[0]?.user_id,
          other_profile_picture: participantsData[0]?.user?.profile_picture?.base64image || null,
          unread_count: unreadCount || 0,
        };
      })
    );

    //console.log("User chats", userChats)

    // Ordenar por timestamp del mensaje más reciente
    const orderedUserChats = userChats.sort(
      (a, b) =>
        new Date(b.latest_message_timestamp) -
        new Date(a.latest_message_timestamp)
    );

    res.status(200).json(orderedUserChats);
    }  catch (error) {
      console.log(error.name + " " + error.message)
      if (error.name === "TokenExpiredError") {
        return res.status(400).json({ message: "El token ha expirado" });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(400).json({ message: "Token inválido" });
      }
      res.status(500).json({ message: error.message });
    }
  }
  else {
    return res.status(500).json({ message: "Error al obtener chats" });
  }
}

export { setChat, getChats, readMessage, getMessages }