from django.apps import AppConfig


class BitsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'bits'

    def ready(self):
        import bits.signals