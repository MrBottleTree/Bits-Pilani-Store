from django.db import models
from . import helper
from django.utils import timezone

class Campus(models.TextChoices):
    GOA = 'GOA', 'Goa'
    HYDERABAD = 'HYD', 'Hyderabad'
    PILANI = 'PIL', 'Pilani'
    DUBAI = 'DUB', 'Dubai'
    OTHERS = 'OTH', 'Others'
    Gmail = 'GMAIL', 'Gmail'

class Person(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, null=False)
    email = models.EmailField(null=False)
    phone = models.CharField(max_length=20, null=True)
    campus = models.CharField(max_length=5, choices=Campus.choices, null=False)
    hostel = models.ForeignKey('Hostel', on_delete=models.CASCADE, related_name='residents', null=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        campus_code = self.email.split('@')[1].split('.')[0].upper()[:3]
        self.phone = helper.get_clean_number(self.phone) if self.phone else None
        if campus_code in Campus.values:
            self.campus = campus_code
        else:
            self.campus = Campus.OTHERS
        super().save(*args, **kwargs)
        for item in self.items.all():
            item.save(change_time = False)

    @property
    def year(self):
        return int(self.email[1:5])

    def __str__(self):
        return f"{self.name}"
    
class Hostel(models.Model):
    name = models.CharField(max_length=100, primary_key=True)
    campus = models.CharField(max_length=5, choices=Campus.choices, null=False, default=Campus.GOA)

    def __str__(self):
        return f"{self.name}"

class Category(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, null=False)
    icon_class = models.CharField(max_length=100, null=True, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name}"

class Item(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, null=False)
    description = models.TextField(null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=False)
    seller = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='items', null=False)
    is_sold = models.BooleanField(default=False)
    whatsapp = models.URLField(max_length=200, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items', null=False)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(default=timezone.now)
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name='items', null=False)
    phone = models.CharField(max_length=20, null=True, blank=True)

    def save(self, *args, change_time = True, **kwargs):
        effective_phone = self.phone or self.seller.phone
        self.phone = helper.get_clean_number(effective_phone) if effective_phone else None
        effective_phone = self.phone
        if effective_phone:
            self.whatsapp = helper.generate_whatsapp_link(
                effective_phone,
                f"Hello, I am interested in buying {self.name}. Is it available?"
            )
        else:
            self.whatsapp = None
        self.price = abs(self.price)
        if change_time:
            self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name}-{self.seller}"
    
class Image(models.Model):
    id = models.AutoField(primary_key=True)
    image = models.ImageField(upload_to='images/', null=False)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='images', null=False)
    added_at = models.DateTimeField(auto_now_add=True)
    display_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['display_order']

    def delete(self, *args, **kwargs):
        self.image.delete(save=False)
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.item}-{self.display_order}"
    
class Feedback(models.Model):
    id = models.AutoField(primary_key=True)
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='feedbacks', null=False)
    message = models.TextField(null=False)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.person}-{self.added_at}"

class FeedbackImage(models.Model):
    id = models.AutoField(primary_key=True)
    image = models.ImageField(upload_to='feedbacks/', null=False)
    feedback = models.ForeignKey(Feedback, on_delete=models.CASCADE, related_name='images', null=False)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.feedback}"