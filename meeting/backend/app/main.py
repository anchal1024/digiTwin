from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
import os
import pickle
import logging
from typing import Dict, List
from datetime import datetime, timedelta, date
from .services.scheduler import Scheduler
import re
import pytz
import json
from collections import Counter
import requests

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configuration
SCOPES = ['https://www.googleapis.com/auth/calendar']
CREDENTIALS_FILE = 'credentials.json'
TOKEN_FILE = 'token.pickle'

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load credentials
def get_calendar_service():
    logger.info("Attempting to get calendar service")
    creds = None
    
    try:
        if os.path.exists(TOKEN_FILE):
            logger.info("Loading credentials from token.pickle")
            try:
                with open(TOKEN_FILE, 'rb') as token:
                    creds = pickle.load(token)
                logger.info(f"Credentials loaded from token file, valid: {creds.valid if creds else 'None'}")
            except Exception as e:
                logger.error(f"Error loading credentials from token.pickle: {str(e)}")
                # If token file is corrupted, delete it
                os.remove(TOKEN_FILE)
                logger.info("Removed corrupted token file")
                creds = None

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    logger.info("Refreshing expired credentials")
                    creds.refresh(Request())
                    with open(TOKEN_FILE, 'wb') as token:
                        pickle.dump(creds, token)
                        logger.info("Credentials refreshed and saved")
                except Exception as e:
                    logger.error(f"Error refreshing credentials: {str(e)}")
                    # If refresh fails, need to re-authenticate
                    if os.path.exists(TOKEN_FILE):
                        os.remove(TOKEN_FILE)
                    logger.warning("Refresh failed, removed token file")
                    raise ValueError("Authentication required. Please sign in again.") from e
            else:
                logger.info("No valid credentials found, initiating auth flow")
                try:
                    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
                    creds = flow.run_local_server(port=0)
                    with open(TOKEN_FILE, 'wb') as token:
                        pickle.dump(creds, token)
                        logger.info("New credentials saved to token.pickle")
                except Exception as e:
                    logger.error(f"Error in authentication flow: {str(e)}")
                    raise ValueError("Failed to authenticate with Google. Please try again.") from e

        try:
            service = build('calendar', 'v3', credentials=creds, cache_discovery=False)
            # Test API call to validate credentials
            service.calendarList().list(maxResults=1).execute()
            logger.info("Calendar service created and validated successfully")
            return service
        except Exception as e:
            logger.error(f"Error creating calendar service: {str(e)}")
            if "invalid_grant" in str(e) or "Invalid Credentials" in str(e):
                if os.path.exists(TOKEN_FILE):
                    os.remove(TOKEN_FILE)
                logger.warning("Invalid credentials, removed token file")
                raise ValueError("Your session has expired. Please sign in again.") from e
            raise ValueError(f"Error accessing Google Calendar API: {str(e)}") from e
            
    except Exception as e:
        logger.error(f"Unexpected error in get_calendar_service: {str(e)}")
        raise ValueError(f"Could not initialize calendar service: {str(e)}") from e

