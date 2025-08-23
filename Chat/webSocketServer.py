import asyncio
import websockets
import json
import random
import string

# Store all users
all_websockets = []  # list of dicts: {"socket": ws, "room": str, "id": str}
rooms = set()


async def handler(websocket):
    # Generate unique ID
    user_id = ''.join(random.choices(string.ascii_letters + string.digits, k=12))

    # Send initial connection message
    await websocket.send(json.dumps({
        "type": "system",
        "message": "Connected to chat server"
    }))

    try:
        async for message in websocket:
            parsed = json.loads(message)

            # --- CREATE ROOM ---
            if parsed["type"] == "create":
                room_hash = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
                rooms.add(room_hash)
                await websocket.send(json.dumps({
                    "type": "room_created",
                    "hash": room_hash
                }))

            # --- JOIN ROOM ---
            elif parsed["type"] == "join":
                room = parsed["payload"]["room"]
                if room not in rooms:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "message": "Room not found! Please create a room first."
                    }))
                    continue

                print(f"Someone joined room {room}")
                all_websockets.append({
                    "socket": websocket,
                    "room": room,
                    "id": user_id
                })

                await websocket.send(json.dumps({
                    "type": "joined",
                    "room": room
                }))

            # --- CHAT MESSAGE ---
            elif parsed["type"] == "chat":
                msg = parsed["payload"]["message"]
                client_id = parsed["payload"]["clientId"]

                current_room = None
                for ws in all_websockets:
                    if ws["socket"] == websocket:
                        current_room = ws["room"]
                        break

                print(f"Message in room {current_room}: {msg}")

                if current_room:
                    for ws in all_websockets:
                        if ws["room"] == current_room:
                            await ws["socket"].send(json.dumps({
                                "type": "chat",
                                "payload": {
                                    "message": msg,
                                    "clientId": client_id
                                }
                            }))

    except websockets.exceptions.ConnectionClosed:
        print(f"User {user_id} disconnected")
        # Remove disconnected user
        all_websockets[:] = [ws for ws in all_websockets if ws["socket"] != websocket]


async def main():
    async with websockets.serve(handler, "0.0.0.0", 9000):
        print("WebSocket server running on ws://0.0.0.0:9000")
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
