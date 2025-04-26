from django import forms
from .models import *

class ItemForm(forms.ModelForm):
    class Meta:
        model = Item
        fields = ['name', 'description', 'price', 'category', 'hostel', 'phone']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
            'category': forms.Select(choices=[(category.id, category.name) for category in Category.objects.all()]),
            'phone': forms.TextInput(attrs={'placeholder': '(WhatsApp) Required if not provided one before'})
        }
        labels = {
            'name': 'Product Name',
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        if self.user and self.user.campus:
            campus_hostels = Hostel.objects.filter(campus=self.user.campus)
            self.fields['hostel'].widget.choices = [(hostel.name, hostel.name) for hostel in campus_hostels]
        else:
            self.fields['hostel'].widget.choices = [(hostel.name, hostel.name) for hostel in Hostel.objects.all()]
        
        self.fields['hostel'].required = not self.user.hostel
        self.fields['phone'].required = not self.user.phone

    def clean(self):
        cleaned_data = super().clean()
        whatsapp_number = cleaned_data.get('phone')
        hostel = cleaned_data.get('hostel')

        if not self.user.phone and not whatsapp_number:
            self.add_error('phone', "WhatsApp number is required as you haven't provided one before.")

        if not self.user.hostel and not hostel:
            self.add_error('hostel', "Hostel is required as you haven't provided one before.")

        return cleaned_data
    
    def setdata(self, hostel, phone):
        self.fields['hostel'].initial = hostel
        self.fields['phone'].initial = phone

class FeedbackForm(forms.ModelForm):
    class Meta:
        model = Feedback
        fields = ['message']
        widgets = {
            'message': forms.Textarea(attrs={
                'rows': 5, 
                'placeholder': 'Share your thoughts, suggestions, or report any issues you encountered...'
            }),
        }