@app.post("/api/auth/google")
async def google_auth(data: Dict):
    logger.info(f"Received auth request with data: {data}")
    code = data.get("code")
    if not code:
        logger.error("No authorization code provided")
        raise HTTPException(status_code=400, detail="Authorization code is required")

    token_url = "https://oauth2.googleapis.com/token"
    
    try:
        with open(CREDENTIALS_FILE, 'r') as f:
            credentials = json.load(f)
            client_id = credentials['web']['client_id']
            client_secret = credentials['web']['client_secret']
    except Exception as e:
        logger.error(f"Error reading credentials file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error reading credentials: {str(e)}")

    # Ensure we're using the correct redirect URI that matches the one registered in Google Cloud Console
    payload = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": "http://localhost:5173",
        "grant_type": "authorization_code",
    }

    try:
        response = requests.post(token_url, data=payload)
        response.raise_for_status()  # Raise exception for HTTP errors
        token_data = response.json()
        logger.info(f"Token exchange successful")
    except requests.exceptions.RequestException as e:
        logger.error(f"Token exchange error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error exchanging authorization code: {str(e)}")

    if "error" in token_data:
        logger.error(f"Authentication failure: {token_data['error']}")
        raise HTTPException(status_code=401, detail=token_data["error"])
    
    if "access_token" not in token_data:
        logger.error("No access token in response")
        raise HTTPException(status_code=500, detail="No access token received from Google")
    
    # Get the refresh token, which may not always be provided
    refresh_token = token_data.get("refresh_token")
    
    # Create the credentials object
    try:
        creds = Credentials(
            token=token_data["access_token"],
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret,
            scopes=SCOPES
        )
        
        # Test the credentials with a small API call to validate
        service = build('calendar', 'v3', credentials=creds, cache_discovery=False)
        service.calendarList().list(maxResults=1).execute()
        logger.info("Credentials validated successfully with test API call")
        
        # Save the credentials to file
        with open(TOKEN_FILE, 'wb') as token:
            pickle.dump(creds, token)
            logger.info("Credentials saved to token.pickle")
            
        return {
            "success": True,
            "message": "Authentication successful",
            "refresh_token": refresh_token
        }
        
    except Exception as e:
        logger.error(f"Error creating credentials or testing API: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@app.get("/api/calendar/events")
async def get_calendar_events():
    logger.info("Fetching calendar events")
    try:
        service = get_calendar_service()
        now = datetime.utcnow().isoformat() + 'Z'
        events_result = service.events().list(
            calendarId='primary',
            timeMin=now,
            maxResults=10,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])
        
        # Remove attendee information from events
        for event in events:
            if 'attendees' in event:
                del event['attendees']
                
        logger.info("Events fetched successfully")
        return {"items": events}
    except Exception as e:
        logger.error(f"Error fetching events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/calendar/events/{event_id}")
async def delete_calendar_event(event_id: str):
    logger.info(f"Deleting calendar event with ID: {event_id}")
    try:
        service = get_calendar_service()
        service.events().delete(calendarId='primary', eventId=event_id).execute()
        logger.info(f"Event deleted successfully: {event_id}")
        return {"message": f"Event with ID {event_id} deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting event {event_id}: {str(e)}")
        if "404" in str(e):
            raise HTTPException(status_code=404, detail=f"Event with ID {event_id} not found")
        raise HTTPException(status_code=500, detail=f"Error deleting event: {str(e)}")

@app.post("/api/schedule/find-slots")
async def find_available_slots(data: Dict):
    logger.info(f"Finding available slots with data: {data}")
    try:
        service = get_calendar_service()
        scheduler = Scheduler(service)
        
        duration = data.get('duration', 30)
        start_date = datetime.fromisoformat(data['start_date'])
        end_date = datetime.fromisoformat(data['end_date'])
        
        slots = scheduler.find_available_slots([], duration, start_date, end_date)
        logger.info("Available slots found")
        return {"available_slots": slots}
    except Exception as e:
        logger.error(f"Scheduling error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scheduling error: {str(e)}")

