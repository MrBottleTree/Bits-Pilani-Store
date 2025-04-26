from datetime import datetime
import os
import json
import logging
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from google.oauth2 import id_token
from google.auth.transport import requests
from django.contrib import messages
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from .models import *
from .forms import *
from . import helper
from user_agents import parse
from django.db.models import Q

banned_list = []

@csrf_exempt
def sign_in(request):
    if request.session.get('user_data') and Person.objects.filter(email=request.session.get('user_data')['email']).exists():
        return HttpResponseRedirect(reverse('home'))
    else:
        return render(request, 'bits/sign-in.html')

@csrf_exempt
def auth_receiver(request):
    token = request.POST['credential']
    user_data = id_token.verify_oauth2_token(token, requests.Request(), os.environ['GOOGLE_OAUTH_CLIENT_ID'], clock_skew_in_seconds = 10)
    request.session['user_data'] = user_data
    if not Person.objects.filter(email=user_data['email']).exists():
        person = Person(email=user_data['email'], name=user_data['name'])
        person.save()
    if user_data['email'] in banned_list:
        messages.error(request, "YOU'RE BANNED, CONTACT ADMIN TO RESOLVE!!")
        return render(request, 'bits/sign-in.html')
    return redirect('home')

def sign_out(request):
    del request.session['user_data']
    return HttpResponseRedirect(reverse('sign_in'))

install_logger = logging.getLogger("install_logger")

@csrf_exempt
def log_install(request):
    if request.method == "POST":
        ip = (
            request.META.get('HTTP_CF_CONNECTING_IP')
            or request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0]
            or request.META.get('REMOTE_ADDR')
        )
        ua_string = request.META.get('HTTP_USER_AGENT', '')
        user_agent = parse(ua_string)
        os = f"{user_agent.os.family} {user_agent.os.version_string}"
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        person = Person.objects.get(email=request.session.get('user_data')['email'])
        install_logger.info(f"{timestamp} | INSTALL | {person.id} - {person.name} | IP: {ip} | OS: {os}")
        return JsonResponse({"status": "ok"})
    return JsonResponse({"status": "error", "message": "Invalid method"}, status=400)


def add_product(request):
    if request.session.get('user_data') and Person.objects.filter(email=request.session.get('user_data')['email']).exists():
        person = Person.objects.get(email=request.session.get('user_data')['email'])

        if request.method == 'POST':
            form = ItemForm(request.POST, request.FILES, user=person)

            if form.is_valid():
                item = form.save(commit=False)
                item.seller = person

                whatsapp_number = form.cleaned_data.get('phone')
                hostel = form.cleaned_data.get('hostel')

                if whatsapp_number:
                    person.phone = whatsapp_number
                    person.save()

                if hostel:
                    person.hostel = hostel
                    person.save()

                item.hostel = person.hostel
                category = form.cleaned_data.get('category')
                item.category = category

                item.save()

                images = request.FILES.getlist('images')
                image_order = []
                if 'image_order' in request.POST and request.POST['image_order']:
                    try:
                        image_order = json.loads(request.POST['image_order'])
                    except Exception as e:
                        image_order = list(range(len(images)))
                else:
                    image_order = list(range(len(images)))
                if images:
                    for index in range(len(image_order)):
                        try:
                            image_file = images[int(image_order[index])]
                            image_instance = Image(
                                item=item,
                                image=image_file,
                                display_order=index
                            )
                            image_instance.save()
                        except IndexError:
                            print(f"IndexError: Invalid index in image_order for uploaded images.")
                
                elif 'image' in request.FILES:
                    image_file = request.FILES['image']
                    image_instance = Image(item=item, image=image_file, display_order=0)
                    image_instance.save()
                messages.success(request, "Product added successfully!")
                return redirect('my_listings')
            else:
                messages.error(request, "Please correct the errors below.")
                return render(request, 'bits/add_product.html', {'form': form})

        else:
            form = ItemForm(user=person)
            form.setdata(person.hostel, person.phone)

        return render(request, 'bits/add_product.html', {'form': form})
    else:
        return HttpResponseRedirect(reverse('sign_in'))
    
