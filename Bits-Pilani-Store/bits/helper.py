import os
from dotenv import load_dotenv
from twilio.rest import Client
import urllib.parse
from django.db.models import Case, When, IntegerField, BooleanField, Value
from django.utils import timezone

load_dotenv()

account_sid = os.environ['TWILIO_ACCOUNT_SID']
auth_token = os.environ['TWILIO_AUTH_TOKEN']
client = Client(account_sid, auth_token)

def generate_whatsapp_link(phone_number, message=None):
    phone_number = get_clean_number(phone_number)
    phone_number = phone_number[1:]
    base_url = "https://wa.me/"
    if message:
      encoded_message = urllib.parse.quote(message)
      url = f"{base_url}{phone_number}?text={encoded_message}"
    else:
      url = f"{base_url}{phone_number}"
    return url

def get_clean_number(phone_number):
    phone_number = ''.join(filter(str.isdigit, phone_number))
    if len(phone_number) == 10:
        phone_number = f"+91{phone_number}"
    if phone_number.startswith("91"):
        phone_number = f"+{phone_number}"
    if phone_number.startswith("0"):
        phone_number = f"+91{phone_number[1:]}"
    return phone_number

def verify_phone_number(phone_number):
    service = client.verify.v2.services.create(friendly_name="Bits Pilani Pawnshop")
    return client.lookups.v2.phone_numbers(phone_number).fetch().valid

def items_sort(items_list):
    items_list = list(items_list)
    for item in items_list:
        item.is_recent = item.updated_at >= timezone.now() - timezone.timedelta(days=3)
        item.relevance_score = 1000 if not item.is_sold and item.is_recent else 500 if not item.is_sold else 0
    
    return sorted(items_list, key=lambda x: (x.relevance_score, x.updated_at), reverse=True)