@app.post("/api/schedule/meeting")
async def schedule_meeting(data: Dict):
    """Schedule a meeting based on a natural language prompt."""
    logger.info(f"Received meeting prompt: {data}")
    try:
        # Validate input
        if not isinstance(data, dict):
            raise ValueError("Request body must be a dictionary")

        prompt = data.get('prompt', '')
        if not prompt:
            raise ValueError("No prompt provided")
            
        # Get user's timezone - default to UTC if not provided
        user_timezone = data.get('timezone', 'UTC')
        local_tz = pytz.timezone(user_timezone)
        logger.info(f"Using timezone: {user_timezone}")
            
        # Check if this is scheduling using a suggested slot
        use_suggested_slot = data.get('use_suggested_slot', False)
        logger.info(f"Using suggested slot: {use_suggested_slot}")

        # Extract meeting details from the prompt
        participant_match = re.search(r'with\s+([A-Za-z\s]+)', prompt, re.IGNORECASE)
        date_match = re.search(r'on\s+([A-Za-z]+\s+\d{1,2},\s*\d{4})', prompt, re.IGNORECASE)
        time_match = re.search(r'at\s+(\d{1,2}(?::\d{2})?\s*[APMapm]{2})', prompt, re.IGNORECASE)
        duration_match = re.search(r'for\s+(\d+)\s*minutes', prompt, re.IGNORECASE)
        reminder_match = re.search(r'remind\s+me\s+(\d+)\s*minutes?\s*before', prompt, re.IGNORECASE)

        # Ensure participant is always defined
        participant = participant_match.group(1).strip() if participant_match else "Unknown"
        date_str = date_match.group(1) if date_match else None
        time_str = time_match.group(1) if time_match else None
        duration = int(duration_match.group(1)) if duration_match else 30
        reminder_minutes = int(reminder_match.group(1)) if reminder_match else None

        if not date_str or not time_str:
            raise ValueError("Date and time must be specified in the prompt")

        # Clean date string to ensure consistent format (add space after comma if missing)
        if date_str and ',' in date_str:
            parts = date_str.split(',')
            if len(parts) == 2 and not parts[1].startswith(' '):
                date_str = f"{parts[0]}, {parts[1].strip()}"

        # Parse date and time
        try:
            # Parse the date and time - explicitly in 12-hour format with AM/PM
            if ':' in time_str:
                # Time with minutes (e.g., "2:30 PM")
                dt_str = f"{date_str} {time_str}"
                start_time = datetime.strptime(dt_str, "%B %d, %Y %I:%M %p")
            else:
                # Time without minutes (e.g., "2 PM")
                dt_str = f"{date_str} {time_str}"
                start_time = datetime.strptime(dt_str, "%B %d, %Y %I %p")
            
            logger.info(f"Parsed datetime: {start_time}, from input: '{dt_str}'")
                
            # Create a timezone-aware datetime in user's local timezone
            start_time = local_tz.localize(start_time)
            # Convert to UTC for Google Calendar storage
            start_time_utc = start_time.astimezone(pytz.UTC)
            end_time_utc = start_time_utc + timedelta(minutes=duration)
            
            logger.info(f"Local time: {start_time}, UTC time: {start_time_utc}")
            
        except ValueError as e:
            logger.error(f"Date parsing error with '{date_str}' and '{time_str}': {str(e)}")
            raise ValueError(f"Invalid date or time format: {str(e)}")

        # If we're using a suggested slot, skip conflict checking
        service = get_calendar_service()
        if not use_suggested_slot:
            # Check for conflicts
            events = service.events().list(
                calendarId='primary',
                timeMin=start_time_utc.isoformat(),
                timeMax=end_time_utc.isoformat(),
                singleEvents=True,
                orderBy='startTime'
            ).execute()

            if events.get('items', []):
                scheduler = Scheduler(service)
                next_day = start_time_utc + timedelta(days=1)
                slots = scheduler.find_available_slots([participant], duration, start_time_utc, next_day)
                suggestion = slots[0] if slots else None
                if suggestion:
                    return {
                        "conflict": True,
                        "message": f"Conflict detected at {start_time.strftime('%B %d, %Y %I:%M %p')}.",
                        "suggested_slot": {
                            "start": suggestion['start'],
                            "end": suggestion['end'],
                            "participant": participant,
                            "duration": duration
                        }
                    }
                raise ValueError("Conflict detected, no alternative slots available")
        else:
            logger.info("Using suggested slot, skipping conflict check")

        # Schedule the meeting with correct timezone and format
        # Create a valid email for attendee or remove if not needed
        attendee_email = None
        if "@" in participant:
            attendee_email = participant
        else:
            # This is a placeholder email - you should replace with actual email if available
            attendee_email = f"{participant.lower().replace(' ', '.')}@example.com"
            
        event = {
            'summary': f"Meeting with {participant}",
            'description': f"Meeting scheduled via Calendar Assistant",
            'start': {
                'dateTime': start_time_utc.isoformat(),
                'timeZone': 'UTC'
            },
            'end': {
                'dateTime': end_time_utc.isoformat(),
                'timeZone': 'UTC'
            },
            'attendees': [{'email': attendee_email}],
            'reminders': {
                'useDefault': True
            }
        }

        if reminder_minutes:
            event['reminders'] = {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': reminder_minutes},
                    {'method': 'popup', 'minutes': reminder_minutes}
                ]
            }

        # Explicitly log the event details before sending
        logger.info(f"Attempting to create event: {json.dumps(event, default=str)}")
        
        # Insert the event and capture the response
        created_event = service.events().insert(calendarId='primary', body=event, sendUpdates='all').execute()
        logger.info(f"Meeting scheduled successfully. Event ID: {created_event.get('id')}")
        
        return {
            "conflict": False,
            "message": f"Meeting scheduled with {participant} on {start_time.strftime('%B %d, %Y %I:%M %p')} for {duration} minutes",
            "event_id": created_event.get('id')
        }

    except Exception as e:
        logger.error(f"Meeting scheduling error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error scheduling meeting: {str(e)}")

