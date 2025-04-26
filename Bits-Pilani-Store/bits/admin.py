from django.contrib import admin
from .models import *

admin.site.register(Person)
admin.site.register(Hostel)
admin.site.register(Item)
admin.site.register(Image)
admin.site.register(Feedback)
admin.site.register(FeedbackImage)
admin.site.register(Category)