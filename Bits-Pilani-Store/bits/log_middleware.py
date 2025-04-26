import logging
import requests
from datetime import datetime
from bits.models import Person
from user_agents import parse

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger("request_logger")

    def __call__(self, request):
        email = None
        person = None
        person_info = "-1 None"

        if request.session.get('user_data'):
            email = request.session['user_data'].get('email')
            person = Person.objects.filter(email=email).first()
            if person:
                person_info = f"{person.id}, {person.name}"

        ip = self.get_client_ip(request)
        path = request.get_full_path()
        method = request.method
        ua_string = request.META.get('HTTP_USER_AGENT', '')
        user_agent = parse(ua_string)
        browser = f"{user_agent.browser.family} {user_agent.browser.version_string}"
        os = f"{user_agent.os.family} {user_agent.os.version_string}"
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        if email != "f20230352@goa.bits-pilani.ac.in":
            self.logger.info(f"{timestamp}| {method} | {person_info} | {browser} | {os} | {ip} | {path}")
        return self.get_response(request)

    def get_client_ip(self, request):
        return (
            request.META.get('HTTP_CF_CONNECTING_IP')
            or request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0]
            or request.META.get('REMOTE_ADDR')
        )

    def get_location(self, ip):
        try:
            res = requests.get(f"http://ip-api.com/json/{ip}", timeout=1)
            data = res.json()
            return data.get('lat'), data.get('lon')
        except Exception:
            return None, None
