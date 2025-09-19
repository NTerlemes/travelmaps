#!/usr/bin/env python3
import json
import sys
import subprocess
import time
import threading

def send_notification(message, repeat=False):
    """Send notification using system command"""
    # Initial notification
    subprocess.run(['osascript', '-e', f'display notification "{message}" with title "Claude Code"'])
    subprocess.run(['say', 'Claude needs your input'])  # macOS text-to-speech
    
    if repeat:
        # Set up 3-minute repeating notifications
        def repeat_notification():
            count = 1
            while count <= 10:  # Limit to 10 repeats
                time.sleep(180)  # 3 minutes = 180 seconds
                subprocess.run(['osascript', '-e', f'display notification "Reminder {count}: {message}" with title "Claude Code"'])
                subprocess.run(['say', f'Reminder {count}'])
                count += 1
        
        # Run in background thread
        thread = threading.Thread(target=repeat_notification, daemon=True)
        thread.start()

# Read input from stdin
try:
    input_data = json.load(sys.stdin)
    hook_event = input_data.get("hook_event_name", "")
    message = input_data.get("message", "")
    
    if hook_event == "Notification":
        # Check if it's a permission request or idle notification
        if "permission" in message.lower() or "waiting" in message.lower():
            send_notification(message, repeat=True)
    
except json.JSONDecodeError:
    pass

sys.exit(0)