# Make sure there's no hanging indentation or incomplete try-except blocks before this
@app.get("/api/calendar/events")
async def get_calendar_events():
    logger.info("Fetching calendar events")
    try:
        service = get_calendar_service()
        now = datetime.utcnow().isoformat() + 'Z'
        events_result = service.events().list(
            calendarId='primary',
            timeMin=now,
            maxResults=10,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])
        
        # Format events without month
        formatted_events = []
        for event in events:
            start = datetime.fromisoformat(event['start']['dateTime'])
            formatted_event = {
                **event,
                'display_time': start.strftime("%d at %I:%M %p")  # "15 at 02:30 PM" format
            }
            formatted_events.append(formatted_event)
            
        logger.info("Events fetched successfully")
        return {"items": formatted_events}
        
    except Exception as e:
        logger.error(f"Error fetching events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/schedule/cancel")
async def cancel_meeting(data: Dict):
    logger.info(f"Received cancel request: {data}")
    try:
        event_id = data.get('event_id')
        service = get_calendar_service()

        if event_id:
            try:
                service.events().delete(calendarId='primary', eventId=event_id).execute()
                logger.info(f"Meeting canceled by event ID: {event_id}")
                return {"message": f"Meeting with ID {event_id} canceled"}
            except Exception as e:
                if "404" in str(e):
                    logger.warning(f"Event with ID {event_id} not found in Google Calendar")
                    raise HTTPException(status_code=404, detail=f"Event with ID {event_id} not found")
                logger.error(f"Error deleting event {event_id}: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error canceling meeting: {str(e)}")
        
        prompt = data.get('prompt', '')
        if not prompt:
            raise ValueError("No prompt or event ID provided")

        participant_match = re.search(r'with\s+([A-Za-z\s]+)', prompt, re.IGNORECASE)
        date_match = re.search(r'on\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})', prompt, re.IGNORECASE)
        time_match = re.search(r'at\s+(\d{1,2}(?::\d{2})?\s*[APMapm]{2})', prompt, re.IGNORECASE)

        participant = participant_match.group(1).strip() if participant_match else None
        date_str = date_match.group(1) if date_match else None
        time_str = time_match.group(1) if time_match else None

        if not date_str or not time_str or not participant:
            raise ValueError("Participant, date, and time must be specified in the prompt")

        utc = pytz.UTC
        start_time = datetime.strptime(f"{date_str} {time_str}", "%B %d, %Y %I:%M %p") if ':' in time_str else datetime.strptime(f"{date_str} {time_str}", "%B %d, %Y %I %p")
        start_time = utc.localize(start_time)
        end_time = start_time + timedelta(minutes=30)

        events = service.events().list(
            calendarId='primary',
            timeMin=start_time.isoformat(),
            timeMax=end_time.isoformat(),
            singleEvents=True,
            orderBy='startTime',
            q=f"Meeting with {participant}"
        ).execute()

        if not events.get('items', []):
            raise ValueError(f"No meeting found with {participant} at {start_time.strftime('%B %d, %Y %I:%M %p')}")

        event_id = events['items'][0]['id']
        try:
            service.events().delete(calendarId='primary', eventId=event_id).execute()
            logger.info(f"Meeting canceled: {event_id}")
            return {"message": f"Meeting with {participant} on {start_time.strftime('%B %d, %Y %I:%M %p')} canceled"}
        except Exception as e:
            if "404" in str(e):
                logger.warning(f"Event with ID {event_id} not found in Google Calendar")
                raise HTTPException(status_code=404, detail=f"Event with ID {event_id} not found")
            logger.error(f"Error deleting event {event_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error canceling meeting: {str(e)}")

    except Exception as e:
        logger.error(f"Cancel error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error canceling meeting: {str(e)}")