def home(request):
    if request.session.get('user_data') and Person.objects.filter(email=request.session.get('user_data')['email']).exists():
        current_user = Person.objects.get(email=request.session.get('user_data')['email'])
        
        category = request.GET.get('c')
        query = request.GET.get('q')
        selected_campus = request.GET.get('campus')
        
        items_query = Item.objects.all()
        
        if selected_campus == 'ALL':
            selected_campus = 'ALL'
            campus_filter = None
        elif selected_campus in ['GOA', 'HYD', 'PIL', 'DUB']:
            items_query = items_query.filter(seller__campus=selected_campus)
            campus_filter = selected_campus
        elif not selected_campus:
            if current_user.campus in ['GOA', 'HYD', 'PIL']:
                items_query = items_query.filter(seller__campus=current_user.campus)
                selected_campus = current_user.campus
                campus_filter = current_user.campus
            else:
                selected_campus = 'ALL'
                campus_filter = None
        
        if category:
            items_query = items_query.filter(Q(category__id=category))
        
        if query:
            items_query = items_query.filter(
                Q(name__icontains=query) | 
                Q(hostel__name__icontains=query) |
                Q(description__icontains=query) |
                Q(category__name__icontains=query)
            )
        
        all_items = items_query
        
        categories = Category.objects.all()
        categories_with_counts = []
        
        all_items_count = all_items.count()
        
        for cat in categories:
            cat_items = Item.objects.filter(category=cat)
            if campus_filter:
                cat_items = cat_items.filter(seller__campus=campus_filter)
            
            cat_dict = {
                'id': cat.id,
                'name': cat.name,
                'icon_class': cat.icon_class,
                'item_count': cat_items.count()
            }
            categories_with_counts.append(cat_dict)
        
        categories_with_counts = sorted(categories_with_counts, key=lambda x: x['item_count'], reverse=True)
        
        items = helper.items_sort(items_query)
        
        items_per_page = 16
        paginator = Paginator(list(items), items_per_page)
        page = request.GET.get('page')
        
        try:
            paginated_items = paginator.page(page)
        except PageNotAnInteger:
            paginated_items = paginator.page(1)
        except EmptyPage:
            paginated_items = paginator.page(paginator.num_pages)
            
        return render(request, "bits/home.html", {
            'user': current_user,
            'items': paginated_items,
            'is_paginated': True,
            'page_obj': paginated_items,
            'paginator': paginator,
            'selected_campus': selected_campus,
            'categories_with_counts': categories_with_counts,
            'all_items_count': all_items_count
        })
    else:
        return HttpResponseRedirect(reverse('sign_in'))
def item_detail(request, id):
    if request.session.get('user_data') and Person.objects.filter(email=request.session.get('user_data')['email']).exists():
        item = get_object_or_404(Item, id=id)
        
        similar_items = Item.objects.filter(
            hostel=item.hostel
        ).exclude(
            id=item.id
        ).order_by('-updated_at')[:5]
        
        context = {
            'item': item,
            'similar_items': similar_items,
        }
        
        return render(request, 'bits/item_detail.html', context)
    else:
        return redirect('sign_in')

def my_listings(request):
    if request.session.get('user_data') and Person.objects.filter(email=request.session.get('user_data')['email']).exists():
        person = Person.objects.get(email=request.session.get('user_data')['email'])
        listings = helper.items_sort(Item.objects.filter(seller=person))
        return render(request, 'bits/listings.html', {'listings': listings})
    else:
        return HttpResponseRedirect(reverse('sign_in'))

def delete_item(request, id):
    if request.session.get('user_data') and Person.objects.filter(email=request.session.get('user_data')['email']).exists():
        item = get_object_or_404(Item, id=id)
        if item.seller.email == request.session.get('user_data')['email']:
            images = Image.objects.filter(item=item)
            for image in images:
                image.image.delete(save=False)
                image.delete()
            item.delete()
        return redirect('my_listings')
    else:
        return HttpResponseRedirect(reverse('sign_in'))

