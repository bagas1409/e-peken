import { db } from "../config/db.js";
import {
    chats,
    messages,
    umkmProfiles,
    users,
} from "../config/schema.js";
import { eq, and, desc, or, sql, ne } from "drizzle-orm";
import { getIO } from "../socket.js";

/* =========================================
   1. CREATE / GET CHAT ROOM
   ========================================= */
export const createChat = async (req, res, next) => {
    try {
        const userId = req.user.id; // Buyer
        const { umkmId } = req.body; // Seller ID (UMKM Profile ID)

        if (!umkmId) {
            return res.status(400).json({ message: "UMKM ID wajib diisi" });
        }

        // Cek apakah chat room sudah ada?
        const [existingChat] = await db
            .select()
            .from(chats)
            .where(and(eq(chats.userId, userId), eq(chats.umkmId, umkmId)));

        if (existingChat) {
            return res.status(200).json(existingChat);
        }

        // Jika belum ada, buat baru
        const [newChat] = await db
            .insert(chats)
            .values({ userId, umkmId })
            .returning();

        res.status(201).json(newChat);
    } catch (err) {
        next(err);
    }
};

/* =========================================
   2. GET MY CHATS (INBOX)
   ========================================= */
export const getMyChats = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // Cek role user, apakah dia Buyer atau Seller (punya UMKM)?
        // Untuk simplifikasi, kita ambil semua chat dimana user ID terlibat ATAU umkm milik user terlibat.

        // 1. Ambil UMKM milik user (jika ada)
        const [myUmkm] = await db
            .select()
            .from(umkmProfiles)
            .where(eq(umkmProfiles.userId, userId));

        let condition = eq(chats.userId, userId);
        if (myUmkm) {
            // Jika user punya toko, tampilkan juga chat yang masuk ke tokonya
            condition = or(eq(chats.userId, userId), eq(chats.umkmId, myUmkm.id));
        }

        // Fetch Chats + Relasi + Unread Count
        // Note: Drizzle raw SQL aggregation is cleaner here.
        // Fetch Chats + Relasi + Unread Count
        // Note: Drizzle raw SQL aggregation is cleaner here.
        const chatList = await db
            .select({
                id: chats.id,
                userId: chats.userId,
                umkmId: chats.umkmId,
                userName: users.name,
                userAvatar: users.avatarUrl,
                userIsOnline: users.isOnline, // Status Buyer
                storeName: umkmProfiles.storeName,
                storeLogo: umkmProfiles.logoUrl,
                // Kita perlu status online pemilik toko juga
                storeOwnerIsOnline: sql`(select is_online from ${users} where id = ${umkmProfiles.userId})`.as('store_owner_is_online'),
                unreadCount: sql`
          (SELECT count(*)::int 
           FROM ${messages} 
           WHERE ${messages.chatId} = ${chats.id} 
           AND ${messages.isRead} = false 
           AND ${messages.senderId} != ${userId})
        `.as('unread_count'),
                lastMessage: sql`
          (SELECT message 
           FROM ${messages} 
           WHERE ${messages.chatId} = ${chats.id} 
           ORDER BY ${messages.createdAt} DESC 
           LIMIT 1)
        `.as('last_message'),
                lastMessageType: sql`
          (SELECT message_type 
           FROM ${messages} 
           WHERE ${messages.chatId} = ${chats.id} 
           ORDER BY ${messages.createdAt} DESC 
           LIMIT 1)
        `.as('message_type'),
                lastAttachmentUrl: sql`
          (SELECT attachment_url 
           FROM ${messages} 
           WHERE ${messages.chatId} = ${chats.id} 
           ORDER BY ${messages.createdAt} DESC 
           LIMIT 1)
        `.as('attachment_url'),
                lastMessageAt: sql`
          (SELECT created_at 
           FROM ${messages} 
           WHERE ${messages.chatId} = ${chats.id} 
           ORDER BY ${messages.createdAt} DESC 
           LIMIT 1)
        `.as('last_message_at'),
            })
            .from(chats)
            .leftJoin(users, eq(chats.userId, users.id))
            .leftJoin(umkmProfiles, eq(chats.umkmId, umkmProfiles.id))
            .where(condition)
            .orderBy(desc(sql`(SELECT created_at FROM ${messages} WHERE ${messages.chatId} = ${chats.id} ORDER BY ${messages.createdAt} DESC LIMIT 1)`));

        res.json(chatList);
    } catch (err) {
        next(err);
    }
};

/* =========================================
   3. GET MESSAGES (BUBBLES)
   ========================================= */
export const getMessages = async (req, res, next) => {
    try {
        const chatId = Number(req.params.id);
        const userId = req.user.id;

        // 1. Mark as Read (semua pesan di chat ini yg BUKAN dari saya)
        await db
            .update(messages)
            .set({ isRead: true })
            .where(
                and(
                    eq(messages.chatId, chatId),
                    ne(messages.senderId, userId), // Pesan dari lawan bicara
                    eq(messages.isRead, false)
                )
            );

        // 2. Ambil Pesan
        const messageList = await db
            .select()
            .from(messages)
            .where(eq(messages.chatId, chatId))
            .orderBy(messages.createdAt); // Ascending (Oldest top)

        // 3. Ambil Detail Chat (untuk Avatar & Nama di Frontend)
        const [chatDetails] = await db
            .select({
                id: chats.id,
                userId: chats.userId,
                umkmId: chats.umkmId,
                userName: users.name,
                userAvatar: users.avatarUrl,
                userIsOnline: users.isOnline,
                userLastSeen: users.lastSeen,
                storeOwnerId: umkmProfiles.userId,
                storeName: umkmProfiles.storeName,
                storeLogo: umkmProfiles.logoUrl,
                storeOwnerIsOnline: sql`COALESCE((select is_online from ${users} where id = ${umkmProfiles.userId}), false)`.as('store_owner_is_online'),
            })
            .from(chats)
            .leftJoin(users, eq(chats.userId, users.id))
            .leftJoin(umkmProfiles, eq(chats.umkmId, umkmProfiles.id))
            .where(eq(chats.id, chatId));

        console.log(`[DEBUG_CHAT] ChatID: ${chatId} | Buyer: ${chatDetails?.userIsOnline} | Owner(${chatDetails?.storeOwnerId}): ${chatDetails?.storeOwnerIsOnline}`);

        res.json({
            chat: chatDetails,
            messages: messageList
        });
    } catch (err) {
        next(err);
    }
};

/* =========================================
   4. SEND MESSAGE
   ========================================= */
export const sendMessage = async (req, res, next) => {
    try {
        const chatId = parseInt(req.params.id);
        const senderId = req.user.id;
        const { message, attachmentUrl, messageType } = req.body;

        if (!message && !attachmentUrl) {
            return res.status(400).json({ message: "Message or Attachment is required" });
        }

        const [newMessage] = await db
            .insert(messages)
            .values({
                chatId,
                senderId,
                message: message || "",
                attachmentUrl,
                messageType: messageType || 'TEXT',
                isRead: false,
            })
            .returning();

        // Emit Real-time Event
        try {
            const io = getIO();
            io.to(chatId.toString()).emit("new_message", newMessage);
        } catch (socketError) {
            console.error("Socket emit failed:", socketError);
            // Don't fail the request if socket fails
        }

        res.status(201).json(newMessage);
    } catch (err) {
        next(err);
    }
};