@app.post("/api/schedule/reschedule")
async def reschedule_meeting(data: Dict):
    logger.info(f"Received reschedule request: {data}")
    try:
        prompt = data.get('prompt', '')
        if not prompt:
            raise ValueError("No prompt provided")

        participant_match = re.search(r'with\s+([A-Za-z\s]+)', prompt, re.IGNORECASE)
        orig_date_match = re.search(r'on\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})', prompt, re.IGNORECASE)
        orig_time_match = re.search(r'at\s+(\d{1,2}(?::\d{2})?\s*[APMapm]{2})', prompt, re.IGNORECASE)
        new_date_match = re.search(r'to\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})', prompt, re.IGNORECASE)
        new_time_match = re.search(r'to\s+.*?at\s+(\d{1,2}(?::\d{2})?\s*[APMapm]{2})', prompt, re.IGNORECASE)
        reminder_match = re.search(r'remind\s+me\s+(\d+)\s*minutes?\s*before', prompt, re.IGNORECASE)

        participant = participant_match.group(1).strip() if participant_match else None
        orig_date_str = orig_date_match.group(1) if orig_date_match else None
        orig_time_str = orig_time_match.group(1) if orig_time_match else None
        new_date_str = new_date_match.group(1) if new_date_match else orig_date_str
        new_time_str = new_time_match.group(1) if new_time_match else None
        reminder_minutes = int(reminder_match.group(1)) if reminder_match else None

        if not participant or not orig_date_str or not orig_time_str:
            raise ValueError("Participant and original date/time must be specified")

        utc = pytz.UTC
        orig_start = datetime.strptime(f"{orig_date_str} {orig_time_str}", "%B %d, %Y %I:%M %p") if ':' in orig_time_str else datetime.strptime(f"{orig_date_str} {orig_time_str}", "%B %d, %Y %I %p")
        orig_start = utc.localize(orig_start)
        orig_end = orig_start + timedelta(minutes=30)

        new_start = datetime.strptime(f"{new_date_str} {new_time_str}", "%B %d, %Y %I:%M %p") if (new_time_str and ':' in new_time_str) else datetime.strptime(f"{new_date_str} {new_time_str}", "%B %d, %Y %I %p") if new_time_str else orig_start
        new_start = utc.localize(new_start)
        new_end = new_start + timedelta(minutes=30)

        service = get_calendar_service()
        events = service.events().list(
            calendarId='primary',
            timeMin=orig_start.isoformat(),
            timeMax=orig_end.isoformat(),
            singleEvents=True,
            orderBy='startTime',
            q=f"Meeting with {participant}"
        ).execute()

        if not events.get('items', []):
            raise ValueError(f"No meeting found with {participant} at {orig_start.strftime('%B %d, %Y %I:%M %p')}")

        event = events['items'][0]
        event_id = event['id']
        updated_event = {
            'summary': f"Meeting with {participant}",
            'start': {'dateTime': new_start.isoformat(), 'timeZone': 'UTC'},
            'end': {'dateTime': new_end.isoformat(), 'timeZone': 'UTC'}
        }

        if reminder_minutes:
            updated_event['reminders'] = {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': reminder_minutes},
                    {'method': 'popup', 'minutes': reminder_minutes}
                ]
            }

        service.events().update(calendarId='primary', eventId=event_id, body=updated_event).execute()
        logger.info(f"Meeting rescheduled: {event_id}")
        return {"message": f"Meeting with {participant} rescheduled to {new_start.strftime('%B %d, %Y %I:%M %p')}"}

    except Exception as e:
        logger.error(f"Reschedule error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error rescheduling meeting: {str(e)}")