def edit_item(request, id):
    try:
        item = Item.objects.get(id=id)
        
        if request.session.get('user_data') and Person.objects.filter(email=request.session.get('user_data')['email']).exists():
            person = Person.objects.get(email=request.session.get('user_data')['email'])
            
            if item.seller != person:
                messages.error(request, "You can only edit your own items.")
                return redirect('home')
                
            existing_images = [
                {
                    'id': img.id,
                    'url': img.image.url,
                    'display_order': img.display_order
                } for img in item.images.all().order_by('display_order')
            ]
            
            existing_images_json = json.dumps(existing_images)
            
            if request.method == 'POST':
                form = ItemForm(request.POST, request.FILES, instance=item, user=person)
                
                if form.is_valid():
                    updated_item = form.save(commit=False)
                    
                    whatsapp_number = form.cleaned_data.get('phone')
                    hostel = form.cleaned_data.get('hostel')
                    
                    if whatsapp_number:
                        person.phone = whatsapp_number
                        person.save()
                    
                    if hostel:
                        person.hostel = hostel
                        person.save()
                    
                    updated_item.hostel = person.hostel
                    updated_item.save()
                    
                    try:
                        image_order_raw = request.POST.get('image_order', '{}')
                        image_order_data = json.loads(image_order_raw)
                        
                        existing_images = list(item.images.all())
                        existing_image_ids = [img.id for img in existing_images]
                        
                        if isinstance(image_order_data, dict):
                            existing_ids = image_order_data.get('existing', [])

                            to_delete = [img for img in existing_images if img.id not in existing_ids]
                            for img in to_delete:
                                img.image.delete(save=False)
                                img.delete()
                            
                            new_images = request.FILES.getlist('images')
                            new_image_order = image_order_data.get('new', list(range(len(new_images))))
                            
                            final_order = []
                            
                            for img in item.images.all():
                                img.display_order = -1
                                img.save()
                            
                            for idx, img_id in enumerate(existing_ids):
                                try:
                                    img = Image.objects.get(id=img_id, item=item)
                                    img.display_order = idx
                                    img.save()
                                    final_order.append(('existing', img_id))
                                except Image.DoesNotExist:
                                    continue
                            
                            for idx, img_idx in enumerate(new_image_order):
                                if img_idx < len(new_images):
                                    new_img = Image.objects.create(
                                        item=item,
                                        image=new_images[img_idx],
                                        display_order=len(existing_ids) + idx
                                    )
                                    final_order.append(('new', new_img.id))

                            if 'combined_order' in image_order_data:
                                combined_order = image_order_data['combined_order']
                                all_images = list(item.images.all())
                                
                                for img in all_images:
                                    img.display_order = -1
                                    img.save()
                                
                                for idx, img_info in enumerate(combined_order):
                                    img_type, img_id = img_info
                                    if img_type == 'existing':
                                        try:
                                            img = Image.objects.get(id=img_id, item=item)
                                            img.display_order = idx
                                            img.save()
                                        except Image.DoesNotExist:
                                            continue
                        else:
                            for img in existing_images:
                                img.image.delete(save=False)
                                img.delete()
                            new_images = request.FILES.getlist('images')
                            for idx, img in enumerate(new_images):
                                Image.objects.create(
                                    item=item,
                                    image=img,
                                    display_order=idx
                                )
                    
                    except Exception as e:
                        import traceback
                        traceback.print_exc()
                    
                    messages.success(request, "Item updated successfully!")
                    return redirect('my_listings')
                else:
                    return render(request, 'bits/add_product.html', {
                        'form': form,
                        'item': item,
                        'existing_images_json': existing_images_json
                    })
            else:
                form = ItemForm(instance=item, user=person)
                
                return render(request, 'bits/add_product.html', {
                    'form': form,
                    'item': item,
                    'existing_images_json': existing_images_json
                })
        else:
            return redirect('sign_in')
    except Item.DoesNotExist:
        messages.error(request, "Item not found.")
        return redirect('home')

def feedback(request):
    if request.session.get('user_data') and Person.objects.filter(email=request.session.get('user_data')['email']).exists():
        person = Person.objects.get(email=request.session.get('user_data')['email'])
        
        if request.method == 'POST':
            form = FeedbackForm(request.POST)
            
            if form.is_valid():
                feedback = form.save(commit=False)
                feedback.person = person
                feedback.save()
                
                images = request.FILES.getlist('images')
                for image in images:
                    FeedbackImage.objects.create(
                        feedback=feedback,
                        image=image
                    )
                
                messages.success(request, "Thank you for your feedback!")
                return redirect('home')
        else:
            form = FeedbackForm()
            
        return render(request, 'bits/feedback.html', {'form': form})
    else:
        return redirect('sign_in')

def marksold(request, id):
    if request.session.get('user_data') and Person.objects.filter(email=request.session.get('user_data')['email']).exists():
        if Item.objects.filter(id=id).exists():
            item = Item.objects.get(id=id)
            item.is_sold = True
            item.save()
        return redirect('my_listings')
    else:
        return redirect("sign_in")
    
def about_us(request):
    return render(request, 'bits/about.html')

def categories(request):
    if request.session.get('user_data') and Person.objects.filter(email=request.session.get('user_data')['email']).exists():
        return render(request, 'bits/categories.html', {'categories': Category.objects.all()})
    else:
        return redirect('sign_in')

