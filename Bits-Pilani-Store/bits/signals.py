from django.db.models.signals import pre_delete
from django.dispatch import receiver
from .models import Image

@receiver(pre_delete, sender=Image)
def delete_image_file(sender, instance, **kwargs):
    if instance.image:
        instance.image.delete(save=False)