@app.post("/api/preferences/set")
async def set_preferences(data: Dict):
    logger.info(f"Received preferences update: {data}")
    try:
        prompt = data.get('prompt', '')
        if not prompt:
            raise ValueError("No prompt provided")

        preferences_file = 'preferences.json'
        current_preferences = Scheduler(get_calendar_service())._load_preferences()

        work_hours_match = re.search(r'(\d{1,2}(?::\d{2})?\s*[APMapm]{2})\s*to\s*(\d{1,2}(?::\d{2})?\s*[APMapm]{2})', prompt, re.IGNORECASE)
        if work_hours_match:
            start_str, end_str = work_hours_match.groups()
            start_time = datetime.strptime(start_str, '%I:%M %p') if ':' in start_str else datetime.strptime(start_str, '%I %p')
            end_time = datetime.strptime(end_str, '%I:%M %p') if ':' in end_str else datetime.strptime(end_str, '%I %p')
            current_preferences["work_hours"] = {
                "start": start_time.strftime('%H:%M'),
                "end": end_time.strftime('%H:%M')
            }

        blocked_days_match = re.search(r'block\s+(weekends|weekdays|monday|tuesday|wednesday|thursday|friday|saturday|sunday)', prompt, re.IGNORECASE)
        if blocked_days_match:
            blocked = blocked_days_match.group(1).lower()
            if blocked == 'weekends':
                current_preferences["blocked_days"] = ["Saturday", "Sunday"]
            elif blocked == 'weekdays':
                current_preferences["blocked_days"] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
            else:
                current_preferences["blocked_days"] = [blocked.capitalize()]

        buffer_match = re.search(r'buffer\s+(\d+)\s*minutes', prompt, re.IGNORECASE)
        if buffer_match:
            current_preferences["buffer_minutes"] = int(buffer_match.group(1))

        with open(preferences_file, 'w') as f:
            json.dump(current_preferences, f)
        logger.info(f"Preferences updated: {current_preferences}")
        return {"message": "Availability preferences updated successfully"}

    except Exception as e:
        logger.error(f"Preferences update error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error updating preferences: {str(e)}")

@app.post("/api/reminders/set")
async def set_reminder(data: Dict):
    logger.info(f"Received reminder request: {data}")
    try:
        prompt = data.get('prompt', '')
        event_id = data.get('event_id')
        if not prompt or not event_id:
            raise ValueError("Prompt and event ID must be provided")

        reminder_match = re.search(r'remind\s+me\s+(\d+)\s*minutes?\s*before', prompt, re.IGNORECASE)
        reminder_minutes = int(reminder_match.group(1)) if reminder_match else None

        if not reminder_minutes:
            raise ValueError("Reminder time must be specified in minutes")

        service = get_calendar_service()
        event = service.events().get(calendarId='primary', eventId=event_id).execute()
        
        updated_event = event
        updated_event['reminders'] = {
            'useDefault': False,
            'overrides': [
                {'method': 'email', 'minutes': reminder_minutes},
                {'method': 'popup', 'minutes': reminder_minutes}
            ]
        }
        
        service.events().update(calendarId='primary', eventId=event_id, body=updated_event).execute()
        
        logger.info(f"Reminder set for event {event_id}")
        return {"message": f"Reminder set {reminder_minutes} minutes before '{event['summary']}'"}
    except Exception as e:
        logger.error(f"Reminder set error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error setting reminder: {str(e)}")

@app.get("/api/analytics")
async def get_meeting_analytics(start_date: str = None):
    logger.info("Fetching meeting analytics")
    try:
        service = get_calendar_service()
        
        utc = pytz.UTC
        if not start_date:
            today = datetime.now(utc).date()
            start_of_week = today - timedelta(days=today.weekday())
        else:
            start_of_week = datetime.strptime(start_date, '%Y-%m-%d').date()
        
        end_of_week = start_of_week + timedelta(days=6)
        
        time_min = utc.localize(datetime.combine(start_of_week, datetime.min.time())).isoformat()
        time_max = utc.localize(datetime.combine(end_of_week, datetime.max.time())).isoformat()

        events = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        items = events.get('items', [])
        if not items:
            return {
                "total_meeting_hours": 0,
                "busiest_days": {}
            }

        total_minutes = 0
        day_counts = Counter()

        for event in items:
            start = datetime.fromisoformat(event['start']['dateTime'].replace('Z', '+00:00'))
            end = datetime.fromisoformat(event['end']['dateTime'].replace('Z', '+00:00'))
            duration = (end - start).total_seconds() / 60
            total_minutes += duration
            
            day = start.strftime('%A')
            day_counts[day] += 1

        total_hours = total_minutes / 60
        
        return {
            "total_meeting_hours": round(total_hours, 2),
            "busiest_days": dict(day_counts)
        }
    except Exception as e:
        logger.error(f"Analytics error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching analytics: {str(e)}")

