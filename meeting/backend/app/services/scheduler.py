import logging
from datetime import datetime, timedelta
import pytz
import json
import os

logger = logging.getLogger(__name__)

class Scheduler:
    def __init__(self, service):
        self.service = service
        self.preferences = self._load_preferences()

    def _load_preferences(self):
        """Load user preferences from a JSON file."""
        preferences_file = 'preferences.json'
        default_preferences = {
            "work_hours": {"start": "09:00", "end": "17:00"},  # 9 AM to 5 PM
            "blocked_days": [],  # e.g., ["Saturday", "Sunday"]
            "buffer_minutes": 0  # Buffer between meetings
        }
        if os.path.exists(preferences_file):
            with open(preferences_file, 'r') as f:
                return json.load(f)
        return default_preferences

    def find_available_slots(self, participants, duration, start_date, end_date):
        """Find available slots between start_date and end_date, respecting preferences."""
        logger.info(f"Finding slots for participants: {participants}, duration: {duration}, "
                    f"start: {start_date}, end: {end_date}")
        
        utc = pytz.UTC
        start_date = start_date if start_date.tzinfo else utc.localize(start_date)
        end_date = end_date if end_date.tzinfo else utc.localize(end_date)

        # Reload preferences to ensure we have the latest
        self.preferences = self._load_preferences()
        logger.info(f"Using preferences: {self.preferences}")

        events = self.service.events().list(
            calendarId='primary',
            timeMin=start_date.isoformat(),
            timeMax=end_date.isoformat(),
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        busy_times = [
            (datetime.fromisoformat(event['start']['dateTime'].replace('Z', '')).replace(tzinfo=utc),
             datetime.fromisoformat(event['end']['dateTime'].replace('Z', '')).replace(tzinfo=utc))
            for event in events.get('items', [])
            if 'dateTime' in event.get('start', {}) and 'dateTime' in event.get('end', {})
        ]

        # Parse work hours
        work_start_hour, work_start_minute = map(int, self.preferences["work_hours"]["start"].split(':'))
        work_end_hour, work_end_minute = map(int, self.preferences["work_hours"]["end"].split(':'))
        buffer = timedelta(minutes=self.preferences["buffer_minutes"])

        # Prepare to collect all available slots
        available_slots = []
        
        # Maximum number of slots to return
        max_slots = 10
        
        current = start_date
        while current + timedelta(minutes=duration) <= end_date and len(available_slots) < max_slots:
            slot_end = current + timedelta(minutes=duration)
            
            # Check if slot is within work hours
            slot_start_time = current.time()
            slot_end_time = slot_end.time()
            work_start = datetime.strptime(self.preferences["work_hours"]["start"], "%H:%M").time()
            work_end = datetime.strptime(self.preferences["work_hours"]["end"], "%H:%M").time()
            
            if slot_start_time < work_start or slot_end_time > work_end:
                current += timedelta(minutes=30)
                continue

            # Check if slot falls on a blocked day
            if current.strftime('%A') in self.preferences["blocked_days"]:
                # If current day is blocked, jump to next day at work start time
                next_day = current + timedelta(days=1)
                current = next_day.replace(hour=work_start_hour, minute=work_start_minute)
                continue

            # Check for conflicts with existing events, including buffer
            is_busy = any(
                (start - buffer <= slot_end) and (end + buffer >= current)
                for start, end in busy_times
            )
            
            if not is_busy:
                # Add this slot to available slots
                available_slots.append({"start": current.isoformat(), "end": slot_end.isoformat()})
                
                # Move to next slot time (add 30 minutes)
                current += timedelta(minutes=30)
            else:
                # If conflict, skip to after the conflicting event
                conflicting_events = [
                    (start, end) for start, end in busy_times 
                    if (start - buffer <= slot_end) and (end + buffer >= current)
                ]
                if conflicting_events:
                    # Find the latest ending conflicting event
                    latest_end = max(end for _, end in conflicting_events)
                    # Skip to after that event (with buffer)
                    current = latest_end + buffer
                else:
                    # Fallback - increase by 30 minutes
                    current += timedelta(minutes=30)
        
        if not available_slots:
            logger.warning("No available slots found")
        else:
            logger.info(f"Found {len(available_slots)} available slots")
            
        return available_slots