def bypass(request):  
    category = request.GET.get('c')
    query = request.GET.get('q')
    selected_campus = request.GET.get('campus')
    
    items_query = Item.objects.all()
    
    if selected_campus == 'ALL':
        selected_campus = 'ALL'
        campus_filter = None
    elif selected_campus in ['GOA', 'HYD', 'PIL', 'DUB']:
        items_query = items_query.filter(seller__campus=selected_campus)
        campus_filter = selected_campus
    elif not selected_campus:
        selected_campus = 'ALL'
        campus_filter = None
    
    if category:
        items_query = items_query.filter(Q(category__id=category))
    
    if query:
        items_query = items_query.filter(
            Q(name__icontains=query) | 
            Q(hostel__name__icontains=query) |
            Q(description__icontains=query) |
            Q(category__name__icontains=query)
        )
    
    all_items = items_query
    
    categories = Category.objects.all()
    categories_with_counts = []
    
    all_items_count = all_items.count()
    
    for cat in categories:
        cat_items = Item.objects.filter(category=cat)
        if campus_filter:
            cat_items = cat_items.filter(seller__campus=campus_filter)
        
        cat_dict = {
            'id': cat.id,
            'name': cat.name,
            'icon_class': cat.icon_class,
            'item_count': cat_items.count()
        }
        categories_with_counts.append(cat_dict)
    
    categories_with_counts = sorted(categories_with_counts, key=lambda x: x['item_count'], reverse=True)
    
    items = helper.items_sort(items_query)
    
    items_per_page = 16
    paginator = Paginator(list(items), items_per_page)
    page = request.GET.get('page')
    
    try:
        paginated_items = paginator.page(page)
    except PageNotAnInteger:
        paginated_items = paginator.page(1)
    except EmptyPage:
        paginated_items = paginator.page(paginator.num_pages)
        
    return render(request, "bits/home.html", {
        'user': None,
        'items': paginated_items,
        'is_paginated': True,
        'page_obj': paginated_items,
        'paginator': paginator,
        'selected_campus': selected_campus,
        'categories_with_counts': categories_with_counts,
        'all_items_count': all_items_count
    })

def custom_page_not_found(request, exception):
    return render(request, 'bits/404.html', status=404)

def custom_server_error(request):
    return render(request, 'bits/500.html', status=500)

def repost(request, id):
    if request.session.get('user_data') and Person.objects.filter(email=request.session.get('user_data')['email']).exists():
        person = Person.objects.get(email=request.session.get('user_data')['email'])
        item = get_object_or_404(Item, id=id)
        
        if item.seller != person:
            messages.error(request, "You can only repost your own items.")
            return redirect('home')

        item.is_sold = False
        item.hostel = person.hostel
        item.save(change_time=True)
        source = request.GET.get('source')
        messages.success(request, f"'{item.name}' has been reposted successfully!")
        print(source)
        if source == 'home':
            return redirect('home')
        else:
            return redirect('my_listings')
    else:
        return redirect('sign_in')

@csrf_exempt
def bulk_action(request, action):
    if request.session.get('user_data') and Person.objects.filter(email=request.session.get('user_data')['email']).exists():
        if request.method == 'POST':
            person = Person.objects.get(email=request.session.get('user_data')['email'])
            selected_items = request.POST.get('selected_items', '').split(',')
            
            items = Item.objects.filter(id__in=selected_items, seller=person)
            
            if not items:
                messages.error(request, "No valid items were selected.")
                return redirect('my_listings')
            
            if action == 'repost':
                count = 0
                for item in items:
                    item.is_sold = False
                    item.hostel = person.hostel
                    item.save()
                    count += 1
                messages.success(request, f"Successfully reposted {count} item(s).")
                
            elif action == 'toggle_sold':
                count = 0
                for item in items:
                    item.is_sold = not item.is_sold
                    item.save(change_time=False)
                    count += 1
                messages.success(request, f"Successfully toggled sold status for {count} item(s).")
                
            elif action == 'delete':
                count = 0
                for item in items:
                    images = Image.objects.filter(item=item)
                    for image in images:
                        image.image.delete(save=False)
                        image.delete()
                    item.delete()
                    count += 1
                messages.success(request, f"Successfully deleted {count} item(s).")
            
            return redirect('my_listings')
    else:
        return redirect('sign_in')

def terms(request):
    return render(request, 'bits/terms.html')