def format_datetime(dt: datetime) -> str:
    try:
        formatted = dt.strftime("%m/%d/%Y, %I:%M:%S %p")
        date_part, time_part = formatted.split(", ")
        month, day, year = date_part.split("/")
        hour, minute, second_period = time_part.split(":")
        second, period = second_period.split(" ")
        month = str(int(month.lstrip("0")))
        day = str(int(day.lstrip("0")))
        hour = str(int(hour.lstrip("0")))
        return f"{month}/{day}/{year}, {hour}:{minute}:{second} {period}"
    except Exception as e:
        logger.error(f"Error formatting datetime: {str(e)}")
        return dt.strftime("%m/%d/%Y, %I:%M:%S %p")

@app.get("/api/availability")
async def get_availability(duration: int = 30, timezone: str = None):
    logger.info(f"Fetching available time slots, timezone: {timezone}")
    try:
        service = get_calendar_service()
        scheduler = Scheduler(service)
        
        # Get the user's current preferences
        preferences = scheduler._load_preferences()
        logger.info(f"Using user preferences: {preferences}")
        
        # Use the work hours from preferences
        work_hours = preferences.get("work_hours", {"start": "09:00", "end": "17:00"})
        work_start_parts = work_hours["start"].split(":")
        work_end_parts = work_hours["end"].split(":")
        
        # Parse work hours
        work_start_hour = int(work_start_parts[0])
        work_start_minute = int(work_start_parts[1])
        work_end_hour = int(work_end_parts[0])
        work_end_minute = int(work_end_parts[1])

        # Set the date range based on work hours
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Start from current time if during work hours, otherwise start from next work day
        current_hour = now.hour
        current_minute = now.minute
        
        if (current_hour > work_end_hour or 
            (current_hour == work_end_hour and current_minute >= work_end_minute) or
            current_hour < work_start_hour or
            (current_hour == work_start_hour and current_minute < work_start_minute)):
            # Outside work hours, start from next work day
            start_date = today + timedelta(days=1)
        else:
            # During work hours, start from current time
            start_date = now
            
        start_date = start_date.replace(hour=work_start_hour, minute=work_start_minute, second=0, microsecond=0)
        end_date = (today + timedelta(days=14)).replace(hour=work_end_hour, minute=work_end_minute, second=0, microsecond=0)
        
        logger.info(f"Finding slots from {start_date} to {end_date} with duration {duration} minutes")
        slots = scheduler.find_available_slots([], duration, start_date, end_date)
        
        # Format the slots with proper timezone info for display
        formatted_slots = []
        # Use provided timezone or default to America/New_York
        local_tz = pytz.timezone(timezone) if timezone else pytz.timezone("America/New_York")
        logger.info(f"Formatting slots with timezone: {local_tz}")
        
        for slot in slots:
            start = datetime.fromisoformat(slot['start'].replace('Z', '+00:00'))
            end = datetime.fromisoformat(slot['end'].replace('Z', '+00:00'))
            
            # Convert to local timezone for display
            local_start = start.astimezone(local_tz)
            local_end = end.astimezone(local_tz)
            
            formatted_slots.append({
                "start": local_start.strftime("%B %d, %Y %I:%M %p"),
                "end": local_end.strftime("%B %d, %Y %I:%M %p"),
                "start_iso": start.isoformat(),
                "end_iso": end.isoformat()
            })

        logger.info(f"Found {len(formatted_slots)} available time slots")
        return {"timeSlots": formatted_slots}
    except Exception as e:
        logger.error(f"Error fetching availability: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))