import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from .matchmaker import RedisMatchmaker

logger = logging.getLogger(__name__)

class OmegleConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.session_id = None
        self.mode = 'text'
        self.room_group_name = None
        self.is_matched = False

    async def connect(self):
        await self.accept()
        RedisMatchmaker.register_online(self.channel_name)
        logger.info(f"WebSocket client connected: {self.channel_name}")

    async def disconnect(self, close_code):
        RedisMatchmaker.unregister_online(self.channel_name)
        if self.session_id:
            await self._handle_leave()
        logger.info(f"WebSocket client disconnected: {self.channel_name}")

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        action = data.get('action')
        session_id = data.get('session_id')
        
        if session_id:
            self.session_id = session_id
        
        mode = data.get('mode', 'text')
        self.mode = mode

        if action == 'find_match':
            await self._handle_find_match()

        elif action == 'next':
            await self._handle_leave()
            await self._handle_find_match()

        elif action == 'stop':
            await self._handle_leave()
            await self.send(json.dumps({'action': 'stopped'}))

        elif action == 'send_message':
            message = data.get('message', '').strip()
            if message and self.room_group_name:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'sender_id': self.session_id,
                        'message': message
                    }
                )

        elif action == 'typing':
            is_typing = data.get('is_typing', False)
            if self.room_group_name:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'typing_indicator',
                        'sender_id': self.session_id,
                        'is_typing': is_typing
                    }
                )

        elif action == 'signal':
            # Relay WebRTC signaling (offer, answer, ice-candidate) to room partner
            signal_data = data.get('signal')
            if signal_data and self.room_group_name:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'webrtc_signal',
                        'sender_id': self.session_id,
                        'signal': signal_data
                    }
                )

    async def _handle_find_match(self):
        if not self.session_id:
            return

        matched, partner_info, room_id = RedisMatchmaker.join_queue_and_match(
            session_id=self.session_id,
            channel_name=self.channel_name,
            mode=self.mode
        )

        if matched and partner_info and room_id:
            self.room_group_name = room_id
            self.is_matched = True

            # Add current user to Channels room group
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

            # Add partner to Channels room group
            await self.channel_layer.group_add(self.room_group_name, partner_info['channel_name'])

            # Send matched notification to current user (Receiver in WebRTC)
            await self.send(json.dumps({
                'action': 'matched',
                'room_id': room_id,
                'role': 'receiver',
                'partner_id': partner_info['session_id']
            }))

            # Send matched notification to partner (Initiator in WebRTC)
            await self.channel_layer.send(
                partner_info['channel_name'],
                {
                    'type': 'partner_matched_notice',
                    'room_id': room_id,
                    'role': 'initiator',
                    'partner_id': self.session_id
                }
            )
        else:
            # Tell client we are waiting for a stranger
            await self.send(json.dumps({
                'action': 'waiting',
                'message': 'Looking for someone you can chat with...'
            }))

    async def _handle_leave(self):
        if not self.session_id:
            return

        partner_id, partner_channel = RedisMatchmaker.leave_and_cleanup(self.session_id, self.mode)

        if self.room_group_name:
            # Notify partner via group channel
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'partner_disconnected_notice',
                    'sender_id': self.session_id
                }
            )
            # Leave group
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            self.room_group_name = None

        self.is_matched = False

    # Handlers for channel layer group messages
    async def partner_matched_notice(self, event):
        self.room_group_name = event['room_id']
        self.is_matched = True
        await self.send(json.dumps({
            'action': 'matched',
            'room_id': event['room_id'],
            'role': event['role'],
            'partner_id': event['partner_id']
        }))

    async def chat_message(self, event):
        sender_id = event['sender_id']
        if sender_id != self.session_id:
            await self.send(json.dumps({
                'action': 'message',
                'message': event['message'],
                'from': 'stranger'
            }))

    async def typing_indicator(self, event):
        sender_id = event['sender_id']
        if sender_id != self.session_id:
            await self.send(json.dumps({
                'action': 'typing',
                'is_typing': event['is_typing']
            }))

    async def webrtc_signal(self, event):
        sender_id = event['sender_id']
        if sender_id != self.session_id:
            await self.send(json.dumps({
                'action': 'signal',
                'signal': event['signal']
            }))

    async def partner_disconnected_notice(self, event):
        sender_id = event['sender_id']
        if sender_id != self.session_id:
            await self.send(json.dumps({
                'action': 'partner_disconnected',
                'message': 'Stranger has disconnected.'
            }))
            if self.room_group_name:
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
                self.room_group_name = None
            self.is_matched = False
